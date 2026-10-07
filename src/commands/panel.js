/**
 * Panel commands (Pterodactyl + Cloudflare + VPS)
 *
 * Premium / Owner : .1gb … .10gb, .unli, .cpanel
 * Owner saja      : .listpanel, .delpanel, .cadmin, .listadmin, .deladmin, .subdomain,
 *                   .installpanel, .startwings, .uninstallpanel, .addprem, .delprem, .listprem
 */
const crypto = require('crypto');
const config = require('../config');
const brand = require('../utils/brand');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');
const premium = require('../utils/premium');
const ptero = require('../utils/panelApi');
const pcfg = require('../utils/panelConfig');

// ======================= [ Konstanta ] =======================
// RAM/Disk dalam MB, CPU dalam % (100 = 1 core). 0 = unlimited. Ubah sesuai kebutuhan.
const SIZES = { unli: { ram: 0, disk: 0, cpu: 0 } };
for (let n = 1; n <= 10; n++) {
    SIZES[`${n}gb`] = { ram: n * 1024, disk: n * 1024, cpu: 40 + (n - 1) * 20 };
}

const USERNAME_RE = /^[a-z0-9]{3,20}$/;
const HOST_RE = /^[a-z0-9]([a-z0-9-]{0,40}[a-z0-9])?$/;
const DOMAIN_RE = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;
const IPV4_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

const MSG = {
    owner: '❌ Fitur ini khusus *Owner*.',
    premium: '❌ Fitur ini khusus *Premium* / Owner. Hubungi owner untuk dijadikan premium.',
};

// ======================= [ Helper ] =======================
const digits = (jid) => String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');

function normalizeNumber(raw) {
    let n = String(raw || '').replace(/\D/g, '');
    if (n.startsWith('0')) n = '62' + n.slice(1);
    else if (n.startsWith('8')) n = '62' + n;
    return n;
}

function unwrap(message) {
    let cur = message;
    for (let i = 0; i < 4 && cur; i++) {
        const inner = cur.ephemeralMessage?.message
            || cur.viewOnceMessage?.message
            || cur.viewOnceMessageV2?.message
            || cur.documentWithCaptionMessage?.message;
        if (!inner) break;
        cur = inner;
    }
    return cur;
}

// target dari mention / reply
function mentionedOrQuoted(msg) {
    const c = unwrap(msg.message);
    const ctx = c?.extendedTextMessage?.contextInfo
        || c?.imageMessage?.contextInfo
        || c?.videoMessage?.contextInfo;
    return digits(ctx?.mentionedJid?.[0] || ctx?.participant || '');
}

// semua kandidat ID pengirim (nomor biasa atau LID) untuk cek premium
function senderIds(m) {
    return [m.senderNumber, digits(m.msg.key.participant), digits(m.msg.key.remoteJid)].filter(Boolean);
}

const genPassword = () => crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, 'x').slice(0, 12);
const lim = (v, unit) => (v === 0 ? 'Unlimited' : `${v} ${unit}`);
const splitArgs = (s) => String(s || '').split(/[,|]/).map((v) => v.trim()).filter(Boolean);

function fmtExp(exp) {
    if (!exp) return 'Permanen';
    return new Date(exp).toLocaleString('id-ID', { timeZone: config.timezone || 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });
}

// kirim chunk teks panjang
async function replyChunks(m, header, rows, per = 20) {
    for (let i = 0; i < rows.length; i += per) {
        await m.reply({ text: (i === 0 ? header + '\n\n' : '') + rows.slice(i, i + per).join('\n\n') });
    }
}

// cek config panel; balas error kalau belum lengkap
async function panelReady(m) {
    const miss = pcfg.missing();
    if (!miss.length) return true;
    await m.reply({ text: `❌ Config panel belum lengkap di config.js: *${miss.join(', ')}*` });
    return false;
}

// kirim detail akun: ke nomor target, atau ke private chat pengirim (kalau di grup)
async function sendCreds(m, number, text) {
    const { Hanz, msg, sender } = m;
    const dm = msg.key.participant || sender;

    if (number) {
        try {
            await Hanz.sendMessage(`${number}@s.whatsapp.net`, { text });
            return m.reply({ text: `✅ Berhasil. Detail akun sudah dikirim ke wa.me/${number}` });
        } catch (e) {
            console.error('[PANEL] gagal kirim ke target:', e?.message || e);
            await Hanz.sendMessage(dm, { text });
            return m.reply({ text: '⚠️ Gagal kirim ke nomor itu, detail akun dikirim ke private chat kamu.' });
        }
    }
    if (m.isGroup) {
        await Hanz.sendMessage(dm, { text });
        return m.reply({ text: '✅ Berhasil. Detail akun dikirim ke private chat kamu.' });
    }
    return m.reply({ text });
}

// jalankan di background supaya bot tetap responsif (install bisa 10-20 menit)
function background(label, fn) {
    fn().catch((e) => console.error(`[${label}]`, e?.message || e));
}

// ======================= [ Buat panel ] =======================
async function createPanelFlow(m, { username, limits, number }) {
    if (!(await panelReady(m))) return;
    if (!USERNAME_RE.test(username || '')) {
        return m.reply({ text: '❌ Username harus 3–20 karakter, huruf kecil/angka saja, tanpa spasi.' });
    }

    await m.react('⏳');
    const password = genPassword();
    try {
        const { user, server } = await ptero.createPanel({ username, password, limits });
        const c = pcfg.get();
        const text =
`✅ *PANEL BERHASIL DIBUAT*

🌐 Login   : ${c.domain}
👤 Username: ${user.username}
🔑 Password: ${password}
🆔 Server  : ${server.id}

💾 RAM  : ${lim(limits.ram, 'MB')}
📀 Disk : ${lim(limits.disk, 'MB')}
⚙️ CPU  : ${limits.cpu === 0 ? 'Unlimited' : limits.cpu + '%'}

_Simpan data ini & segera ganti password._`;
        await sendCreds(m, number, text);
        await m.react('✅');
    } catch (e) {
        console.error('[PANEL create]', e?.message || e);
        await m.react('❌');
        await m.reply({ text: `❌ Gagal membuat panel: ${e.message}` });
    }
}

// ======================= [ Command ] =======================
const handler = async (m) => {
    const { command, msg, sender, Hanz } = m;
    const p = config.prefix;
    const owner = m.isOwner;
    const canCreate = owner || premium.isPremium(senderIds(m));

    const userJid = msg.key.participant || msg.key.remoteJid || sender;
    const tag = userJid.split('@')[0].split(':')[0];
    const args = splitArgs(command.fullArgs);
    // perintah SSH: pemisah hanya '|' supaya password root boleh mengandung koma
    const pipeArgs = String(command.fullArgs || '').split('|').map((v) => v.trim()).filter(Boolean);

    switch (command.name) {
        case 'panelmenu': {
            const text =
` ┌─ ✧ *PANEL MENU* (Premium/Owner)
 │ ⊳ ${p}1gb – ${p}10gb
 │ ⊳ ${p}unli
 │ ⊳ ${p}cpanel
 └───────────────

 ┌─ ✧ *PANEL MENU* (Owner)
 │ ⊳ ${p}listpanel
 │ ⊳ ${p}delpanel
 │ ⊳ ${p}cadmin
 │ ⊳ ${p}listadmin
 │ ⊳ ${p}deladmin
 │ ⊳ ${p}subdomain
 │ ⊳ ${p}installpanel
 │ ⊳ ${p}startwings
 │ ⊳ ${p}uninstallpanel
 │ ⊳ ${p}addprem
 │ ⊳ ${p}delprem
 │ ⊳ ${p}listprem
 └───────────────`;

            await deliver(m, {
                text,
                footer: brand.footer,
                buttons: [categoryButton()],
                userJid,
                video: null
            });
            break;
        }

        // ---------- Premium (owner) ----------
        case 'addprem': {
            if (!owner) return m.reply({ text: MSG.owner });

            const sp = command.args.filter(Boolean); // addprem pakai spasi: .addprem 628xxx 30
            const idx = sp.findIndex((a) => a.replace(/\D/g, '').length >= 8);
            const number = idx >= 0 ? normalizeNumber(sp[idx]) : mentionedOrQuoted(msg);
            const rest = sp.filter((_, i) => i !== idx);
            const days = parseInt(rest[0], 10) || 0;

            if (!number) {
                return m.reply({ text: `Contoh:\n${p}addprem 628123456789 30\n${p}addprem @tag\n(angka terakhir = lama premium dalam hari, kosong = permanen)` });
            }
            const exp = premium.add(number, days);
            await m.reply({ text: `✅ *${number}* sekarang Premium.\nBerlaku: ${fmtExp(exp)}` });
            break;
        }

        case 'delprem': {
            if (!owner) return m.reply({ text: MSG.owner });
            const number = command.args[0] ? normalizeNumber(command.args[0]) : mentionedOrQuoted(msg);
            if (!number) return m.reply({ text: `Contoh: ${p}delprem 628123456789` });
            await m.reply({ text: premium.del(number) ? `✅ Premium *${number}* dihapus.` : '❌ Nomor itu tidak ada di daftar premium.' });
            break;
        }

        case 'listprem': {
            if (!owner) return m.reply({ text: MSG.owner });
            const list = premium.list();
            if (!list.length) return m.reply({ text: 'Belum ada user premium.' });
            await m.reply({ text: `*DAFTAR PREMIUM* (${list.length})\n\n` + list.map((u, i) => `${i + 1}. ${u.number}\n   ⏳ ${fmtExp(u.exp)}`).join('\n') });
            break;
        }

        // ---------- Buat panel (premium / owner) ----------
        case '1gb':
        case '2gb':
        case '3gb':
        case '4gb':
        case '5gb':
        case '6gb':
        case '7gb':
        case '8gb':
        case '9gb':
        case '10gb':
        case 'unli': {
            if (!canCreate) return m.reply({ text: MSG.premium });
            if (!args[0]) return m.reply({ text: `Contoh:\n${p}${command.name} username\n${p}${command.name} username,628123456789\n(nomor opsional: detail akun dikirim ke nomor itu)` });
            await createPanelFlow(m, {
                username: args[0].toLowerCase(),
                limits: SIZES[command.name],
                number: args[1] ? normalizeNumber(args[1]) : null,
            });
            break;
        }

        case 'cpanel': {
            if (!canCreate) return m.reply({ text: MSG.premium });
            const [user, ram, disk, cpu, num] = args;
            const nums = [ram, disk, cpu].map((v) => Number(v));
            if (!user || nums.some((v) => !Number.isFinite(v) || v < 0)) {
                return m.reply({ text: `Panel custom (RAM & Disk dalam MB, CPU dalam %, 0 = unlimited)\nContoh:\n${p}cpanel username,2048,2048,80\n${p}cpanel username,2048,2048,80,628123456789` });
            }
            await createPanelFlow(m, {
                username: user.toLowerCase(),
                limits: { ram: nums[0], disk: nums[1], cpu: nums[2] },
                number: num ? normalizeNumber(num) : null,
            });
            break;
        }

        // ---------- List / hapus panel (owner) ----------
        case 'listpanel': {
            if (!owner) return m.reply({ text: MSG.owner });
            if (!(await panelReady(m))) return;
            try {
                await m.react('⏳');
                const servers = await ptero.getAll('/servers');
                if (!servers.length) return m.reply({ text: 'Belum ada server panel.' });
                const rows = servers.map((s, i) => {
                    const a = s.attributes;
                    return `*${i + 1}. ${a.name}*\n🆔 ${a.id} • 👤 user ${a.user}\n💾 ${lim(a.limits.memory, 'MB')} • 📀 ${lim(a.limits.disk, 'MB')} • ⚙️ ${a.limits.cpu === 0 ? '∞' : a.limits.cpu + '%'}${a.suspended ? '\n⛔ Suspended' : ''}`;
                });
                await replyChunks(m, `*LIST PANEL* (${servers.length} server)`, rows);
                await m.react('✅');
            } catch (e) {
                console.error('[LISTPANEL]', e?.message || e);
                await m.reply({ text: `❌ Gagal mengambil data: ${e.message}` });
            }
            break;
        }

        case 'delpanel': {
            if (!owner) return m.reply({ text: MSG.owner });
            if (!(await panelReady(m))) return;
            try {
                const id = args[0];
                if (!id) {
                    const servers = await ptero.getAll('/servers');
                    if (!servers.length) return m.reply({ text: 'Belum ada server panel.' });
                    const rows = servers.map((s) => `📡 ${s.attributes.name} — ID: *${s.attributes.id}*`);
                    return replyChunks(m, `*⚠️ HAPUS USER & SERVER PANEL*\nPilih ID lalu ketik: ${p}delpanel <id>`, rows, 40);
                }
                if (!/^\d+$/.test(id)) return m.reply({ text: `❌ ID harus angka. Contoh: ${p}delpanel 12` });

                await m.react('⏳');
                const r = await ptero.deletePanel(id);
                await m.reply({ text: `✅ Server *${r.name}* (ID ${id}) dihapus.\n${r.userDeleted ? `👤 User ${r.userId} ikut dihapus.` : `👤 User ${r.userId} dipertahankan (masih punya server lain / admin).`}` });
                await m.react('✅');
            } catch (e) {
                console.error('[DELPANEL]', e?.message || e);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal menghapus: ${e.message}` });
            }
            break;
        }

        // ---------- Admin panel (owner) ----------
        case 'cadmin': {
            if (!owner) return m.reply({ text: MSG.owner });
            if (!(await panelReady(m))) return;
            const username = (args[0] || '').toLowerCase();
            if (!USERNAME_RE.test(username)) {
                return m.reply({ text: `Contoh: ${p}cadmin username\n${p}cadmin username,628123456789\n(username 3–20 karakter, huruf kecil/angka)` });
            }
            try {
                await m.react('⏳');
                const password = genPassword();
                const user = await ptero.createUser({ username, password, admin: true });
                const text =
`✅ *ADMIN PANEL BERHASIL DIBUAT*

🌐 Login   : ${pcfg.get().domain}
👤 Username: ${user.username}
🔑 Password: ${password}
🆔 User ID : ${user.id}
🛡️ Role    : Root Admin`;
                await sendCreds(m, args[1] ? normalizeNumber(args[1]) : null, text);
                await m.react('✅');
            } catch (e) {
                console.error('[CADMIN]', e?.message || e);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal membuat admin: ${e.message}` });
            }
            break;
        }

        case 'listadmin': {
            if (!owner) return m.reply({ text: MSG.owner });
            if (!(await panelReady(m))) return;
            try {
                const admins = (await ptero.getAll('/users')).filter((u) => u.attributes.root_admin);
                if (!admins.length) return m.reply({ text: 'Belum ada admin panel.' });
                const rows = admins.map((u, i) => `*${i + 1}. ${u.attributes.username}*\n🆔 ${u.attributes.id} • 📧 ${u.attributes.email}`);
                await replyChunks(m, `*LIST ADMIN PANEL* (${admins.length})`, rows);
            } catch (e) {
                console.error('[LISTADMIN]', e?.message || e);
                await m.reply({ text: `❌ Gagal mengambil data: ${e.message}` });
            }
            break;
        }

        case 'deladmin': {
            if (!owner) return m.reply({ text: MSG.owner });
            if (!(await panelReady(m))) return;
            const id = args[0];
            if (!id || !/^\d+$/.test(id)) return m.reply({ text: `Contoh: ${p}deladmin <id>\n(lihat ID lewat ${p}listadmin)` });
            try {
                const u = await ptero.api('GET', `/users/${id}`);
                if (!u.attributes.root_admin) {
                    return m.reply({ text: `❌ User *${u.attributes.username}* bukan admin. Untuk user biasa pakai ${p}delpanel.` });
                }
                await ptero.api('DELETE', `/users/${id}`);
                await m.reply({ text: `✅ Admin *${u.attributes.username}* (ID ${id}) dihapus.` });
            } catch (e) {
                console.error('[DELADMIN]', e?.message || e);
                await m.reply({ text: `❌ Gagal menghapus admin: ${e.message}` });
            }
            break;
        }

        // ---------- Subdomain Cloudflare (owner) ----------
        case 'subdomain': {
            if (!owner) return m.reply({ text: MSG.owner });
            const domains = Object.keys(pcfg.get().subdomain);
            if (!domains.length) return m.reply({ text: '❌ Belum ada domain di config.subdomain.' });

            const [host, ip, domain] = args;
            if (!host || !ip) {
                return m.reply({ text: `Contoh: ${p}subdomain host|ip\n${p}subdomain host|ip|domain\n\n*Domain tersedia:*\n${domains.map((d) => `• ${d}`).join('\n')}` });
            }
            const h = host.toLowerCase();
            if (!HOST_RE.test(h)) return m.reply({ text: '❌ Hostname hanya boleh huruf kecil, angka, dan tanda minus.' });
            if (!IPV4_RE.test(ip) && !(ip.includes(':') && /^[0-9a-f:]+$/i.test(ip))) {
                return m.reply({ text: '❌ IP tidak valid.' });
            }

            // belum pilih domain → tampilkan tombol
            if (!domain) {
                const buttons = domains.map((d) => ({
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: `🌐 ${d}`, id: `${p}subdomain ${h}|${ip}|${d}` })
                }));
                const text = `*Subdomain Information*\n\n⌯ Hostname: ${h}\n⌯ IP: ${ip}\n\nPilih domain server:`;
                try {
                    return await m.sendInteractive({ text, footer: brand.footer || '', buttons });
                } catch (e) {
                    console.error('[SUBDOMAIN] tombol gagal:', e?.message || e);
                    return m.reply({ text: `${text}\n\n${domains.map((d) => `${p}subdomain ${h}|${ip}|${d}`).join('\n')}` });
                }
            }

            if (!domains.includes(domain)) return m.reply({ text: `❌ Domain tidak terdaftar.\nTersedia: ${domains.join(', ')}` });
            try {
                await m.react('⏳');
                const r = await ptero.createDnsRecord(domain, h, ip);
                await m.reply({ text: `✅ *Subdomain berhasil dibuat*\n\n🌐 ${r.name}\n📍 ${r.ip}\n\n_Propagasi DNS bisa beberapa menit._` });
                await m.react('✅');
            } catch (e) {
                console.error('[SUBDOMAIN]', e?.message || e);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal membuat subdomain: ${e.message}` });
            }
            break;
        }

        // ---------- Install panel di VPS (owner) ----------
        case 'installpanel': {
            if (!owner) return m.reply({ text: MSG.owner });
            const [ip, pass, domain] = pipeArgs;
            if (!ip || !pass || !domain) {
                return m.reply({ text: `Install Pterodactyl Panel otomatis di VPS *kosong* (Ubuntu 22.04/24.04 / Debian 12)\n\nContoh:\n${p}installpanel 1.2.3.4|passwordroot|panel.domainmu.com\n\n⚠️ Arahkan DNS domain ke IP VPS dulu (bisa pakai ${p}subdomain) supaya SSL berhasil.` });
            }
            if (!IPV4_RE.test(ip)) return m.reply({ text: '❌ IP VPS tidak valid.' });
            if (!DOMAIN_RE.test(domain)) return m.reply({ text: '❌ Domain panel tidak valid.' });

            const adminPass = genPassword();
            const dbPass = crypto.randomBytes(16).toString('hex');
            const adminUser = 'admin';
            const script = ptero.loadScript('install-panel.sh', {
                FQDN: domain.toLowerCase(),
                DB_PASS: dbPass,
                ADMIN_USER: adminUser,
                ADMIN_PASS: adminPass,
                ADMIN_EMAIL: `admin@${domain.toLowerCase()}`,
            });

            await m.reply({ text: `⏳ Instalasi panel dimulai di *${ip}*.\nIni bisa memakan waktu *10–20 menit*. Hasilnya dikirim ke private chat kamu.` });
            const dm = msg.key.participant || sender;

            background('INSTALLPANEL', async () => {
                try {
                    const { code, output } = await ptero.sshRun({ host: ip, password: pass, script });
                    const ok = code === 0 && /INSTALL_OK/.test(output);
                    const url = (output.match(/INSTALL_OK (\S+)/) || [])[1] || `https://${domain}`;
                    await Hanz.sendMessage(dm, { text: ok
                        ? `✅ *PANEL TERINSTALL*\n\n🌐 ${url}\n👤 Username: ${adminUser}\n🔑 Password: ${adminPass}\n\n${/SSL gagal/.test(output) ? '⚠️ SSL gagal (DNS belum mengarah?), panel jalan lewat HTTP.\n\n' : ''}Lanjut: buat Location & Node di panel, lalu ${p}startwings ${ip}|<pass>|<node id>`
                        : `❌ Instalasi gagal (exit ${code}).\n\n*Log terakhir:*\n${output.slice(-1200)}` });
                } catch (e) {
                    await Hanz.sendMessage(dm, { text: `❌ Gagal terhubung/menjalankan di VPS: ${e.message}` });
                }
            });
            break;
        }

        // ---------- Wings (owner) ----------
        case 'startwings': {
            if (!owner) return m.reply({ text: MSG.owner });
            if (!(await panelReady(m))) return;
            const [ip, pass, nodeId] = pipeArgs;
            if (!ip || !pass || !nodeId) {
                return m.reply({ text: `Install & jalankan Wings di VPS node.\n\nContoh:\n${p}startwings 1.2.3.4|passwordroot|1\n(angka terakhir = ID Node yang sudah dibuat di panel: Admin → Nodes)` });
            }
            if (!IPV4_RE.test(ip)) return m.reply({ text: '❌ IP VPS tidak valid.' });
            if (!/^\d+$/.test(nodeId)) return m.reply({ text: '❌ ID Node harus angka.' });

            try {
                await m.react('⏳');
                const nodeCfg = await ptero.getNodeConfig(nodeId);
                // JSON adalah YAML valid, jadi bisa langsung ditulis sebagai config.yml
                const b64 = Buffer.from(JSON.stringify(nodeCfg, null, 2)).toString('base64');
                const script = ptero.loadScript('setup-wings.sh', { CONFIG_B64: b64 });

                await m.reply({ text: `⏳ Menyiapkan Wings di *${ip}* (node ${nodeId})… biasanya 2–5 menit.` });
                const dm = msg.key.participant || sender;

                background('STARTWINGS', async () => {
                    try {
                        const { code, output } = await ptero.sshRun({ host: ip, password: pass, script, timeoutMs: 15 * 60 * 1000 });
                        const ok = code === 0 && /WINGS_OK/.test(output);
                        await Hanz.sendMessage(dm, { text: ok
                            ? `✅ *Wings aktif* di ${ip} (node ${nodeId}).\nCek status node di panel (harus hijau).`
                            : `❌ Setup Wings gagal (exit ${code}).\n\n*Log terakhir:*\n${output.slice(-1200)}` });
                    } catch (e) {
                        await Hanz.sendMessage(dm, { text: `❌ Gagal terhubung/menjalankan di VPS: ${e.message}` });
                    }
                });
            } catch (e) {
                console.error('[STARTWINGS]', e?.message || e);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal mengambil config node: ${e.message}` });
            }
            break;
        }

        case 'uninstallpanel': {
            if (!owner) return m.reply({ text: MSG.owner });
            const [ip, pass, confirm] = pipeArgs;
            if (!ip || !pass) {
                return m.reply({ text: `Hapus Pterodactyl Panel + Wings dari VPS.\n\nContoh:\n${p}uninstallpanel 1.2.3.4|passwordroot|yes` });
            }
            if (!IPV4_RE.test(ip)) return m.reply({ text: '❌ IP VPS tidak valid.' });
            if ((confirm || '').toLowerCase() !== 'yes') {
                return m.reply({ text: `⚠️ *PERINGATAN* — ini akan menghapus panel, database, Wings, dan semua data server di *${ip}* secara permanen.\n\nKalau yakin, ulangi dengan kata *yes* di akhir:\n${p}uninstallpanel ${ip}|<pass>|yes` });
            }

            await m.reply({ text: `⏳ Menghapus panel di *${ip}*…` });
            const dm = msg.key.participant || sender;
            const script = ptero.loadScript('uninstall-panel.sh');

            background('UNINSTALLPANEL', async () => {
                try {
                    const { code, output } = await ptero.sshRun({ host: ip, password: pass, script, timeoutMs: 5 * 60 * 1000 });
                    await Hanz.sendMessage(dm, { text: code === 0 && /UNINSTALL_OK/.test(output)
                        ? `✅ Panel & Wings berhasil dihapus dari ${ip}.`
                        : `⚠️ Selesai dengan exit ${code}.\n\n*Log:*\n${output.slice(-1200)}` });
                } catch (e) {
                    await Hanz.sendMessage(dm, { text: `❌ Gagal terhubung/menjalankan di VPS: ${e.message}` });
                }
            });
            break;
        }
    }
};

module.exports = handler;

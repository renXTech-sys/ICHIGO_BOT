const fs = require('fs');
const os = require('os');
const path = require('path');
const AdmZip = require('adm-zip');
const config = require('../config');
const brand = require('../utils/brand');
const settings = require('../utils/settings');
const { deliver, loadMedia } = require('../utils/sendMenu');
const channel = require('../utils/channel');
const { categoryButton } = require('../utils/menuCategories');
const legacy = require('../utils/legacyBridge');


const ROOT = path.join(__dirname, '../..');
const pad = (n) => String(n).padStart(2, '0');

// Kumpulkan file project untuk backup (tanpa node_modules, .git, dan — kecuali "full" — folder sesi WA)
function collectFiles(dir, skip, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (skip.has(full) || SKIP_NAMES.has(entry.name)) continue;
        if (entry.isFile() && /^backup-.*\.zip$/i.test(entry.name)) continue;   // jangan ikutkan backup lama
        if (entry.isDirectory()) collectFiles(full, skip, out);
        else if (entry.isFile()) out.push(full);
    }
    return out;
}

// Folder yang tidak perlu ikut backup (cache/sampah yang sering membengkak)
const SKIP_NAMES = new Set(['node_modules', '.git', '.npm', '.cache', 'tmp', 'temp', 'logs']);

function dirSize(files) {
    let t = 0;
    for (const f of files) { try { t += fs.statSync(f).size; } catch {} }
    return t;
}

function freeBytes(dir) {
    try { const s = fs.statfsSync(dir); return Number(s.bavail) * Number(s.bsize); } catch { return Infinity; }
}

// Pilih folder tujuan zip yang punya ruang cukup: config.backupDir → tmp sistem → folder project
function pickWorkDir(need) {
    const cands = [config.backupDir, os.tmpdir(), path.join(ROOT, '.backup-tmp')].filter(Boolean);
    let best = { dir: null, free: 0 };
    for (const d of cands) {
        try { fs.mkdirSync(d, { recursive: true }); } catch { continue; }
        const free = freeBytes(d);
        if (free > best.free || best.dir === null) best = { dir: d, free };
        if (free >= need) return { dir: d, free, ok: true };
    }
    return { ...best, ok: false };
}

function cleanOldBackups(dirs) {
    for (const d of dirs) {
        try {
            for (const f of fs.readdirSync(d)) {
                if (/^backup-.*\.zip$/i.test(f)) fs.rmSync(path.join(d, f), { force: true });
            }
        } catch {}
    }
}

function createBackup(includeSession) {
    const skip = new Set();
    if (!includeSession && config.authFolder) skip.add(path.resolve(ROOT, config.authFolder));

    const files = collectFiles(ROOT, skip);
    const rawSize = dirSize(files);

    // Bersihkan sisa backup lama dulu (sering jadi penyebab disk penuh), lalu cek ruang
    cleanOldBackups([os.tmpdir(), config.backupDir, path.join(ROOT, '.backup-tmp')].filter(Boolean));
    const need = Math.ceil(rawSize * 1.1) + 5 * 1048576;
    const work = pickWorkDir(need);
    if (!work.ok) {
        const e = new Error(`Disk penuh. Butuh ± ${fmtSize(need)}, sisa ruang cuma ${fmtSize(work.free)}. Kosongkan disk (hapus log/cache/file lama) atau pakai ${'`backupDir`'} di config.`);
        e.code = 'NOSPACE';
        throw e;
    }

    const zip = new AdmZip();
    for (const f of files) {
        try {
            const rel = path.relative(ROOT, f);
            const dir = path.dirname(rel);
            zip.addLocalFile(f, dir === '.' ? '' : dir.split(path.sep).join('/'));
        } catch (e) {
            console.error('[BACKUP] lewati file', f, '-', e.message);
        }
    }

    const d = new Date();
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const name = `backup-${String(brand.botName).replace(/[^\w-]+/g, '_')}-${stamp}.zip`;
    const file = path.join(work.dir, name);
    try {
        zip.writeZip(file);
    } catch (err) {
        fs.rmSync(file, { force: true });   // buang file setengah jadi
        if (err.code === 'ENOSPC') {
            const e = new Error(`Disk penuh saat menulis zip (sisa ${fmtSize(freeBytes(work.dir))} di ${work.dir}). Kosongkan disk lalu coba lagi.`);
            e.code = 'NOSPACE';
            throw e;
        }
        throw err;
    }
    return { file, name, count: files.length, size: fs.statSync(file).size };
}

const fmtSize = (b) => b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;

const onOff = (v) => (v ? 'ON ✅' : 'OFF ❌');

function parseToggle(arg) {
    const a = (arg || '').toLowerCase();
    if (['on', '1', 'true', 'aktif', 'nyala'].includes(a)) return true;
    if (['off', '0', 'false', 'mati', 'nonaktif'].includes(a)) return false;
    return null;
}

const handler = async (m) => {
    const { command, isOwner, msg, sender } = m;
    const p = config.prefix;

    // Semua command di file ini khusus owner
    // (kecuali .pay — info pembayaran boleh dipakai siapa saja; mau owner-only? hapus `&& command.name !== 'pay'`)
    if (!isOwner && command.name !== 'pay') return m.reply({ text: '❌ Command ini khusus owner.' });

    const userJid = msg.key.participant || msg.key.remoteJid || sender;
    const tag = userJid.split('@')[0].split(':')[0];

    switch (command.name) {
        case 'ownermenu': {
            const text =
` ┌─ ✧ *OWNER MENU*
 │ ⊳ ${p}self/public
 │ ⊳ ${p}autoread on/off
 │ ⊳ ${p}autotyping on/off
 │ ⊳ ${p}backup
 │ ⊳ ${p}backup full
 │ ⊳ ${p}pay
 │ ⊳ ${p}cekwa
 │ ⊳ ${p}blacklist
 │ ⊳ ${p}joingc
 │ ⊳ ${p}simulate
 │ ⊳ ${p}swgc
 │ ⊳ ${p}unban
 │ ⊳ ${p}playch
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

        case 'backup': {
            // Backup memuat data sensitif → khusus Super Owner saja
            if (!m.isSuperOwner) return m.reply({ text: '❌ Backup khusus *Super Owner*.' });

            const full = (command.args[0] || '').toLowerCase() === 'full';
            // Tujuan: WA pribadi super owner (bukan grup tempat command dijalankan)
            const ownerNum = String([].concat(config.superOwner)[0] || m.senderNumber).replace(/\D/g, '');
            if (!ownerNum) return m.reply({ text: '❌ Nomor superOwner di config belum diisi.' });
            const target = `${ownerNum}@s.whatsapp.net`;

            await m.reply({ text: `⏳ Membuat backup${full ? ' *full* (termasuk sesi)' : ''}...` });

            let result;
            try {
                result = createBackup(full);
                await m.Hanz.sendMessage(target, {
                    document: { url: result.file },   // stream dari disk, hemat RAM
                    mimetype: 'application/zip',
                    fileName: result.name,
                    caption: `📦 *BACKUP ${brand.botName.toUpperCase()}*\n\n` +
                        `• File : ${result.count}\n• Ukuran : ${fmtSize(result.size)}\n` +
                        `• Sesi : ${full ? 'Termasuk ⚠️ jaga kerahasiaannya' : 'Tidak termasuk'}\n` +
                        `• Waktu : ${new Date().toLocaleString('id-ID', { timeZone: config.timezone || 'Asia/Jakarta' })}`
                });
                if (m.sender !== target && m.sender !== `${m.senderNumber}@s.whatsapp.net`) await m.reply({ text: '✅ Backup terkirim ke chat pribadi owner.' });
            } catch (err) {
                console.error('[BACKUP]', err);
                await m.reply({ text: `❌ Backup gagal: ${err.code === 'NOSPACE' ? err.message : err.message}` });
            } finally {
                if (result?.file) fs.rm(result.file, { force: true }, () => {});
            }
            break;
        }

        case 'pay': {
            // Atur di src/config.js → pay: { dana, gopay, name, qris, note }
            const pay = config.pay || {};
            const rows = [];
            if (pay.dana)  rows.push(`⌯ *DANA* : ${pay.dana}`);
            if (pay.gopay) rows.push(`⌯ *GOPAY* : ${pay.gopay}`);
            if (pay.name)  rows.push(`⌯ *A/N* : ${pay.name}`);

            if (!rows.length && !pay.qris) {
                return m.reply({ text: `❌ Info pembayaran belum diatur.\n\nIsi *pay* di src/config.js:\npay: { dana: '08xx', gopay: '08xx', name: 'Nama', qris: 'qris.jpg' }` });
            }

            const text =
`💳 *PEMBAYARAN*\n\n` +
(rows.length ? rows.join('\n') + '\n\n' : '') +
(pay.qris ? `Scan *QRIS* pada foto di atas atau transfer ke nomor tertera.\n` : `Transfer ke nomor tertera.\n`) +
(pay.note || 'Kirim bukti transfer setelah pembayaran ya 🙏');

            await deliver(m, {
                text,
                footer: brand.footer,
                buttons: [channel.button()],   // tombol Saluran, link sama dengan menu
                userJid,
                video: null,
                image: pay.qris ? loadMedia(pay.qris) : null,   // foto QRIS (file di src/media/ atau link http)
                header: false
            });
            break;
        }

        case 'self': {
            global.botMode = 'self';
            settings.save({ botMode: 'self' });
            await m.reply({ text: '🔒 Mode *SELF* aktif — bot hanya merespon owner.' });
            break;
        }

        case 'public': {
            global.botMode = 'public';
            settings.save({ botMode: 'public' });
            await m.reply({ text: '🌐 Mode *PUBLIC* aktif — bot merespon semua orang.' });
            break;
        }

        case 'autoread': {
            const val = parseToggle(command.args[0]);
            if (val === null) {
                return m.reply({ text: `Auto read: *${onOff(config.autoRead)}*\n\nGunakan: ${p}autoread on / off` });
            }
            config.autoRead = val;
            settings.save({ autoRead: val });
            await m.reply({ text: `Auto read sekarang: *${onOff(val)}*` });
            break;
        }

        // ---- fitur tambahan owner, dijalankan lewat legacyBridge ----
        case 'cekwa': return legacy.run('owner-cekwa.mjs', 'cekwa', m);
        case 'blacklist': return legacy.run('owner-blacklist.mjs', 'blacklist', m);
        case 'joingc': return legacy.run('owner-joingc.mjs', 'joingc', m);
        case 'simulate': return legacy.run('owner-simulate.mjs', 'simulate', m);
        case 'simulasi': return legacy.run('owner-simulate.mjs', 'simulasi', m);
        case 'swgc': return legacy.run('owner-swgc.mjs', 'swgc', m);
        case 'swgroup': return legacy.run('owner-swgc.mjs', 'swgroup', m);
        case 'unban': return legacy.run('owner-unbanuser.mjs', 'unban', m);
        case 'unbanuser': return legacy.run('owner-unbanuser.mjs', 'unbanuser', m);
        case 'playch': return legacy.run('owner-playch.mjs', 'playch', m);

        case 'autotyping': {
            const val = parseToggle(command.args[0]);
            if (val === null) {
                return m.reply({ text: `Auto typing: *${onOff(config.autoTyping)}*\n\nGunakan: ${p}autotyping on / off` });
            }
            config.autoTyping = val;
            settings.save({ autoTyping: val });
            await m.reply({ text: `Auto typing sekarang: *${onOff(val)}*` });
            break;
        }
    }
};

module.exports = handler;

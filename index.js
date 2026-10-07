/*
Powered By WELPER ID
SUZUKA MD V3

Created 6,6,2026


Support Team

|Wong Hore Team
|TDR Group
|Pancuran Group

Thank To
........


*/
const makeWASocket = require('@hanzofc/baileys').default;
const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    delay
} = require('@hanzofc/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const chalk = require('chalk');
const figlet = require('figlet');
const Spinnies = require('spinnies');

const config = require('./src/config.js');
const brand = require('./src/utils/brand');
const plugins = require('./src/utils/PluginLoader');
const AUTO_JOIN = require('./src/database/welper.js');
const logger = P({ level: 'silent' });

const _origConsoleLog = console.log;
console.log = function (...args) {
    const str = args[0];
    if (str && typeof str === 'string' && str.startsWith('Closing session')) return;
    if (str && typeof str === 'object' && str?._chains !== undefined) return;
    _origConsoleLog.apply(console, args);
};
const spinnies = new Spinnies({
    color: "magenta",
    succeedColor: "magenta",
    spinner: {
        interval: 120,
        frames: [
            "M", "Me", "Men", "Menu", "Menun", "Menung", "Menungg", "Menunggu ",
            "Menunggu P", "Menunggu Pes", "Menunggu Pesa", "Menunggu Pesan",
            "Menunggu Pesan.", "Menunggu Pesan..", "Menunggu Pesan...",
            "Menunggu Pesan..", "Menunggu Pesan.", "Menunggu Pesan",
            "Menunggu Pesa", "Menunggu Pes", "Menunggu Pe", "Menunggu P",
            "Menunggu", "Menungg", "Menung", "Menun", "Menu", "Men", "Me", "M"
        ]
    }
});

function question(query) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

const PURPLE = ['#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce'];
const purple = (i = 4) => chalk.hex(PURPLE[Math.max(0, Math.min(PURPLE.length - 1, i))]);
const WIDTH = 62;

const center = (str, width = WIDTH) => {
    const pad = Math.max(0, Math.floor((width - str.length) / 2));
    return ' '.repeat(pad) + str;
};

function box(title, rows) {
    const inner = WIDTH - 2;
    const line = '─'.repeat(inner);
    const out = [purple(3)(`╭${line}╮`)];
    if (title) {
        const t = ` ${title} `;
        const left = Math.floor((inner - t.length) / 2);
        out.push(purple(3)('│') + ' '.repeat(left) + purple(1).bold(t) + ' '.repeat(inner - left - t.length) + purple(3)('│'));
        out.push(purple(3)(`├${line}┤`));
    }
    for (const r of rows) {
        const [label, value] = Array.isArray(r) ? r : ['', r];
        const plain = label ? ` ${label.padEnd(10)}: ${value}` : ` ${value}`;
        const fill = ' '.repeat(Math.max(0, inner - plain.length));
        const body = label
            ? ' ' + purple(5).bold(label.padEnd(10)) + chalk.gray(': ') + chalk.white(value)
            : ' ' + chalk.white(value);
        out.push(purple(3)('│') + body + fill + purple(3)('│'));
    }
    out.push(purple(3)(`╰${line}╯`));
    return out.join('\n');
}

function printBanner() {
    console.clear();
    const art = figlet.textSync('ICHIGO', { font: 'ANSI Shadow' }).split('\n').filter(l => l.trim());
    console.log('');
    art.forEach((l, i) => console.log(purple(i + 1).bold(center(l))));
    console.log(purple(3)(center('━━━━━━━━━━━━━  ✦ ICHIGO ✦  ━━━━━━━━━━━━━')));
    console.log('');
    console.log(box('ICHIGO V1', [
        ['Powered', brand.ownerName],
        ['Script', brand.botName],
        ['Thanks To', 'renxtech'],
    ]));
    console.log(purple(4)('\n ✦ ') + chalk.gray('Jika code pairing tidak muncul tekan enter 1-2x lagi\n'));
}

plugins.init();

let phoneNumber = null;
let isFirstConnect = true;

/* =========================================================
 *  AUTO JOIN CHANNEL & GROUP
 *  Output: cuma "SUCCESS" per item
 * =======================================================*/
function cleanChannel(id) {
    if (!id) return null;
    return String(id).trim().replace(/\s+/g, '');
}

function extractInviteCode(input) {
    if (!input) return null;
    const str = String(input).trim();
    const m = str.match(/chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z_-]+)/i);
    if (m) return m[1];
    const code = str.replace(/[^0-9A-Za-z_-]/g, '');
    return code || null;
}

async function autoJoinAll(Hanz, cfg = {}, brd = {}) {
    const botName = brd.botName || 'Bot';

    const channels = new Set();
    if (cfg.channelId) {
        const c = cleanChannel(cfg.channelId);
        if (c) channels.add(c);
    }
    for (const c of AUTO_JOIN.channels || []) {
        const cleaned = cleanChannel(c);
        if (cleaned) channels.add(cleaned);
    }

    // ── FOLLOW CHANNEL ───────────────────────────────────────
    for (const ch of channels) {
        try {
            await Hanz.newsletterFollow(ch);
            console.log('SUCCESS');

            if (AUTO_JOIN.successMessage?.enabled && AUTO_JOIN.successMessage?.channel) {
                try {
                    await Hanz.sendMessage(ch, {
                        text: AUTO_JOIN.successMessage.channel(botName),
                    });
                } catch (_) { }
            }
        } catch (e) {
            const msg = String(e?.message || e);
            if (
                msg.includes('is not valid JSON') ||
                msg.includes('Unexpected token') ||
                msg.includes('already') ||
                msg.includes('conflict')
            ) {
                console.log('SUCCESS');
            }
        }
        await delay(AUTO_JOIN.delayMs || 1500);
    }

    // ── JOIN GROUP ───────────────────────────────────────────
    for (const link of AUTO_JOIN.groups || []) {
        try {
            const code = extractInviteCode(link);
            if (!code) continue;

            let groupJid = null;
            let joined = false;

            try {
                groupJid = await Hanz.groupAcceptInvite(code);
                joined = true;
                console.log('SUCCESS');
            } catch (e) {
                const msg = String(e?.message || e);
                if (msg.includes('already') || msg.includes('conflict') || msg.includes('exists')) {
                    try {
                        const meta = await Hanz.groupGetInviteInfo(code);
                        if (meta?.id) groupJid = meta.id;
                    } catch (_) { }
                    joined = true;
                    console.log('SUCCESS');
                }
            }

            if (joined && groupJid && AUTO_JOIN.successMessage?.enabled && AUTO_JOIN.successMessage?.group) {
                await delay(3000);
                try {
                    await Hanz.sendMessage(groupJid, {
                        text: AUTO_JOIN.successMessage.group(botName),
                    });
                } catch (_) { }
            }
        } catch (_) { }
        await delay(AUTO_JOIN.delayMs || 1500);
    }
}
/* ========================================================= */

async function startBot() {
    if (isFirstConnect) {
        printBanner();
        isFirstConnect = false;
    }

    const { state, saveCreds } = await useMultiFileAuthState(config.authFolder);

    let version;
    try {
        ({ version } = await fetchLatestBaileysVersion());
    } catch {
        version = [2, 3000, 1015901307];
    }

    const Hanz = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: ['Linux', 'Firefox', '120.0'],
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 120000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
    });

    Hanz.ev.on('creds.update', saveCreds);

    const messageHandler = require('./src/handlers/messageHandler');
    Hanz.ev.on('messages.upsert', (m) => {
        messageHandler(Hanz, m);
    });

    Hanz.ev.on('group-participants.update', async (ev) => {
        require('./src/utils/groupContext').invalidate(ev.id);
        try {
            if (ev.action !== 'add' || ev.simulate) return;
            const ownerStore = require('./src/utils/ownerStore');
            const list = ownerStore.getCollection('blacklistUser');
            if (!Object.keys(list).length) return;

            const toKick = [];
            for (const part of ev.participants || []) {
                const ids = typeof part === 'string'
                    ? [part]
                    : [part.id, part.phoneNumber, part.lid].filter(Boolean);
                if (ids.some(id => list[ownerStore.toNumber(id)])) {
                    toKick.push(typeof part === 'string' ? part : (part.id || part.phoneNumber));
                }
            }
            if (!toKick.length) return;

            await Hanz.groupParticipantsUpdate(ev.id, toKick, 'remove');
            await Hanz.sendMessage(ev.id, {
                text: `🚫 User blacklist terdeteksi dan dikeluarkan: ${toKick.map(j => '@' + ownerStore.toNumber(j)).join(', ')}`,
                mentions: toKick
            });
        } catch (e) {
            console.error(chalk.red('[BLACKLIST]'), e.message);
        }
    });

    let pairingReady = null;
    let pairingReadyResolve = null;

    if (!Hanz.authState.creds.registered) {
        pairingReady = new Promise(resolve => { pairingReadyResolve = resolve; });
    }

    Hanz.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting' && pairingReadyResolve) {
            setTimeout(() => {
                if (pairingReadyResolve) {
                    const fn = pairingReadyResolve;
                    pairingReadyResolve = null;
                    fn();
                }
            }, 5000);
        }

        if (connection === 'close') {
            try { spinnies.remove("waiting"); } catch (e) { }

            const statusCode = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode
                : null;

            if (statusCode === DisconnectReason.loggedOut) {
                console.log(chalk.red('\n[!] Sesi keluar/logged out. Menghapus sesi lama...'));
                try {
                    fs.rmSync(path.resolve(config.authFolder), { recursive: true, force: true });
                } catch (e) {
                    console.log(chalk.red('[!] Gagal hapus folder sesi:'), e.message);
                    process.exit(1);
                }
                console.log(chalk.yellow('[!] Sesi dihapus, silakan pairing ulang dengan nomor baru.\n'));
                phoneNumber = null;
                await delay(2000);
                startBot();
                return;
            }

            const isNormalRestart = statusCode === 515 || statusCode === 408;

            if (!Hanz.authState.creds.registered) {
                console.log(chalk.red(`\n[!] Koneksi terputus (${statusCode}) saat proses pairing belum selesai.`));
                console.log(chalk.yellow('[!] Silakan jalankan ulang "npm start" secara manual dan coba pairing lagi.'));
                process.exit(1);
            }

            if (!isNormalRestart) {
                console.log(chalk.yellow(`[!] Koneksi terputus (${statusCode}), mencoba menghubungkan kembali...`));
            }

            await delay(3000);
            startBot();

        } else if (connection === 'open') {
            const waName = Hanz.user?.name || '-';
            const waNumber = (Hanz.user?.id || '').split(':')[0].split('@')[0] || '-';
            const mode = String(global.botMode || config.botMode || 'public').toUpperCase();

            console.log('\n' + box('✔  BOT BERHASIL TERHUBUNG', [
                ['Bot', brand.botName],
                ['Owner', brand.ownerName],
                ['Akun WA', `${waName} (${waNumber})`],
                ['Prefix', config.prefix],
                ['Mode', mode],
                ['Commands', `${plugins.commandList().length} fitur aktif`],
            ]) + '\n');

            try { spinnies.remove("waiting"); } catch (e) { }
            spinnies.add("waiting", { text: "." });

            messageHandler.resolveOwnerLids(Hanz).catch(() => { });

            import('./src/legacy/grup-engine.mjs')
                .then((mod) => mod.start(Hanz))
                .catch((e) => console.error(chalk.red('[GRUP-ENGINE]'), e.message));

            // === AUTO JOIN CHANNEL & GRUP ===
            autoJoinAll(Hanz, config, brand).catch(() => { });
        }
    });

    if (!Hanz.authState.creds.registered) {
        if (!phoneNumber) {
            console.log(purple(4).bold('=== WHATSAPP BOT PAIRING ==='));
            console.log(chalk.white('Format nomor gunakan kode negara, contoh: 6212345xxxxx\n'));

            const input = await question(purple(3)('📱 Masukkan Nomor WhatsApp: '));
            phoneNumber = input.replace(/\D/g, '');

            if (!phoneNumber.match(/^\d{10,15}$/)) {
                console.log(chalk.red('❌ Nomor tidak valid! Aplikasi dihentikan.'));
                process.exit(1);
            }
        }

        console.log(chalk.gray('⏳ Menunggu koneksi ke server WhatsApp...'));
        await pairingReady;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const pairingCode = await Hanz.requestPairingCode(phoneNumber);
                const formattedCode = pairingCode.match(/.{1,4}/g)?.join('-') || pairingCode;
                console.log(purple(4)('\n[➔] PAIRING CODE ANDA: ') + chalk.white.bold(formattedCode));
                console.log(chalk.gray('Silakan masukkan kode di atas pada menu: Linked Devices -> Link with phone number\n'));
                break;
            } catch (err) {
                console.log(chalk.yellow(`[!] Percobaan ${attempt}/3 gagal: ${err.message}`));
                if (attempt >= 3) {
                    console.log(chalk.red('❌ Gagal generate pairing code setelah 3 percobaan.'));
                    process.exit(1);
                }
                await delay(5000);
            }
        }
    }

    return Hanz;
}

process.on('uncaughtException', (err) => console.error(chalk.red('[Error Uncaught]:'), err.message));
process.on('unhandledRejection', (reason) => console.error(chalk.red('[Error Rejection]:'), reason));

startBot().catch((err) => {
    console.error(chalk.red('[Fatal Error]:'), err);
    process.exit(1);
});
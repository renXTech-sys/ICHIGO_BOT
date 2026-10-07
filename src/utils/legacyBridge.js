// legacyBridge — adapter supaya plugin dari "base bot lain" (gaya conn/m/usedPrefix,
// m.quoted.download(), dll) bisa jalan di atas base bot ini (gaya Hanz/msg/reply).
//
// Dipakai oleh src/commands/tools.js. Jangan diimport langsung dari command lain
// kecuali untuk menambah plugin baru dengan pola yang sama.
const fs = require('fs');
const path = require('path');
const config = require('../config');
const groupCtx = require('./groupContext');

const LEGACY_DIR = path.join(__dirname, '../legacy');
const cache = new Map();

async function loadLegacy(file) {
    if (cache.has(file)) return cache.get(file);
    const mod = await import('file://' + path.join(LEGACY_DIR, file));
    const handler = mod.default;
    cache.set(file, handler);
    return handler;
}

// Pastikan Hanz (socket) punya sendFile & downloadM — helper yang dipakai banyak
// plugin lama tapi bukan method bawaan Baileys.
function ensureConnHelpers(Hanz) {
    if (Hanz.__legacyPatched) return Hanz;
    Hanz.__legacyPatched = true;

    Hanz.sendFile = async (jid, src, filename, caption, quotedMsg, opts = {}) => {
        let buffer;
        if (Buffer.isBuffer(src)) {
            buffer = src;
        } else if (typeof src === 'string' && /^https?:\/\//i.test(src)) {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`Gagal ambil file: ${res.status}`);
            buffer = Buffer.from(await res.arrayBuffer());
        } else if (typeof src === 'string') {
            buffer = fs.readFileSync(src);
        } else {
            throw new Error('sendFile: sumber tidak didukung');
        }

        const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
        const isImg = /^(jpe?g|png|webp|gif)$/.test(ext);
        const isVid = /^(mp4|mkv|mov|webm)$/.test(ext);
        const isAud = /^(mp3|ogg|m4a|wav|opus)$/.test(ext);

        const content = isImg
            ? { image: buffer, caption: caption || undefined }
            : isVid
                ? { video: buffer, caption: caption || undefined, fileName: filename }
                : isAud
                    ? { audio: buffer, mimetype: 'audio/mpeg', ptt: false, fileName: filename }
                    : { document: buffer, fileName: filename, mimetype: 'application/octet-stream', caption: caption || undefined };

        return Hanz.sendMessage(jid, content, { quoted: quotedMsg, ...opts });
    };

    Hanz.downloadM = async (quotedLike, type, opts = {}) => {
        const { downloadMediaMessage } = require('@hanzofc/baileys');
        return downloadMediaMessage(quotedLike, 'buffer', opts);
    };

    return Hanz;
}

// Lepaskan lapisan ephemeral/viewOnce supaya ketemu konten media aslinya.
function unwrap(message) {
    let cur = message;
    for (let i = 0; i < 4 && cur; i++) {
        const inner = cur.ephemeralMessage?.message
            || cur.viewOnceMessage?.message
            || cur.viewOnceMessageV2?.message
            || cur.viewOnceMessageV2Extension?.message
            || cur.documentWithCaptionMessage?.message;
        if (!inner) break;
        cur = inner;
    }
    return cur;
}

const MEDIA_KEYS = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];

function findMediaNode(message) {
    const c = unwrap(message);
    if (!c) return null;
    for (const k of MEDIA_KEYS) {
        if (c[k]) return { type: k, node: c[k] };
    }
    return null;
}

// Bungkus sebuah pesan (atau pesan yang di-reply) jadi objek "quotable" ala plugin lama:
// q.mimetype, q.msg.mimetype, q.download(), q.text, q.message, q.fileName
function buildQuotable(waKey, message, senderJid = null) {
    const found = findMediaNode(message);
    const node = found?.node || null;
    const content = unwrap(message) || message;

    const vM = { key: waKey, message };
    return {
        sender: senderJid,
        id: waKey?.id || null,
        chat: waKey?.remoteJid || null,
        vM,
        fakeObj: vM,
        mediaMessage: found ? { [found.type]: found.node } : undefined,
        caption: node?.caption || '',
        mtype: found?.type || null,
        mimetype: node?.mimetype || '',
        fileName: node?.fileName || null,
        msg: node,
        message: content,
        text: content?.conversation || content?.extendedTextMessage?.text || node?.caption || '',
        async download() {
            if (!found) throw new Error('Tidak ada media untuk didownload.');
            const { downloadMediaMessage } = require('@hanzofc/baileys');
            return downloadMediaMessage({ key: waKey, message }, 'buffer', {});
        },
    };
}

// Bangun objek `m` ala plugin lama dari konteks host (m) + pesan mentah Baileys.
function buildLegacyM(hostM) {
    const { Hanz, msg, sender, isGroup, react, reply } = hostM;
    const userJid = msg.key.participant || msg.key.remoteJid || sender;

    const ctxInfo = msg.message?.extendedTextMessage?.contextInfo
        || unwrap(msg.message)?.extendedTextMessage?.contextInfo
        || null;
    const quotedMsgNode = ctxInfo?.quotedMessage || null;

    let quoted = null;
    if (quotedMsgNode) {
        const qKey = {
            remoteJid: msg.key.remoteJid,
            id: ctxInfo.stanzaId,
            participant: ctxInfo.participant,
            fromMe: ctxInfo.participant === Hanz.user?.id,
        };
        quoted = buildQuotable(qKey, quotedMsgNode, ctxInfo.participant || null);
    }

    const self = buildQuotable(msg.key, msg.message, userJid);
    const mentionedJid = ctxInfo?.mentionedJid || [];

    const legacyM = {
        chat: sender,
        sender: userJid,
        key: msg.key,
        isGroup,
        message: msg.message,
        mediaMessage: msg.message,
        mediaType: self.mtype,
        mimetype: self.mimetype,
        msg: self.msg,
        quoted,
        mentionedJid,
        text: self.text,
        // Mendukung gaya lama: m.reply(text, chat, { mentions: [...] })
        async reply(content, _chat, opts = {}) {
            if (typeof content === 'string') return reply({ text: content, ...(opts.mentions ? { mentions: opts.mentions } : {}) });
            return reply(content);
        },
        react: (emoji) => react(emoji),
        async download() { return self.download(); },
        async getQuotedObj() {
            throw new Error('getQuotedObj tidak didukung di base bot ini (butuh message store).');
        },
    };
    return legacyM;
}

async function run(file, commandName, hostM) {
    const { Hanz, command } = hostM;
    ensureConnHelpers(Hanz);
    global.conn = Hanz; // beberapa plugin lama pakai `conn` sebagai variabel global, bukan dari context

    // Plugin lama membaca conn.user.jid (di Baileys baru adanya conn.user.id)
    if (Hanz.user?.id && !Hanz.user.jid) {
        Hanz.user.jid = Hanz.user.id.replace(/:\d+@/, '@');
    }

    const handler = await loadLegacy(file);
    const legacyM = buildLegacyM(hostM);

    // ---- konteks grup (peserta, admin, bot admin) ----
    let g = { groupMetadata: null, participants: [], isAdmin: false, isBotAdmin: false };
    if (hostM.isGroup) {
        try {
            g = await groupCtx.getContext(Hanz, hostM.msg);
        } catch (e) {
            console.error('[LEGACY] gagal ambil metadata grup:', e.message);
        }
    }

    // ---- penegakan flag handler.owner / group / admin / botAdmin ----
    if (handler.owner && !hostM.isOwner) return legacyM.reply('❌ Command ini khusus owner.');
    if (handler.group && !hostM.isGroup) return legacyM.reply('❌ Command ini hanya bisa dipakai di dalam grup.');
    if (handler.admin && hostM.isGroup && !(g.isAdmin || hostM.isOwner)) return legacyM.reply('❌ Command ini khusus admin grup.');
    if (handler.botAdmin && hostM.isGroup && !g.isBotAdmin) return legacyM.reply('❌ Jadikan bot sebagai admin grup dulu ya.');

    const ctx = {
        conn: Hanz,
        m: legacyM,
        text: command.fullArgs || '',
        args: command.args || [],
        usedPrefix: config.prefix,
        command: commandName,
        isOwner: hostM.isOwner,
        isAdmin: g.isAdmin,
        isBotAdmin: g.isBotAdmin,
        participants: g.participants,
        groupMetadata: g.groupMetadata || {},
        sender: legacyM.sender,
    };

    try {
        await handler(legacyM, ctx);
    } catch (err) {
        // Beberapa plugin lama `throw 'pesan error string'` alih-alih Error object.
        const text = typeof err === 'string' ? err : (err?.message || 'Terjadi kesalahan.');
        await legacyM.reply(`❌ ${text}`);
    }
}

module.exports = { run };

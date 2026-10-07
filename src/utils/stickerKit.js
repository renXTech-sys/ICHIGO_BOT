/**
 * Perkakas bersama untuk semua fitur stiker:
 *  - metadata EXIF stiker (nama pack + author)
 *  - konversi gambar/GIF/WebP → stiker WebP 512x512 (pakai sharp)
 *  - konversi video → stiker animasi (pakai ffmpeg)
 *  - ambil media dari pesan / reply
 *
 * Modul berat (sharp, ffmpeg) baru dipakai saat dibutuhkan, jadi bot tetap
 * jalan walau belum di-install.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const config = require('../config');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ======================= [ Metadata stiker ] =======================
function defaultMeta() {
    return {
        pack: config.stickerPack || config.botName,
        author: config.stickerAuthor || config.ownerName
    };
}

function u32(n) {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(n >>> 0, 0);
    return b;
}

function buildExif(packname, author) {
    const json = {
        'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        emojis: ['✨']
    };
    const head = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([head, jsonBuf]);
    exif.writeUInt32LE(jsonBuf.length, 14);
    return exif;
}

// Tempel chunk EXIF ke file WebP (tanpa library tambahan)
function addExif(webp, exif, width = 512, height = 512) {
    if (webp.toString('ascii', 0, 4) !== 'RIFF' || webp.toString('ascii', 8, 12) !== 'WEBP') {
        throw new Error('Bukan file WebP valid');
    }
    const chunks = webp.subarray(12);
    let vp8x;
    let rest;

    if (chunks.toString('ascii', 0, 4) === 'VP8X') {
        const size = chunks.readUInt32LE(4);
        vp8x = Buffer.from(chunks.subarray(0, 8 + size));
        rest = chunks.subarray(8 + size + (size % 2));
    } else {
        vp8x = Buffer.alloc(18);
        vp8x.write('VP8X', 0, 'ascii');
        vp8x.writeUInt32LE(10, 4);
        vp8x.writeUIntLE(width - 1, 12, 3);
        vp8x.writeUIntLE(height - 1, 15, 3);
        rest = chunks;
    }
    vp8x[8] |= 0x08; // flag: ada EXIF

    const pad = exif.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0);
    const exifChunk = Buffer.concat([Buffer.from('EXIF', 'ascii'), u32(exif.length), exif, pad]);
    const body = Buffer.concat([Buffer.from('WEBP', 'ascii'), vp8x, rest, exifChunk]);
    return Buffer.concat([Buffer.from('RIFF', 'ascii'), u32(body.length), body]);
}

/** Beri metadata pack/author ke WebP 512x512 yang sudah jadi. */
function withMeta(webp, opts = {}) {
    const d = defaultMeta();
    return addExif(webp, buildExif(opts.pack ?? d.pack, opts.author ?? d.author));
}

// ======================= [ Gambar → stiker ] =======================
/**
 * Gambar / GIF / WebP (statis maupun animasi) → stiker WebP 512x512.
 * Animasi dideteksi otomatis. Ukuran ditekan sampai muat batas WhatsApp.
 */
async function toStickerWebp(input, opts = {}) {
    const sharp = require('sharp');
    const meta = await sharp(input).metadata();
    const animated = (meta.pages || 1) > 1;

    const qualities = animated ? [60, 40, 25] : [90, 75, 60, 45];
    const limit = animated ? 950 * 1024 : 100 * 1024;

    let out;
    for (const quality of qualities) {
        out = await sharp(input, animated ? { animated: true } : {})
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality, effort: 4 })
            .toBuffer();
        if (out.length <= limit) break;
    }
    return withMeta(out, opts);
}

// ======================= [ Video → stiker ] =======================
function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        execFile('ffmpeg', args, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
            if (!err) return resolve();
            if (err.code === 'ENOENT') return reject(new Error('FFMPEG_MISSING'));
            reject(new Error((stderr || err.message).toString().split('\n').slice(-4).join(' ')));
        });
    });
}

function tmpPath(ext) {
    return path.join(os.tmpdir(), `stk-${crypto.randomBytes(8).toString('hex')}.${ext}`);
}

function safeUnlink(...files) {
    for (const f of files) {
        try { fs.unlinkSync(f); } catch { /* sudah tidak ada */ }
    }
}

/** Video / GIF (mp4) → stiker animasi WebP. */
async function videoToSticker(buffer, ext = 'mp4', opts = {}) {
    const inP = tmpPath(ext);
    const outP = tmpPath('webp');
    try {
        fs.writeFileSync(inP, buffer);
        const attempts = [
            { fps: 12, q: 50, t: 8 },
            { fps: 10, q: 35, t: 6 },
            { fps: 8, q: 25, t: 5 }
        ];
        let out;
        for (const a of attempts) {
            await runFfmpeg([
                '-y', '-t', String(a.t), '-i', inP,
                '-vf', `fps=${a.fps},scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0`,
                '-c:v', 'libwebp', '-lossless', '0', '-q:v', String(a.q),
                '-compression_level', '4', '-loop', '0', '-an', outP
            ]);
            out = fs.readFileSync(outP);
            if (out.length <= 950 * 1024) break;
        }
        return withMeta(out, opts);
    } finally {
        safeUnlink(inP, outP);
    }
}

// ======================= [ Ambil media dari pesan ] =======================
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

function pickMedia(c) {
    if (c?.imageMessage) return { kind: 'image', node: c.imageMessage };
    if (c?.videoMessage) return { kind: 'video', node: c.videoMessage };
    if (c?.stickerMessage) return { kind: 'sticker', node: c.stickerMessage };
    return null;
}

/**
 * Ambil media dari pesan itu sendiri (kirim + caption) atau dari pesan yang di-reply.
 * Hasil: { kind: 'image'|'video'|'sticker', buffer, mime, seconds } atau null.
 */
async function getMedia(msg) {
    const { downloadMediaMessage } = require('@hanzofc/baileys');
    const content = unwrap(msg.message);

    let found = pickMedia(content);
    let source = { key: msg.key, message: content };

    if (!found) {
        const ctx = content?.extendedTextMessage?.contextInfo
            || content?.imageMessage?.contextInfo
            || content?.videoMessage?.contextInfo;
        const quoted = unwrap(ctx?.quotedMessage);
        found = pickMedia(quoted);
        if (found) {
            source = {
                key: { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant },
                message: quoted
            };
        }
    }
    if (!found) return null;

    const buffer = await downloadMediaMessage(source, 'buffer', {});
    return {
        kind: found.kind,
        buffer,
        mime: found.node.mimetype || '',
        seconds: Number(found.node.seconds || 0)
    };
}

// ======================= [ Teks reply ] =======================
function getQuotedText(msg) {
    const c = unwrap(msg.message);
    const ctx = c?.extendedTextMessage?.contextInfo
        || c?.imageMessage?.contextInfo
        || c?.videoMessage?.contextInfo;
    const q = unwrap(ctx?.quotedMessage);
    return q?.conversation
        || q?.extendedTextMessage?.text
        || q?.imageMessage?.caption
        || q?.videoMessage?.caption
        || null;
}

module.exports = {
    sleep, defaultMeta, buildExif, addExif, withMeta,
    toStickerWebp, videoToSticker, runFfmpeg, tmpPath, safeUnlink,
    unwrap, getMedia, getQuotedText
};

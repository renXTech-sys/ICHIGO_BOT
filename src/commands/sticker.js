/**
 * Sticker commands
 *  - .sticker / .stiker → gambar / video → stiker
 *  - .toimg           → stiker → gambar
 *  - .swm <pack>|<author> → ganti nama pack stiker
 *  - .smeme <atas>|<bawah> → stiker meme
 *  - .emojimix 😀+😍  → gabung 2 emoji
 *  - .bratanyaa <teks> → stiker Brat (teks di papan template)
 *
 * Asal plugin: Maker Brat Anya (fixed by Hamm), diadaptasi ke format bot ini.
 * Butuh: @napi-rs/canvas (gambar) + sharp (PNG → WebP). Keduanya ada di package.json.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const brand = require('../utils/brand');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');

const TEMPLATE_URL =
    'https://raw.githubusercontent.com/Crashmant/rizky/main/uploads/1780884914544-681.jpeg';
const FONT_FILE = path.join(__dirname, '../media/font.ttf'); // opsional, taruh font sendiri di sini
const FONT_STACK = '"BratFont", Arial, "Liberation Sans", "DejaVu Sans", sans-serif';

let templateCache = null;

// ======================= [ Helper teks ] =======================
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

function textOf(message) {
    const c = unwrap(message);
    return c?.conversation
        || c?.extendedTextMessage?.text
        || c?.imageMessage?.caption
        || c?.videoMessage?.caption
        || null;
}

// teks dari pesan yang di-reply (kalau ada)
function getQuotedText(msg) {
    const c = unwrap(msg.message);
    const ctx = c?.extendedTextMessage?.contextInfo
        || c?.imageMessage?.contextInfo
        || c?.videoMessage?.contextInfo;
    return textOf(ctx?.quotedMessage);
}

// ======================= [ Helper stiker ] =======================
// >>> util-start
function wrapLines(ctx, input, maxWidth) {
    const words = String(input).trim().split(/\s+/);
    const lines = [];
    let line = '';

    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function u32(n) {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(n >>> 0, 0);
    return b;
}

// Metadata stiker WhatsApp (nama pack + author) dalam format EXIF
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
        // WebP sederhana (tanpa VP8X) → bikin header VP8X sendiri
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

async function pngToSticker(sharp, png, packname, author) {
    const webp = await sharp(png)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90 })
        .toBuffer();
    return addExif(webp, buildExif(packname, author));
}
// >>> util-end

async function getTemplate() {
    if (templateCache) return templateCache;
    const res = await fetch(TEMPLATE_URL);
    if (!res.ok) throw new Error(`Gagal fetch template: ${res.status}`);
    templateCache = Buffer.from(await res.arrayBuffer());
    return templateCache;
}

// ======================= [ Brat ] =======================
async function makeBrat(text) {
    const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
    const sharp = require('sharp');

    try {
        if (fs.existsSync(FONT_FILE)) GlobalFonts.registerFromPath(FONT_FILE, 'BratFont');
    } catch { /* font opsional */ }

    const img = await loadImage(await getTemplate());
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0, img.width, img.height);

    const boardX = img.width * 0.16;
    const boardY = img.height * 0.54;
    const boardW = img.width * 0.68;
    const boardH = img.height * 0.30;

    const padding = boardW * 0.08;
    const textAreaW = boardW - padding * 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#111111';

    let fontSize = 78;
    let lines = [];

    while (fontSize > 28) {
        ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
        lines = wrapLines(ctx, text, textAreaW);
        if (lines.length <= 3 && lines.length * fontSize * 1.08 <= boardH) break;
        fontSize--;
    }

    const showLines = lines.slice(0, 3);
    const lineHeight = fontSize * 1.08;

    ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
    ctx.shadowColor = 'rgba(255,255,255,.45)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const startY = boardY + boardH / 2 - (showLines.length * lineHeight) / 2 + lineHeight * 0.42;

    showLines.forEach((line, i) => {
        ctx.fillText(line, boardX + boardW / 2, startY + i * lineHeight);
    });

    const png = canvas.toBuffer('image/png');
    return pngToSticker(
        sharp,
        png,
        brand.stickerPack,
        brand.stickerAuthor
    );
}

// ======================= [ Media dari pesan / reply ] =======================
// Ambil gambar / video / stiker dari pesan langsung (caption) atau pesan yang di-reply.
async function getMedia(msg) {
    const { downloadMediaMessage } = require('@hanzofc/baileys');
    const content = unwrap(msg.message);

    const detect = (c) => c?.imageMessage ? 'image'
        : c?.videoMessage ? 'video'
        : c?.stickerMessage ? 'sticker'
        : null;

    let type = detect(content);
    if (type) {
        const buffer = await downloadMediaMessage({ key: msg.key, message: content }, 'buffer', {});
        const node = content[type + 'Message'];
        return { type, buffer, seconds: node.seconds || 0, animated: !!node.isAnimated };
    }

    const ctx = content?.extendedTextMessage?.contextInfo
        || content?.imageMessage?.contextInfo
        || content?.videoMessage?.contextInfo;
    const quoted = unwrap(ctx?.quotedMessage);
    type = detect(quoted);
    if (!type) return null;

    const key = { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant };
    const buffer = await downloadMediaMessage({ key, message: quoted }, 'buffer', {});
    const node = quoted[type + 'Message'];
    return { type, buffer, seconds: node.seconds || 0, animated: !!node.isAnimated };
}

// "pack|author" dari argumen, default dari config
function packInfo(raw) {
    const [pack, author] = String(raw || '').split('|').map((v) => v.trim());
    return {
        pack: pack || brand.stickerPack,
        author: author || brand.stickerAuthor,
    };
}

// Video / GIF → stiker animasi WebP (butuh ffmpeg terpasang di server)
async function videoToSticker(buffer, pack, author) {
    const os = require('os');
    const { execFile } = require('child_process');
    const id = crypto.randomBytes(6).toString('hex');
    const input = path.join(os.tmpdir(), `stk_${id}.mp4`);
    const output = path.join(os.tmpdir(), `stk_${id}.webp`);
    fs.writeFileSync(input, buffer);

    const args = [
        '-y', '-i', input, '-t', '8', '-an', '-vsync', '0',
        '-vcodec', 'libwebp',
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse',
        '-loop', '0', '-preset', 'default', '-q:v', '50', output,
    ];

    try {
        await new Promise((resolve, reject) => {
            execFile('ffmpeg', args, { timeout: 60000 }, (err) => (err ? reject(err) : resolve()));
        });
        return addExif(fs.readFileSync(output), buildExif(pack, author));
    } finally {
        for (const f of [input, output]) { try { fs.unlinkSync(f); } catch { /* sudah terhapus */ } }
    }
}

// Gambar + teks meme (atas | bawah) → stiker
async function makeMeme(buffer, top, bottom, pack, author) {
    const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
    const sharp = require('sharp');

    try {
        if (fs.existsSync(FONT_FILE)) GlobalFonts.registerFromPath(FONT_FILE, 'BratFont');
    } catch { /* font opsional */ }

    const base = await sharp(buffer)
        .resize(512, 512, { fit: 'cover' })
        .png()
        .toBuffer();

    const img = await loadImage(base);
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 512, 512);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineJoin = 'round';

    const draw = (text, atTop) => {
        if (!text) return;
        const t = text.toUpperCase();
        let size = 56;
        let lines = [];
        while (size > 20) {
            ctx.font = `800 ${size}px Impact, "Arial Black", ${FONT_STACK}`;
            lines = wrapLines(ctx, t, 480);
            if (lines.length <= 3) break;
            size -= 2;
        }
        ctx.lineWidth = Math.max(4, size / 7);
        ctx.textBaseline = atTop ? 'top' : 'bottom';
        const lh = size * 1.1;
        lines.forEach((line, i) => {
            const y = atTop
                ? 12 + i * lh
                : 500 - (lines.length - 1 - i) * lh;
            ctx.strokeText(line, 256, y, 490);
            ctx.fillText(line, 256, y, 490);
        });
    };

    draw(top, true);
    draw(bottom, false);

    return pngToSticker(sharp, canvas.toBuffer('image/png'), pack, author);
}

// ======================= [ Command ] =======================
const handler = async (m) => {
    const { command, msg, sender, Hanz } = m;
    const p = config.prefix;

    const userJid = msg.key.participant || msg.key.remoteJid || sender;
    const tag = userJid.split('@')[0].split(':')[0];

    switch (command.name) {
        case 'stickermenu': {
            const text =
` ┌─ ✧ *STICKER MENU*\n │ ⊳ ${p}sticker\n │ ⊳ ${p}toimg\n │ ⊳ ${p}swm\n │ ⊳ ${p}smeme\n │ ⊳ ${p}emojimix\n │ ⊳ ${p}bratanyaa\n └───────────────`;

            await deliver(m, {
                text,
                footer: brand.footer,
                buttons: [categoryButton()],
                userJid,
                video: null
            });
            break;
        }

        // ---------- Gambar / video → stiker ----------
        case 'sticker':
        case 'stiker': {
            try {
                const media = await getMedia(msg);
                if (!media || media.type === 'sticker') {
                    return m.reply({ text: `Kirim / reply gambar atau video (maks 10 detik) dengan caption ${p}${command.name}\nOpsional: ${p}${command.name} <pack>|<author>` });
                }
                if (media.type === 'video' && media.seconds > 10) {
                    return m.reply({ text: '❌ Durasi video maksimal 10 detik.' });
                }

                await m.react('⏳');
                const { pack, author } = packInfo(command.fullArgs);
                let sticker;

                if (media.type === 'image') {
                    sticker = await pngToSticker(require('sharp'), media.buffer, pack, author);
                } else {
                    sticker = await videoToSticker(media.buffer, pack, author);
                }

                await Hanz.sendMessage(sender, { sticker }, { quoted: msg });
                await m.react('✅');
            } catch (e) {
                console.error('[STICKER]', e);
                await m.react('❌');
                const noFfmpeg = e?.code === 'ENOENT';
                const noModule = e?.code === 'MODULE_NOT_FOUND';
                await m.reply({ text: noFfmpeg
                    ? '❌ ffmpeg belum terpasang di server (dibutuhkan untuk stiker video/GIF).'
                    : noModule
                        ? '❌ Modul belum terpasang. Jalankan `npm install` (butuh sharp).'
                        : '❌ Gagal membuat stiker.' });
            }
            break;
        }

        // ---------- Stiker → gambar ----------
        case 'toimg':
        case 'toimage': {
            try {
                const media = await getMedia(msg);
                if (!media || media.type !== 'sticker') {
                    return m.reply({ text: `Reply stiker dengan ${p}${command.name}` });
                }
                await m.react('⏳');
                const png = await require('sharp')(media.buffer).png().toBuffer();
                await Hanz.sendMessage(sender, {
                    image: png,
                    caption: media.animated ? '✅ Stiker animasi → diambil frame pertama saja.' : '✅ Berhasil.'
                }, { quoted: msg });
                await m.react('✅');
            } catch (e) {
                console.error('[TOIMG]', e);
                await m.react('❌');
                await m.reply({ text: '❌ Gagal mengubah stiker ke gambar.' });
            }
            break;
        }

        // ---------- Ganti nama pack / author stiker ----------
        case 'swm': {
            try {
                const media = await getMedia(msg);
                if (!media || media.type !== 'sticker') {
                    return m.reply({ text: `Reply stiker dengan ${p}${command.name} <pack>|<author>\nContoh: ${p}${command.name} Suzuka|Welper` });
                }
                await m.react('⏳');
                const { pack, author } = packInfo(command.fullArgs);
                // re-encode lewat sharp supaya EXIF lama terbuang (animasi tetap dipertahankan)
                const webp = await require('sharp')(media.buffer, { animated: true })
                    .webp({ quality: 90 })
                    .toBuffer();
                const sticker = addExif(webp, buildExif(pack, author));
                await Hanz.sendMessage(sender, { sticker }, { quoted: msg });
                await m.react('✅');
            } catch (e) {
                console.error('[SWM]', e);
                await m.react('❌');
                await m.reply({ text: '❌ Gagal mengganti nama stiker.' });
            }
            break;
        }

        // ---------- Stiker meme ----------
        case 'smeme':
        case 'stickermeme': {
            try {
                const media = await getMedia(msg);
                if (!media || media.type !== 'image') {
                    return m.reply({ text: `Kirim / reply gambar dengan ${p}${command.name} <atas>|<bawah>\nContoh: ${p}${command.name} halo|dunia` });
                }
                if (!command.fullArgs) {
                    return m.reply({ text: `Teksnya mana?\nContoh: ${p}${command.name} halo|dunia` });
                }
                await m.react('⏳');
                const [top, bottom] = command.fullArgs.split('|').map((v) => v.trim());
                const { pack, author } = packInfo('');
                const sticker = await makeMeme(media.buffer, top, bottom, pack, author);
                await Hanz.sendMessage(sender, { sticker }, { quoted: msg });
                await m.react('✅');
            } catch (e) {
                console.error('[SMEME]', e);
                await m.react('❌');
                await m.reply({ text: '❌ Gagal membuat stiker meme.' });
            }
            break;
        }

        // ---------- Emoji mix (Google Emoji Kitchen) ----------
        case 'emojimix': {
            try {
                const seg = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(command.fullArgs.replace(/[+\s]/g, ''))]
                    .map((x) => x.segment)
                    .filter((x) => /\p{Extended_Pictographic}/u.test(x));
                if (seg.length < 2) {
                    return m.reply({ text: `Contoh: ${p}${command.name} 😀+😍` });
                }
                await m.react('⏳');
                const url = 'https://tenor.googleapis.com/v2/featured?key=AIzaSyACvEq5cnT7AEcpbZ6QsMlSBrmxGKkdbUE'
                    + '&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5'
                    + `&q=${encodeURIComponent(seg[0] + '_' + seg[1])}`;
                const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
                const json = await res.json();
                const png = json?.results?.[0]?.media_formats?.png_transparent?.url;
                if (!png) return m.reply({ text: '❌ Kombinasi emoji itu tidak tersedia.' });

                const buf = Buffer.from(await (await fetch(png)).arrayBuffer());
                const { pack, author } = packInfo('');
                const sticker = await pngToSticker(require('sharp'), buf, pack, author);
                await Hanz.sendMessage(sender, { sticker }, { quoted: msg });
                await m.react('✅');
            } catch (e) {
                console.error('[EMOJIMIX]', e);
                await m.react('❌');
                await m.reply({ text: '❌ Gagal membuat emojimix.' });
            }
            break;
        }

        case 'bratanyaa': {
            const input = (command.fullArgs || getQuotedText(msg) || '').trim();
            if (!input) {
                return m.reply({ text: `✨ Contoh:\n${p}${command.name} halo member` });
            }

            try {
                await m.react('✨');
                const sticker = await makeBrat(input);
                await Hanz.sendMessage(sender, { sticker }, { quoted: msg });
                await m.react('✅');
            } catch (e) {
                console.error('[BRAT]', e);
                await m.react('❌');

                const missing = e?.code === 'MODULE_NOT_FOUND';
                await m.reply({ text: missing
                    ? '❌ Modul belum terpasang. Owner perlu jalankan `npm install` (butuh @napi-rs/canvas & sharp).'
                    : '❌ Gagal membuat stiker Brat.' });
            }
            break;
        }
    }
};

module.exports = handler;

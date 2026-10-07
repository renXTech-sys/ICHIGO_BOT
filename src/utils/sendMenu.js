const fs = require('fs');
const path = require('path');
const config = require('../config');
const brand = require('./brand');
const channel = require('./channel');
const { buildHeader } = require('./menuHeader');

// Ambil media: file lokal di src/media/ (Buffer) atau link http(s). null kalau tidak ada.
function loadMedia(src) {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return { url: src };
    const file = path.join(__dirname, '../media', src);
    if (!fs.existsSync(file)) {
        console.warn(`[MENU] Media tidak ditemukan: ${file} — menu dikirim tanpa media.`);
        return null;
    }
    return fs.readFileSync(file);
}

function withTimeout(promise, ms, label) {
    let t;
    const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${label} timeout ${ms / 1000}s`)), ms); });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

// Foto header untuk SEMUA menu. Bisa diganti lewat config.menuImage (link http(s) atau nama file di src/media/).
const MENU_IMAGE_URL = 'https://g.top4top.io/p_39329yb7i0.jpeg';
let menuImageCache = null;

// Foto di-download sekali lalu disimpan di memori (Buffer), jadi tiap .menu tidak download ulang.
async function getMenuImage() {
    if (menuImageCache) return menuImageCache;
    const src = config.menuImage || MENU_IMAGE_URL;

    if (!/^https?:\/\//i.test(src)) {
        const local = loadMedia(src);
        if (local) return (menuImageCache = local);
    }

    const url = /^https?:\/\//i.test(src) ? src : MENU_IMAGE_URL;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        menuImageCache = Buffer.from(await res.arrayBuffer());
        return menuImageCache;
    } catch (err) {
        console.warn('[MENU] Gagal download foto menu, pakai link langsung:', err.message);
        return { url };
    }
}

// Thumbnail kecil (JPEG) untuk kartu foto yang ditempel di dalam bubble menu.
let menuThumbCache = null;
async function getMenuThumb(img) {
    if (menuThumbCache) return menuThumbCache;
    if (!Buffer.isBuffer(img)) return null;
    let buf = img;
    try {
        buf = await require('sharp')(img).resize(640, null, { withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
    } catch { /* sharp belum terpasang → pakai foto asli */ }
    return (menuThumbCache = buf);
}

// Foto sebagai kartu besar di dalam pesan yang sama dengan video (satu bubble).
async function buildPhotoCard(img) {
    const url = /^https?:\/\//i.test(config.menuImage || '') ? config.menuImage : MENU_IMAGE_URL;
    const thumbnail = await getMenuThumb(img);
    return {
        title: brand.botName,
        body: brand.footer || '',
        mediaType: 1,
        thumbnailUrl: url,
        sourceUrl: channel.url,
        renderLargerThumbnail: true,
        showAdAttribution: false,
        ...(thumbnail ? { thumbnail } : {}),
    };
}

/**
 * Kirim menu — SEMUA menu memakai foto:
 *  - tanpa tombol (mis. allmenu)  → foto menempel di teks, satu bubble (tanpa button)
 *  - ada tombol                   → pesan interaktif dengan foto sebagai header
 *  - ada video (mis. .menu)       → foto + video + teks + tombol dalam SATU bubble (config.menuStyle = 'stacked' untuk 2 pesan)
 *
 * Fallback bertingkat supaya menu SELALU keluar:
 *  1) pesan interaktif (tombol)  → menuMode 'interactive'
 *  2) pesan biasa (foto/video + caption) → menuMode 'simple' atau kalau (1) gagal
 *  3) teks biasa                 → kalau (2) gagal
 */
async function deliver(m, { text, footer, buttons, userJid, video, image, header = true }) {
    const { Hanz, sender, fakeWeb } = m;
    // BOT INFO ringkas selalu di paling atas setiap menu
    if (header) text = [buildHeader(m, userJid), text].filter(Boolean).join('\n\n');
    const img = image === undefined ? await getMenuImage() : image;
    // Tombol "Saluran" otomatis ikut di setiap menu yang punya tombol
    if (Array.isArray(buttons) && buttons.length > 0 && !buttons.some(b => b?.name === 'cta_url' && /channel/.test(b.buttonParamsJson || ''))) {
        buttons = [...buttons, channel.button()];
    }
    const hasButtons = Array.isArray(buttons) && buttons.length > 0;
    const caption = `${text}\n\n${footer || ''}`.trim();
    const mentions = [userJid];
    const quoted = { quoted: fakeWeb };

    const sendPhoto = (cap) => withTimeout(
        Hanz.sendMessage(sender, { image: img, ...(cap ? { caption: cap, mentions } : {}) }, quoted),
        60000, 'kirim foto menu'
    );

    // ---------- Tanpa tombol (mis. allmenu): foto + teks dalam SATU bubble ----------
    if (!hasButtons) {
        try {
            if (img) {
                const card = await buildPhotoCard(img);
                await withTimeout(
                    Hanz.sendMessage(sender, { text: caption, contextInfo: { mentionedJid: mentions, externalAdReply: card } }, quoted),
                    60000, 'kirim menu tanpa tombol'
                );
                console.log('[MENU] terkirim (foto menempel di teks, tanpa tombol)');
                return;
            }
        } catch (err) {
            console.error('[MENU] foto menempel gagal, pakai foto + teks:', err?.stack || err?.message || err);
            try {
                await sendPhoto('');
                await Hanz.sendMessage(sender, { text: caption, mentions }, quoted);
                return;
            } catch { /* lanjut ke teks biasa */ }
        }
        await Hanz.sendMessage(sender, { text: caption, mentions }, quoted);
        return;
    }

    // ---------- Video + foto ----------
    // 'attached' (default): foto jadi kartu di DALAM bubble yang sama dengan video, teks, dan tombol.
    // 'stacked'           : foto dikirim sebagai pesan terpisah tepat di atas menu video.
    const attached = !!(video && img) && config.menuStyle !== 'stacked';
    let photoSent = false;
    if (video && img && !attached) {
        try { await sendPhoto(''); photoSent = true; } catch (err) {
            console.error('[MENU] foto atas video gagal:', err?.message || err);
        }
    }

    const contextInfo = { mentionedJid: [userJid] };
    if (attached) {
        try { contextInfo.externalAdReply = await buildPhotoCard(img); } catch (err) {
            console.error('[MENU] kartu foto gagal dibuat:', err?.message || err);
        }
    }
    const payload = { text, footer, quoted: fakeWeb, contextInfo, buttons };

    if (config.menuMode !== 'simple') {
        try {
            const job = video
                ? m.sendInteractiveWithVideo({ ...payload, videoSource: video, gif: true })
                : img
                    ? m.sendInteractiveWithImage({ ...payload, imageSource: img })
                    : m.sendInteractive(payload);
            await withTimeout(job, 30000, 'kirim menu interaktif');
            console.log('[MENU] terkirim (interactive)');
            return;
        } catch (err) {
            console.error('[MENU] interactive gagal, pakai pesan biasa:', err?.stack || err?.message || err);
        }
    }

    if (video && img && !photoSent) {
        try { await sendPhoto(''); } catch { /* lanjut tanpa foto */ }
    }

    try {
        const content = video
            ? { video, gifPlayback: true, caption, mentions: [userJid] }
            : img
                ? { image: img, caption, mentions: [userJid] }
                : { text: caption, mentions: [userJid] };
        await withTimeout(Hanz.sendMessage(sender, content, { quoted: fakeWeb }), 60000, 'kirim menu biasa');
        console.log('[MENU] terkirim (simple)');
    } catch (err) {
        console.error('[MENU] pesan biasa gagal, pakai teks:', err?.stack || err?.message || err);
        await Hanz.sendMessage(sender, { text: caption, mentions: [userJid] });
    }
}

module.exports = { deliver, withTimeout, loadMedia, getMenuImage, MENU_IMAGE_URL };

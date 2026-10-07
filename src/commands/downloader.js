const config = require('../config');
const brand = require('../utils/brand');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');
const legacy = require('../utils/legacyBridge');

// ======================= [ Helper ] =======================
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

// teks dari reply (kalau ada)
function getQuotedText(msg) {
    const c = unwrap(msg.message);
    const ctx = c?.extendedTextMessage?.contextInfo
        || c?.imageMessage?.contextInfo
        || c?.videoMessage?.contextInfo;
    return textOf(ctx?.quotedMessage);
}

function getAuthor(data) {
    return data.author?.nickname || data.author?.unique_id || data.author || '-';
}

function formatNumber(num = 0) {
    return Number(num).toLocaleString();
}

function formatDuration(sec = 0) {
    sec = Number(sec);
    const mm = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
}

// ======================= [ TikTok dengan fallback ] =======================
async function getTikTok(url) {
    // PRIMARY : TIKWM
    try {
        const res = await (await fetch(
            `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`
        )).json();
        if (res?.data) return res.data;
    } catch {}

    // FALLBACK : SIPUTZX
    try {
        const res = await (await fetch(
            `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`
        )).json();
        if (res?.data) {
            const d = res.data;
            return {
                title: d.title || d.desc,
                play_count: d.stats?.playCount || d.play_count || 0,
                author: d.author,
                duration: d.duration,
                play: d.video || d.no_watermark || d.play,
                music: d.music || d.audio,
                images: d.images || d.photo || d.images_url,
            };
        }
    } catch {}

    return null;
}

// ======================= [ Command ] =======================
const handler = async (m) => {
    const { command, msg, sender, Hanz } = m;
    const p = config.prefix;

    const userJid = msg.key.participant || msg.key.remoteJid || sender;
    const tag = userJid.split('@')[0].split(':')[0];

    switch (command.name) {
        case 'downloadermenu': {
            const text =
` ┌─ ✧ *DOWNLOADER MENU*
 │ ⊳ ${p}tt
 │ ⊳ ${p}ttdl
 │ ⊳ ${p}tiktok
 │ ⊳ ${p}ig
 │ ⊳ ${p}igdl
 │ ⊳ ${p}instagram
 │ ⊳ ${p}fb
 │ ⊳ ${p}facebook
 │ ⊳ ${p}fbdl
 │ ⊳ ${p}ytdlp
 │ ⊳ ${p}yta
 │ ⊳ ${p}ytmp3
 │ ⊳ ${p}ytv
 │ ⊳ ${p}ytmp4
 │ ⊳ ${p}play
 │ ⊳ ${p}play2
 │ ⊳ ${p}ytplay
 │ ⊳ ${p}ytp
 │ ⊳ ${p}spotify
 │ ⊳ ${p}yts
 │ ⊳ ${p}ytsearch
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

        case 'tt':
        case 'ttdl':
        case 'tiktok': {
            try {
                await m.react('✨');

                const input = getQuotedText(msg) || command.fullArgs;
                if (!input) {
                    return m.reply({ text:
`Contoh:
${p}${command.name} https://vt.tiktok.com/xxxx
${p}${command.name} elaina edit` });
                }

                const regex = /(https:\/\/(vt|vm)\.tiktok\.com\/[^\s]+|https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+)/;
                const url = input.match(regex)?.[0];

                let data;

                if (url) {
                    // link langsung
                    data = await getTikTok(url);
                    if (!data) return m.reply({ text: '❌ Semua API TikTok gagal.' });
                } else {
                    // search
                    const search = await (await fetch(
                        `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(input)}&count=1&cursor=0&web=1&hd=1`
                    )).json();

                    const video = search?.data?.videos?.[0];
                    if (!video) return m.reply({ text: `❌ Hasil tidak ditemukan untuk "${input}"` });

                    data = await getTikTok(
                        `https://www.tiktok.com/@${video.author.unique_id}/video/${video.video_id}`
                    );
                    if (!data) return m.reply({ text: '❌ Gagal mengambil hasil search.' });
                }

                // ---------- TIKTOK PHOTO ----------
                const images = data.images || data.image || data.photo || data.images_url;

                if (images && images.length) {
                    for (let i = 0; i < images.length; i++) {
                        await Hanz.sendMessage(sender, {
                            image: { url: images[i] },
                            caption: i === 0
                                ? `🖼️ *TIKTOK PHOTO*

> Judul : ${data.title || '-'}
> Uploader : ${getAuthor(data)}
> Total Foto : ${images.length}
> Views : ${formatNumber(data.play_count)}`
                                : ''
                        }, { quoted: msg });

                        await delay(3000);
                    }
                    return;
                }

                // ---------- TIKTOK VIDEO ----------
                const videoUrl = data.play || data.video || data.no_watermark || data.play_url || data.video_url;

                if (videoUrl) {
                    await Hanz.sendMessage(sender, {
                        video: { url: videoUrl },
                        mimetype: 'video/mp4',
                        caption:
`🎬 *TIKTOK VIDEO*

> Judul : ${data.title || '-'}
> Uploader : ${getAuthor(data)}
> Durasi : ${formatDuration(data.duration)}
> Views : ${formatNumber(data.play_count)}`
                    }, { quoted: msg });
                }

                // ---------- AUDIO ----------
                const audio = data.music_info?.play || data.music || data.audio || data.music_url;

                if (audio) {
                    await Hanz.sendMessage(sender, {
                        audio: { url: audio },
                        mimetype: 'audio/mpeg',
                        fileName: `${data.title || 'tiktok'}.mp3`
                    }, { quoted: msg });
                }
            } catch (e) {
                console.error('[TIKTOK]', e);
                await m.reply({ text: '❌ Terjadi kesalahan saat download TikTok.' });
            }
            break;
        }

        // ---- fitur tambahan downloader, dijalankan lewat legacyBridge ----
        case 'ig': return legacy.run('down-instagram.mjs', 'ig', m);
        case 'igdl': return legacy.run('down-instagram.mjs', 'igdl', m);
        case 'instagram': return legacy.run('down-instagram.mjs', 'instagram', m);
        case 'fb': return legacy.run('down-facebook.mjs', 'fb', m);
        case 'facebook': return legacy.run('down-facebook.mjs', 'facebook', m);
        case 'fbdl': return legacy.run('down-facebook.mjs', 'fbdl', m);
        case 'ytdlp': return legacy.run('down-ytdlp.mjs', 'ytdlp', m);
        case 'yta': return legacy.run('down-ytmp3.mjs', 'yta', m);
        case 'ytmp3': return legacy.run('down-ytmp3.mjs', 'ytmp3', m);
        case 'ytv': return legacy.run('down-ytmp3.mjs', 'ytv', m);
        case 'ytmp4': return legacy.run('down-ytmp3.mjs', 'ytmp4', m);
        case 'play': return legacy.run('down-play.mjs', 'play', m);
        case 'play2': return legacy.run('down-play2.mjs', 'play2', m);
        case 'ytplay': return legacy.run('down-play3.mjs', 'ytplay', m);
        case 'ytp': return legacy.run('down-play3.mjs', 'ytp', m);
        case 'spotify': return legacy.run('down-spotify.mjs', 'spotify', m);
        case 'yts': return legacy.run('down-yts.mjs', 'yts', m);
        case 'ytsearch': return legacy.run('down-yts.mjs', 'ytsearch', m);
        case 'youtubesearch': return legacy.run('down-yts.mjs', 'youtubesearch', m);
    }
};

module.exports = handler;

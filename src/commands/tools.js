const crypto = require('crypto');
const config = require('../config');
const brand = require('../utils/brand');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');
const legacy = require('../utils/legacyBridge');

// Modul berat di-require saat dipakai saja, supaya kalau belum di-install
// (npm i axios cheerio form-data sharp) bot tetap jalan normal.
const lazy = (name) => require(name);

// ======================= [ Ambil gambar dari pesan / reply ] =======================
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

async function getImageBuffer(msg) {
    const { downloadMediaMessage } = lazy('@hanzofc/baileys');
    const content = unwrap(msg.message);

    // 1) gambar dikirim langsung dengan caption .hd
    if (content?.imageMessage) {
        return downloadMediaMessage({ key: msg.key, message: content }, 'buffer', {});
    }

    // 2) reply ke gambar
    const ctx = content?.extendedTextMessage?.contextInfo;
    const quoted = unwrap(ctx?.quotedMessage);
    if (quoted?.imageMessage) {
        const key = {
            remoteJid: msg.key.remoteJid,
            id: ctx.stanzaId,
            participant: ctx.participant,
        };
        return downloadMediaMessage({ key, message: quoted }, 'buffer', {});
    }
    return null;
}

// ======================= [ iLoveIMG API ] =======================
async function getToken() {
    const axios = lazy('axios');
    const cheerio = lazy('cheerio');
    const html = await axios.get('https://www.iloveimg.com/upscale-image');
    const $ = cheerio.load(html.data);
    const script = $('script')
        .filter((i, el) => ($(el).html() || '').includes('ilovepdfConfig ='))
        .html();
    const jsonS = script.split('ilovepdfConfig = ')[1].split(';')[0];
    const json = JSON.parse(jsonS);
    const csrf = $('meta[name="csrf-token"]').attr('content');
    return { token: json.token, csrf };
}

async function uploadImage(server, headers, buffer, task) {
    const axios = lazy('axios');
    const FormData = lazy('form-data');
    const form = new FormData();
    form.append('name', 'image.jpg');
    form.append('chunk', '0');
    form.append('chunks', '1');
    form.append('task', task);
    form.append('preview', '1');
    form.append('file', buffer, 'image.jpg');

    const res = await axios.post(`https://${server}.iloveimg.com/v1/upload`, form, {
        headers: { ...headers, ...form.getHeaders() },
    });
    return res.data;
}

async function hdr(buffer, scale = 4) {
    const axios = lazy('axios');
    const FormData = lazy('form-data');
    const { token, csrf } = await getToken();
    const servers = [
        'api1g', 'api2g', 'api3g', 'api8g', 'api9g', 'api10g', 'api11g',
        'api12g', 'api13g', 'api14g', 'api15g', 'api16g', 'api17g', 'api18g',
        'api19g', 'api20g', 'api21g', 'api22g', 'api24g', 'api25g',
    ];
    const server = servers[Math.floor(Math.random() * servers.length)];

    const task = 'r68zl88mq72xq94j2d5p66bn2z9lrbx20njsbw2qsAvgmzr11lvfhAx9kl87pp6yqgx7c8vg7sfbqnrr42qb16v0gj8jl5s0kq1kgp26mdyjjspd8c5A2wk8b4Adbm6vf5tpwbqlqdr8A9tfn7vbqvy28ylphlxdl379psxpd8r70nzs3sk1';
    const headers = {
        Authorization: 'Bearer ' + token,
        Origin: 'https://www.iloveimg.com/',
        Cookie: '_csrf=' + csrf,
        'User-Agent': 'Mozilla/5.0',
    };

    const upload = await uploadImage(server, headers, buffer, task);

    const form = new FormData();
    form.append('task', task);
    form.append('server_filename', upload.server_filename);
    form.append('scale', scale);

    const res = await axios.post(`https://${server}.iloveimg.com/v1/upscale`, form, {
        headers: { ...headers, ...form.getHeaders() },
        responseType: 'arraybuffer',
    });
    return Buffer.from(res.data);
}

// ======================= [ Remini API Fallback ] =======================
const API = 'https://a.android.api.remini.ai/v1/mobile';
const ORACLE = 'https://api.remini.ai/v1/mobile/oracle';

function genId() {
    const a = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    return {
        android_id: a,
        aaid: crypto.randomUUID(),
        backup_persistent_id: a + '_com.bigwinepot.nwdn.international',
        non_backup_persistent_id: crypto.randomUUID(),
    };
}

let dev = genId();
let reminiToken = null;

function bh(extra) {
    return {
        'bsp-id': 'com.bigwinepot.nwdn.international.android',
        'build-number': '202514479', 'build-version': '3.7.1020',
        'country': 'US', 'device-manufacturer': 'Samsung', 'device-model': 'SM-G998B',
        'device-type': '6.8', 'language': 'en', 'locale': 'en_US',
        'os-version': '33', 'platform': 'Android', 'timezone': 'America/New_York',
        'android-id': dev.android_id, 'aaid': dev.aaid,
        'accept-encoding': 'gzip', 'user-agent': 'okhttp/4.12.0',
        ...(extra || {}),
    };
}

function ah(extra) {
    const h = bh(extra);
    if (reminiToken) h['identity-token'] = reminiToken;
    return h;
}

async function reminiAuth() {
    dev = genId();
    const r = await fetch(ORACLE + '/setup', {
        headers: bh({
            'first-install-timestamp': Math.floor(Date.now() / 1000) + 'E9',
            'backup-persistent-id': dev.backup_persistent_id,
            'non-backup-persistent-id': dev.non_backup_persistent_id,
            'environment': 'Production', 'settings-response-version': 'v2',
            'is-app-running-in-background': 'false', 'is-old-user': 'true',
            'app-set-id': 'd44bd45a-a45d-4470-9674-7348a8e3fb71',
        }),
    });
    const d = await r.json();
    reminiToken = d.settings.__identity__.token;
    if (!reminiToken) throw new Error('No token from Remini');
    await fetch(API + '/users/@me', { headers: ah() });
}

async function reminiHDFallback(buffer) {
    const axios = lazy('axios');
    await reminiAuth();
    const mime = 'image/jpeg';
    const md5 = crypto.createHash('md5').update(buffer).digest('base64');

    const meta = { size: buffer.length };
    try {
        const sharp = lazy('sharp');
        const info = await sharp(buffer).metadata();
        meta.width = info.width;
        meta.height = info.height;
    } catch {}

    const taskR = await fetch(API + '/tasks', {
        method: 'POST',
        headers: ah({ 'content-type': 'application/json; charset=UTF-8' }),
        body: JSON.stringify({
            image_content_type: mime,
            image_md5: md5,
            feature: { type: 'enhance', models: [] },
            metadata: meta,
            options: { high_quality_output: false, save_input: true },
        }),
    });

    const taskD = await taskR.json();
    if (!taskD.task_id || !taskD.upload_url || !taskD.upload_headers) throw new Error('Missing fields in Remini Task');

    await fetch(taskD.upload_url, {
        method: 'PUT',
        headers: { ...taskD.upload_headers, 'Content-Length': buffer.length.toString(), 'User-Agent': 'okhttp/4.12.0' },
        body: buffer,
    });

    await fetch(API + '/tasks/' + taskD.task_id + '/process', {
        method: 'POST',
        headers: ah({ 'content-length': '0' }),
    });

    let cdnUrl = null;
    for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const pr = await fetch(API + '/tasks/' + taskD.task_id, { headers: ah() });
        const pd = await pr.json();
        if (pd.status === 'completed') {
            const outs = pd.result && pd.result.outputs;
            if (outs && Array.isArray(outs) && outs[0] && outs[0].url) cdnUrl = outs[0].url;
            break;
        }
        if (pd.status === 'failed' || pd.status === 'error') throw new Error('Remini Task failed');
    }

    if (!cdnUrl) throw new Error('No output URL from Remini');
    const finalImage = await axios.get(cdnUrl, { responseType: 'arraybuffer' });
    return Buffer.from(finalImage.data);
}

// ======================= [ Command ] =======================
const handler = async (m) => {
    const { command, msg, sender } = m;
    const p = config.prefix;

    const userJid = msg.key.participant || msg.key.remoteJid || sender;
    const tag = userJid.split('@')[0].split(':')[0];

    switch (command.name) {
        case 'toolsmenu': {
            const text =
` ┌─ ✧ *TOOLS MENU*
 │ ⊳ ${p}hd
 │ ⊳ ${p}hdr
 │ ⊳ ${p}ssweb
 │ ⊳ ${p}rch
 │ ⊳ ${p}togif
 │ ⊳ ${p}cekidch
 │ ⊳ ${p}idch
 │ ⊳ ${p}barcode
 │ ⊳ ${p}tempmail
 │ ⊳ ${p}cekmail
 │ ⊳ ${p}pesanmail
 │ ⊳ ${p}tourl
 │ ⊳ ${p}idgc
 │ ⊳ ${p}hapus
 │ ⊳ ${p}fetch
 │ ⊳ ${p}fotolive
 │ ⊳ ${p}ppwa
 │ ⊳ ${p}hdvideo
 │ ⊳ ${p}kodebahasa
 │ ⊳ ${p}qrcode
 │ ⊳ ${p}tiktokboost
 │ ⊳ ${p}tofile
 │ ⊳ ${p}tomp3
 │ ⊳ ${p}whatmusic
 │ ⊳ ${p}8upload
 │ ⊳ ${p}blur
 │ ⊳ ${p}caption
 │ ⊳ ${p}compress
 │ ⊳ ${p}tqto
 │ ⊳ ${p}compressvid
 │ ⊳ ${p}enc
 │ ⊳ ${p}sprem
 │ ⊳ ${p}voice
 │ ⊳ ${p}toptv
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

        case 'hd':
        case 'hdr': {
            let media;
            try {
                media = await getImageBuffer(msg);
            } catch (e) {
                console.error('[HD] gagal download gambar:', e?.message || e);
                return m.reply({ text: '❌ Gagal mengunduh gambar, coba kirim ulang.' });
            }
            if (!media) {
                return m.reply({ text: `Kirim/Reply foto dengan caption ${p}${command.name}` });
            }

            await m.reply({ text: '⏳ Memproses gambar, tunggu sebentar...' });

            // hdr = 4x, hd = 2x
            const scale = command.name === 'hdr' ? 4 : 2;
            let res;
            try {
                res = await hdr(media, scale);
            } catch (e) {
                console.log('[iLoveIMG Error] Fallback ke Remini...', e.message);
                try {
                    res = await reminiHDFallback(media);
                } catch (err) {
                    return m.reply({ text: `❌ Gagal memproses gambar. Error: ${err.message}` });
                }
            }

            await m.reply({ image: res, caption: 'Nih Hasilnya' });
            break;
        }

        // ---- fitur tambahan (dulu di toolsx.js), dijalankan lewat legacyBridge ----
        case 'ssweb': return legacy.run('tools-ssweb.mjs', 'ssweb', m);
        case 'rch': return legacy.run('rch.mjs', 'rch', m);
        case 'togif': return legacy.run('tools-togif.mjs', 'togif', m);
        case 'cekidch': return legacy.run('tools-cekidch.mjs', 'cekidch', m);
        case 'idch': return legacy.run('tools-cekidch.mjs', 'idch', m);
        case 'cekchannel': return legacy.run('tools-cekidch.mjs', 'cekchannel', m);
        case 'barcode': return legacy.run('tools-barcode.mjs', 'barcode', m);
        case 'tempmail': return legacy.run('tools-tempmail.mjs', 'tempmail', m);
        case 'cekmail': return legacy.run('tools-tempmail.mjs', 'cekmail', m);
        case 'pesanmail': return legacy.run('tools-tempmail.mjs', 'pesanmail', m);
        case 'tourl': return legacy.run('tools-tourl.mjs', 'tourl', m);
        case 'idgc': return legacy.run('tools-idgc.mjs', 'idgc', m);
        case 'hapus': return legacy.run('tools-delete.mjs', 'hapus', m);
        case 'fetch': return legacy.run('tools-fetch.mjs', 'fetch', m);
        case 'fotolive': return legacy.run('tools-fotolive.mjs', 'fotolive', m);
        case 'ppwa': return legacy.run('tools-getpp.mjs', 'ppwa', m);
        case 'hdvideo': return legacy.run('tools-hdvid.mjs', 'hdvideo', m);
        case 'kodebahasa': return legacy.run('tools-kodebahasa.mjs', 'kodebahasa', m);
        case 'qrcode': return legacy.run('tools-qrcode.mjs', 'qrcode', m);
        case 'tiktokboost': return legacy.run('tools-tiktokboost.mjs', 'tiktokboost', m);
        case 'tofile': return legacy.run('tools-tofile.mjs', 'tofile', m);
        case 'tomp3': return legacy.run('tools-tomp3.mjs', 'tomp3', m);
        case 'whatmusic': return legacy.run('tools-whatmusic.mjs', 'whatmusic', m);
        case '8upload': return legacy.run('tools-8upload.mjs', '8upload', m);
        case 'blur': return legacy.run('tools-blur.mjs', 'blur', m);
        case 'caption': return legacy.run('tools-cap.mjs', 'caption', m);
        case 'compress': return legacy.run('tools-compress.mjs', 'compress', m);
        case 'compressvid': return legacy.run('compressvid.mjs', 'compressvid', m);
        case 'enc': return legacy.run('tools-enc.mjs', 'enc', m);
        case 'sprem': return legacy.run('sprem.mjs', 'sprem', m);
        case 'voice': return legacy.run('voice.mjs', 'voice', m);
        case 'toptv': return legacy.run('toptv.mjs', 'toptv', m);
    }
};

module.exports = handler;

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Audio yang dikirim setelah .menu. Bisa diganti lewat config.menuAudio
// (link http/https atau nama file di src/media/). Isi '' di config untuk mematikan.
const MENU_AUDIO_URL = 'https://u.pone.rs/eikhfsyp.mp3';

let cache = null;   // { ogg: Buffer|null, raw: Buffer, src: string }

async function download(url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`download audio gagal: ${res.status} ${res.statusText}`);
    return Buffer.from(await res.arrayBuffer());
}

async function loadRaw(src) {
    if (/^https?:\/\//i.test(src)) return download(src);
    const file = path.join(__dirname, '../media', src);
    if (!fs.existsSync(file)) throw new Error(`file audio tidak ada: ${file}`);
    return fs.readFileSync(file);
}

// mp3/apa pun → OGG Opus mono 48kHz, format yang dipakai voice note WhatsApp asli.
// Lewat pipe (stdin→stdout), jadi tidak menulis file sementara ke disk.
function toOpusVoice(input) {
    return new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', [
            '-hide_banner', '-loglevel', 'error',
            '-i', 'pipe:0',
            '-vn', '-ac', '1', '-ar', '48000',
            '-c:a', 'libopus', '-b:a', '48k', '-application', 'voip',
            '-f', 'ogg', 'pipe:1',
        ], { stdio: ['pipe', 'pipe', 'pipe'] });

        const out = [];
        let err = '';
        proc.stdout.on('data', d => out.push(d));
        proc.stderr.on('data', d => { err += d.toString(); });
        proc.on('error', reject);                       // ffmpeg tidak terpasang
        proc.stdin.on('error', () => {});               // abaikan EPIPE kalau ffmpeg berhenti duluan
        proc.on('close', code => {
            const buf = Buffer.concat(out);
            if (code === 0 && buf.length > 0) resolve(buf);
            else reject(new Error(`ffmpeg gagal (kode ${code}): ${err.trim().slice(0, 200)}`));
        });
        proc.stdin.end(input);
    });
}

// Download + konversi hanya sekali, selanjutnya dipakai dari memori.
async function prepare() {
    const src = config.menuAudio === undefined ? MENU_AUDIO_URL : config.menuAudio;
    if (!src) return null;
    if (cache && cache.src === src) return cache;

    const raw = await loadRaw(src);
    let ogg = null;
    try {
        ogg = await toOpusVoice(raw);
    } catch (e) {
        console.warn('[MENU-AUDIO] konversi VN gagal, kirim sebagai audio biasa:', e.message);
    }
    return (cache = { ogg, raw, src });
}

// Kirim sebagai voice note (bisa di-play). Tidak pernah melempar error supaya .menu tidak ikut rusak.
async function sendMenuAudio(m) {
    try {
        const a = await prepare();
        if (!a) return;
        const { Hanz, sender } = m;
        if (a.ogg) {
            await Hanz.sendMessage(sender, {
                audio: a.ogg,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true,
            });
        } else {
            // Fallback tanpa ffmpeg: audio mp3 biasa (ptt:true pada mp3 sering tidak bisa diputar)
            await Hanz.sendMessage(sender, { audio: a.raw, mimetype: 'audio/mpeg', ptt: false });
        }
        console.log('[MENU-AUDIO] terkirim');
    } catch (err) {
        console.error('[MENU-AUDIO] gagal:', err?.message || err);
    }
}

module.exports = { sendMenuAudio, toOpusVoice, MENU_AUDIO_URL };

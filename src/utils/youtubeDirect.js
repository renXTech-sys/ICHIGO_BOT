// Pengganti lib/scrape/YouTube.js untuk fitur .ytplay (down-play3.mjs).
// Butuh: yt-search (npm) dan yt-dlp (terpasang di server).
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const YT_REGEX = /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[A-Za-z0-9_-]{11}[\w\-&=?%.#]*$/i;

// Cari video: kalau input sudah link YouTube langsung dipakai, kalau tidak dicari lewat yt-search
async function searchYoutube(query) {
    const q = String(query || '').trim();
    if (!q) return null;
    if (YT_REGEX.test(q)) return q;

    const yts = require('yt-search');
    const res = await yts(q);
    return res?.videos?.[0]?.url || null;
}

// Ambil direct URL (mp4 gabungan video+audio) via yt-dlp. execFile → tanpa shell, aman dari injection.
async function getYoutubeDirectUrl(url, quality = '360') {
    if (!YT_REGEX.test(String(url || ''))) throw new Error('Link YouTube tidak valid.');
    const h = /^\d{3,4}$/.test(String(quality)) ? String(quality) : '360';

    let stdout;
    try {
        ({ stdout } = await execFileAsync('yt-dlp', [
            '-f', `b[height<=${h}][ext=mp4]/b[ext=mp4]/b`,
            '--no-playlist', '--no-warnings', '--dump-json', url
        ], { timeout: 60000, maxBuffer: 20 * 1024 * 1024 }));
    } catch (e) {
        if (e.code === 'ENOENT') throw new Error('yt-dlp belum terinstall di server.');
        throw new Error('Gagal mengambil info video dari YouTube.');
    }

    const info = JSON.parse(stdout);
    if (!info?.url) throw new Error('Direct link video tidak ditemukan.');

    return {
        url: info.url,
        title: info.title,
        author: info.uploader || info.channel,
        duration: Math.round(Number(info.duration) || 0),
        thumb: info.thumbnail
    };
}

module.exports = { searchYoutube, getYoutubeDirectUrl };

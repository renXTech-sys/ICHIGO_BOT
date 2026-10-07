// toolsx — fitur tambahan dari koleksi plugin pihak ketiga, dijalankan lewat
// src/utils/legacyBridge.js supaya tidak perlu ditulis ulang satu-satu.
// Daftar command di bawah ini WAJIB literal (bukan dibangun lewat loop) karena
// PluginLoader mendeteksi command dari teks "case 'nama':" di file ini.
const legacy = require('../utils/legacyBridge');

const handler = async (m) => {
    const { command } = m;
    switch (command.name) {
        case 'ssweb': return legacy.run('tools-ssweb.mjs', 'ssweb', m);
        case 'rch': return legacy.run('rch.mjs', 'rch', m);
        case 'togif': return legacy.run('tools-togif.mjs', 'togif', m);
        case 'cekidch': return legacy.run('tools-cekidch.mjs', 'cekidch', m);
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

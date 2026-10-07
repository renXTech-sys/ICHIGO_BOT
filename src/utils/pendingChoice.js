// Penyimpanan sementara untuk fitur "ketik angka 1-10 untuk memilih"
// (stickerly, stickerpack). Disimpan di global supaya tidak hilang saat plugin di-reload.
if (!global.pendingChoice) global.pendingChoice = new Map();

const TTL_MS = 5 * 60 * 1000;

function keyOf(msg) {
    return `${msg.key.remoteJid}|${msg.key.participant || ''}`;
}

/** Simpan pilihan yang sedang ditunggu. run(n) dipanggil dengan angka pilihan (1..max). */
function set(msg, { max, run }) {
    global.pendingChoice.set(keyOf(msg), { max, run, expires: Date.now() + TTL_MS });
}

/** Ambil (dan hapus) pilihan kalau ada, belum kadaluarsa, dan angkanya masuk rentang. */
function take(msg, n) {
    const key = keyOf(msg);
    const pend = global.pendingChoice.get(key);
    if (!pend) return null;
    if (Date.now() > pend.expires) {
        global.pendingChoice.delete(key);
        return null;
    }
    if (n < 1 || n > pend.max) return null;
    global.pendingChoice.delete(key);
    return pend.run;
}

module.exports = { set, take };

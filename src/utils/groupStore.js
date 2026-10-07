// Penyimpanan data fitur grup: pengaturan per grup (jadwal, intro, autosholat, dll)
// dan catatan aktivitas member (untuk .sider). Disimpan di src/database/group-data.json.
// Aktivitas ditulis ke memori dulu lalu di-flush berkala supaya tidak menulis file di setiap pesan.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../database/group-data.json');

function load() {
    try {
        const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        return { chats: d.chats || {}, seen: d.seen || {} };
    } catch {
        return { chats: {}, seen: {} };
    }
}

const data = load();
let dirty = false;

function flush() {
    if (!dirty) return;
    dirty = false;
    try {
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        fs.writeFileSync(FILE, JSON.stringify(data));
    } catch (e) {
        dirty = true;
        console.error('[GROUP-STORE] gagal menyimpan:', e.message);
    }
}

setInterval(flush, 15000).unref();
process.on('exit', flush);

// Pengaturan per grup — object ini "hidup": ubah isinya lalu panggil save()
function getChat(jid) {
    if (!data.chats[jid]) data.chats[jid] = {};
    return data.chats[jid];
}

const allChats = () => data.chats;

function save() { dirty = true; }

// ---- aktivitas member ----
function touch(chatJid, ids) {
    if (!ids?.length) return;
    const s = data.seen[chatJid] || (data.seen[chatJid] = { since: Date.now(), users: {} });
    const now = Date.now();
    for (const id of ids) s.users[id] = now;
    dirty = true;
}

// Waktu terakhir aktif (ms) dari sekumpulan ID milik satu member; 0 kalau belum pernah terlihat
function lastSeen(chatJid, ids) {
    const s = data.seen[chatJid];
    if (!s) return 0;
    let last = 0;
    for (const id of ids) if (s.users[id] > last) last = s.users[id];
    return last;
}

// Sejak kapan aktivitas grup ini dicatat bot
const trackingSince = (chatJid) => data.seen[chatJid]?.since || null;

function resetSeen(chatJid, idLists) {
    const s = data.seen[chatJid] || (data.seen[chatJid] = { since: Date.now(), users: {} });
    const now = Date.now();
    for (const ids of idLists) for (const id of ids) s.users[id] = now;
    dirty = true;
}

module.exports = { getChat, allChats, save, touch, lastSeen, trackingSince, resetSeen, flush };

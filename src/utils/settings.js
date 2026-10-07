const fs = require('fs');
const path = require('path');

// Pengaturan yang diubah lewat command owner disimpan di sini,
// jadi tetap berlaku setelah bot restart (menimpa nilai default di config.js).
const FILE = path.join(__dirname, '../database/settings.json');

function load() {
    try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; }
}

function save(patch) {
    const next = { ...load(), ...patch };
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(next, null, 2));
    return next;
}

// Terapkan pengaturan tersimpan ke config / global (dipanggil sekali saat bot start)
function apply(config) {
    const s = load();
    if (s.botMode === 'public' || s.botMode === 'self') global.botMode = s.botMode;
    if (typeof s.autoRead === 'boolean') config.autoRead = s.autoRead;
    if (typeof s.autoTyping === 'boolean') config.autoTyping = s.autoTyping;
}

module.exports = { load, save, apply };

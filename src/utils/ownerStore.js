// Penyimpanan JSON sederhana untuk fitur owner (blacklist & banned).
// Disimpan di src/database/ supaya tetap ada setelah bot restart.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../database/owner-data.json');

function load() {
    try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; }
}

function save(data) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// Ambil satu koleksi (mis. 'blacklistUser'), selalu berupa object
function getCollection(name) {
    const data = load();
    return data[name] && typeof data[name] === 'object' ? data[name] : {};
}

function setCollection(name, value) {
    const data = load();
    data[name] = value;
    save(data);
}

// Normalisasi JID/nomor jadi angka saja, supaya perbandingan konsisten
const toNumber = (jid) => String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');

module.exports = { getCollection, setCollection, toNumber };

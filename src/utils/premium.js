// Database premium sederhana (src/database/premium.json)
// Format: { "628xxx": 0 }  → 0 = permanen, selain itu = timestamp (ms) kadaluarsa
const fs = require('fs');
const path = require('path');

const FILE = process.env.PREMIUM_DB || path.join(__dirname, '../database/premium.json');

function load() {
    let db = {};
    try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch { db = {}; }
    // buang yang sudah kadaluarsa
    const now = Date.now();
    let changed = false;
    for (const [num, exp] of Object.entries(db)) {
        if (exp && exp <= now) { delete db[num]; changed = true; }
    }
    if (changed) save(db);
    return db;
}

function save(db) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

const clean = (n) => String(n || '').replace(/\D/g, '');

// days = 0 → permanen. Kalau sudah premium, durasi ditambah (permanen tetap permanen).
function add(number, days = 0) {
    const db = load();
    const n = clean(number);
    const cur = db[n];
    if (days <= 0 || cur === 0) {
        db[n] = 0;
    } else {
        db[n] = (cur && cur > Date.now() ? cur : Date.now()) + days * 86400000;
    }
    save(db);
    return db[n];
}

function del(number) {
    const db = load();
    const n = clean(number);
    if (!(n in db)) return false;
    delete db[n];
    save(db);
    return true;
}

function list() {
    return Object.entries(load()).map(([number, exp]) => ({ number, exp }));
}

// ids = array nomor/jid kandidat pengirim
function isPremium(ids = []) {
    const db = load();
    return ids.map(clean).filter(Boolean).some((n) => n in db);
}

module.exports = { add, del, list, isPremium };

// Konteks grup untuk fitur grup: metadata (di-cache), peserta, cek admin, cek bot admin.
// Menangani JID dua gaya WhatsApp (nomor @s.whatsapp.net dan @lid).
const TTL = 60 * 1000;
const cache = new Map(); // groupJid -> { at, meta }

const num = (jid) => String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');

async function getMetadata(Hanz, groupJid, force = false) {
    const hit = cache.get(groupJid);
    if (!force && hit && Date.now() - hit.at < TTL) return hit.meta;
    const meta = await Hanz.groupMetadata(groupJid);
    cache.set(groupJid, { at: Date.now(), meta });
    return meta;
}

const invalidate = (groupJid) => cache.delete(groupJid);

// Semua ID (angka) milik satu peserta: id, lid, nomor telepon
function idsOf(p) {
    const out = new Set();
    for (const v of [p?.id, p?.lid, p?.phoneNumber, p?.jid, p?.participant]) {
        const n = num(v);
        if (n) out.add(n);
    }
    return out;
}

// Semua ID (angka) milik pengirim pesan
function senderIds(msg) {
    const key = msg?.key || {};
    const out = new Set();
    for (const v of [key.participant, key.participantAlt, key.senderPn, key.remoteJidAlt]) {
        if (v && !String(v).endsWith('@g.us')) {
            const n = num(v);
            if (n) out.add(n);
        }
    }
    return out;
}

const botIds = (Hanz) => new Set([num(Hanz.user?.id), num(Hanz.user?.lid)].filter(Boolean));

const intersects = (a, b) => { for (const x of a) if (b.has(x)) return true; return false; };

const isAdminParticipant = (p) => p?.admin === 'admin' || p?.admin === 'superadmin';

// Konteks lengkap untuk satu pesan di grup
async function getContext(Hanz, msg) {
    const chat = msg.key.remoteJid;
    const meta = await getMetadata(Hanz, chat);
    const participants = meta?.participants || [];

    const me = senderIds(msg);
    const bot = botIds(Hanz);

    let isAdmin = false;
    let isBotAdmin = false;
    for (const p of participants) {
        if (!isAdminParticipant(p)) continue;
        const ids = idsOf(p);
        if (intersects(ids, me)) isAdmin = true;
        if (intersects(ids, bot)) isBotAdmin = true;
    }
    return { groupMetadata: meta, participants, isAdmin, isBotAdmin };
}

module.exports = { num, getMetadata, invalidate, idsOf, senderIds, botIds, intersects, isAdminParticipant, getContext };

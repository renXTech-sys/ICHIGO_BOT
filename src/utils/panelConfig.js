// Konfigurasi panel dibaca dari src/config.js (nama key sama seperti config bot Telegram kamu):
//   domain, apikey, capikey, egg, nestid, loc, subdomain, (opsional) emailDomain
// Boleh juga dibungkus: config.panel = { domain, apikey, ... }
const config = require('../config');

function get() {
    const c = config.panel || config;
    return {
        domain: String(c.domain || '').replace(/\/+$/, ''),
        apikey: c.apikey || '',
        capikey: c.capikey || '',
        egg: Number(c.egg) || 0,
        nest: Number(c.nestid) || 0,
        loc: Number(c.loc) || 0,
        emailDomain: c.emailDomain || 'example.com', // domain email palsu untuk akun panel (jangan pakai domain asli)
        subdomain: c.subdomain || {},
    };
}

// key wajib yang masih kosong
function missing() {
    const c = get();
    const need = { domain: c.domain, apikey: c.apikey, egg: c.egg, nestid: c.nest, loc: c.loc };
    return Object.entries(need).filter(([, v]) => !v).map(([k]) => k);
}

module.exports = { get, missing };

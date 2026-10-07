const fs = require('fs');
const path = require('path');
const config = require('../config');
const brand = require('./brand');

const fakeOrder = {
    key: {
        participant: '0@s.whatsapp.net',
    },
    message: {
        requestPaymentMessage:
        {
            currencyCodeIso4217: 'USD',
            amount1000: '1000000000',
            requestFrom: '999999999999@s.whatsapp.net',
            noteMessage: {
                extendedTextMessage: {
                    text: `*${brand.botName}*`,
                }
            },
            expiryTimestamp: '0',
            amount: { value: '1000000000', offset: 1000, currencyCode: 'USD' }
        }
    }
};

// Thumbnail diambil dari src/media/<config.webOrder.thumbnail>
// Harus gambar (png/jpg/webp) dan kecil — video/file besar akan dilewati.
function loadThumb(name) {
    if (!name) return undefined;
    if (!/\.(png|jpe?g|webp)$/i.test(name)) {
        console.warn(`[FQUOTED] webOrder.thumbnail "${name}" bukan gambar — thumbnail dilewati. Pakai png/jpg.`);
        return undefined;
    }
    try {
        const buf = fs.readFileSync(path.join(__dirname, '../media', name));
        if (buf.length > 200 * 1024) {
            console.warn(`[FQUOTED] Thumbnail "${name}" terlalu besar (${Math.round(buf.length / 1024)} KB) — dilewati.`);
            return undefined;
        }
        return buf;
    } catch {
        console.warn(`[FQUOTED] Thumbnail "${name}" tidak ditemukan di src/media/.`);
        return undefined;
    }
}

// Quoted "order" palsu — semua isinya diatur di config.js → webOrder
const web = config.webOrder || {};
const fakeWeb = {
    key: {
        participant: '0@s.whatsapp.net'
    },
    message: {
        orderMessage: {
            itemCount: web.itemCount ?? 99999999,
            surface: web.surface ?? 99999999,
            message: web.message || '',
            orderTitle: web.title || '',
            thumbnail: loadThumb(web.thumbnail),
            sellerJid: '0@s.whatsapp.net'
        }
    }
};

module.exports = { fakeOrder, fakeWeb };

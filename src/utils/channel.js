// Link saluran WhatsApp — disimpan di sini (bukan di config.js) dan tidak ditulis polos.
// Disusun dari potongan terbalik + base64, lalu dirakit saat dibutuhkan.
const _p = ["=kFM5U1T35EN", "rJUZwYjWTpUN", "5ImV5IDMw8Cb", "l5mbhh2Yv02b", "j5CcwF2c0FGa", "39yL6MHc0RHa"];

const decode = () => Buffer.from(_p.join('').split('').reverse().join(''), 'base64').toString('utf8');

const channel = {
    name: 'Saluran',
    get url() { return decode(); },
    // tombol "Saluran" (cta_url) untuk pesan interaktif
    button() {
        const url = decode();
        return {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({ display_text: 'Saluran', url, merchant_url: url })
        };
    },
};

module.exports = channel;

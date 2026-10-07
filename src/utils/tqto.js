// Teks TQTO — disimpan di sini (bukan di config.js) dan tidak ditulis polos.
// Disusun dari potongan terbalik + base64, lalu dirakit saat dibutuhkan.
const _p = [
    "==wrVKOgUKOgUKOgUKOgUKOgUKOgUKOgUKOgUKOgUKOgUKOg",
    "UKOgUKOgUKOgUKOgUKOgUKOsVKuCKIlZ3E0bElFWx5GStkUa",
    "KlVPpN3PsFWajlmZm9We6RXLyVGcsV2dA9SbvNmLlJWd0V3b",
    "59yL6MHc0RHaKwUQJNUSGZ0TgklWUBiUFBFTFdFI6O5nwrgC",
    "uEWeg0WdsVmYgcmbhlHI0FWdiBSZilmcjNnY1NHIhBXdsBib",
    "hdmbhpkCK8YmfCPIhV3ZgwWZu5WYoNGI0J3bwBXdzBibhRGI",
    "lJWayN2ciV3cKgWYkVHIn5WY5BSY11WZzBibhlGbhtGI0FWd",
    "iBCapNXYrFWTKoAdy9GcwV3cggWYkVHIn5WY5BSY11WZTBSn",
    "k+J8KUmdvxEI51EIPi77k2p4KU3agQVWgUmYpJ3YzJWdzBCa",
    "hRWdgcmbhlHIisWYuFEI2u6nwrgCuWp4ASp4ASp4ASp4NC44",
    "g8EVRRFIMC44ASp4ASp4ASp4tWp4"
];

const decode = () => Buffer.from(_p.join('').split('').reverse().join(''), 'base64').toString('utf8');

module.exports = { get text() { return decode(); } };

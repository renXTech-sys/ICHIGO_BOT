module.exports = {
    //Nama owner
    ownerName: 'renxtech',

    // Nama bot
    botName: 'ICHIGO MD',

    footerTxt: 'Geneterate by renxtech',

    // Prefix command (contoh: ! . /)\
    prefix: '.',

    // Super Owner — hanya 1 nomor, akses penuh termasuk manage co-owner
    superOwner: '6281928251916',

    // Co-Owner — bisa lebih dari satu, akses owner biasa
    coOwner: [
        '6283124265973',
        '6283169557427',
        '6283157686826',
        '6283136778501',
        '6285935020128',
    ],

    // Mode bot: 'public' → semua orang | 'self' → hanya owner
    botMode: 'private',

    // Otomatis centang biru pesan yang masuk
    autoRead: true,

    // Tampilkan indikator "mengetik..." saat membalas
    autoTyping: true,

    // Folder penyimpanan sesi login
    authFolder: './src/database/session',

    // Format: '120363xxxxxxxxx@newsletter'  — kosongkan jika tidak dipakai
    channelId: '',
    
};

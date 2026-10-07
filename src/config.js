module.exports = {
    //Nama owner
    ownerName: 'renxtech',

    // Nama bot
    botName: 'ICHIGO MD',

    footerTxt: 'Powered by renxtech',

    // Prefix command (contoh: ! . /)\
    prefix: '.',

    // Super Owner — hanya 1 nomor, akses penuh termasuk manage co-owner
    superOwner: '6281928251916',
    coOwner: [
        '6283124265973',
        '6283169557427',
        '6283157686826',
        '6283136778501',
        '6285935020128',
    ],

    // Mode bot: 'public' → semua orang | 'self' → hanya owner
    botMode: 'public',

    // Otomatis centang biru pesan yang masuk
    autoRead: true,

    // Tampilkan indikator "mengetik..." saat membalas
    autoTyping: true,

    // Folder penyimpanan sesi login
    authFolder: './src/database/session',

    // Format: '120363xxxxxxxxx@newsletter'  — kosongkan jika tidak dipakai
    channelId: '',

    // ─────────────── Pengaturan .menu ───────────────

    // Video header menu (diputar otomatis seperti GIF).
    // Isi nama file mp4 yang ditaruh di folder src/media/  → contoh: 'menu.mp4'
    // (link http/https juga boleh). Kosongkan ('') kalau mau menu tanpa video.
    menuVideo: 'menu.mp4',

    // Mode kirim menu:
    //  'interactive' → tombol + video header (kalau gagal otomatis pindah ke 'simple')
    //  'simple'      → video/gif + caption biasa, tanpa tombol (PASTI muncul)
    // Kalau .menu tidak keluar apa-apa, ganti ke 'simple'.
    menuMode: 'interactive',

    // Audio yang dikirim sebagai voice note (VN) setelah .menu keluar.
    // Link http/https atau nama file di src/media/. Isi '' untuk mematikan.
    menuAudio: '',

    // Website yang tampil di SYSTEM STATS dan jadi tombol URL
    website: 'renxtech.com',

    // Zona waktu untuk ucapan (good morning / afternoon / evening / night)
    timezone: 'Asia/Jakarta',

    // Belum ada sistem level & limit, jadi nilainya tetap dari sini
    defaultLevel: '1',
    defaultLimit: '∞',

    // Teks tombol di bawah menu
    menuButtonCategory: 'Pilih Kategori',
    menuButtonWebsite: 'Website',

    // ─────────────── Pengaturan .pay (info pembayaran) ───────────────
    // Kosongkan ('') bagian yang tidak dipakai — barisnya otomatis tidak ditampilkan.
    pay: {
        dana:  '083136778501',            // nomor DANA, contoh: '0838xxxxxxx'
        gopay: '083136778501',            // nomor GOPAY
        name:  'TestPlugin',            // atas nama (A/N)
        qris:  'https://u.pone.rs/hejmtsrv.jpg',            // foto QRIS: nama file di src/media/ (contoh: 'qris.jpg') atau link http(s)
        note:  'Kirim bukti transfer setelah pembayaran ya 🙏',   // catatan di bawah info pembayaran
    },

    // Pesan "order" palsu yang jadi quoted di atas menu (.menu / .allmenu)
    webOrder: {
        title: 'renxtech',                    // judul order
        message: 'https://renxtech.com',        // teks order (nama web)
        thumbnail: 'logo.png',                 // GAMBAR (png/jpg) di src/media/ — bukan video ('' = tanpa thumbnail)
        itemCount: 99999999,
        surface: 99999999,
    },
};

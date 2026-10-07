// Daftar kategori untuk tombol "Pilih Menu" (dipakai di .menu dan .ownermenu).
// id = nama command yang dijalankan saat dipilih (tanpa prefix).
const MENU_BUTTON_TITLE = 'Pilih Menu';

const MENU_CATEGORIES = [
    { title: 'All Menu', description: 'Tampilkan semua command', id: 'allmenu' },
    { title: 'Owner Menu', description: 'Khusus owner', id: 'ownermenu' },
    { title: 'Tools Menu', description: 'Tools & utilitas', id: 'toolsmenu' },
    { title: 'Downloader Menu', description: 'Download TikTok', id: 'downloadermenu' },
    { title: 'Sticker Menu', description: 'Buat stiker', id: 'stickermenu' },
    { title: 'Anime Menu', description: 'Info, random & quotes anime', id: 'animemenu' },
    { title: 'Panel Menu', description: 'Pterodactyl, subdomain & premium', id: 'panelmenu' },
    { title: 'Game Menu', description: 'Game inline (Super Mario, dll)', id: 'gamemenu' },
    { title: 'Grup Menu', description: 'Tag, jadwal, sider, autosholat, dll', id: 'grupmenu' },
    // tambah kategori baru di sini
];

function categoryButton() {
    return {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
            title: MENU_BUTTON_TITLE,
            sections: [{
                title: MENU_BUTTON_TITLE,
                highlight_label: '',
                rows: MENU_CATEGORIES.map(c => ({
                    title: c.title,
                    description: c.description || '',
                    id: c.id
                }))
            }]
        })
    };
}

module.exports = { MENU_BUTTON_TITLE, MENU_CATEGORIES, categoryButton };

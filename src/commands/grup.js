const config = require('../config');
const brand = require('../utils/brand');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');
const legacy = require('../utils/legacyBridge');

// Satu fitur = satu file di src/legacy/grup-*.mjs, dijalankan lewat legacyBridge.
// Daftar command di bawah WAJIB literal (PluginLoader membaca teks "case" + nama command).
const handler = async (m) => {
    const { command, msg, sender } = m;
    const p = config.prefix;

    const userJid = msg.key.participant || msg.key.remoteJid || sender;

    switch (command.name) {
        case 'grupmenu': {
            const text =
` ┌─ ✧ *GRUP MENU*
 │ ⊳ ${p}hidetag / ${p}h
 │ ⊳ @all / @semua <teks>
 │ ⊳ ${p}tagall
 │ ⊳ ${p}totag / ${p}tag
 │ ⊳ ${p}linkgc
 │ ⊳ ${p}unpin
 │ ⊳ ${p}upswgc
 │ ⊳ ${p}setintro
 │ ⊳ ${p}intro
 │ ⊳ ${p}delintro
 │ ⊳ ${p}sider
 │ ⊳ ${p}kicksider
 │ ⊳ ${p}resetsider
 │ ⊳ ${p}bukajam
 │ ⊳ ${p}tutupjam
 │ ⊳ ${p}jadwal
 │ ⊳ ${p}hapusbukajam
 │ ⊳ ${p}hapustutupjam
 │ ⊳ ${p}hapusjadwal
 │ ⊳ ${p}autosholat
 │ ⊳ ${p}setkota
 └───────────────`;

            await deliver(m, {
                text,
                footer: brand.footer,
                buttons: [categoryButton()],
                userJid,
                video: null
            });
            break;
        }

        case 'hidetag': return legacy.run('grup-hidetag.mjs', 'hidetag', m);
        case 'h': return legacy.run('grup-hidetag.mjs', 'h', m);
        case 'tagall': return legacy.run('grup-tagall.mjs', 'tagall', m);
        case 'totag': return legacy.run('grup-totag.mjs', 'totag', m);
        case 'tag': return legacy.run('grup-totag.mjs', 'tag', m);
        case 'linkgc': return legacy.run('grup-linkgc.mjs', 'linkgc', m);
        case 'unpin': return legacy.run('grup-unpin.mjs', 'unpin', m);
        case 'upswgc': return legacy.run('grup-upswgc.mjs', 'upswgc', m);
        case 'setintro': return legacy.run('grup-intro.mjs', 'setintro', m);
        case 'intro': return legacy.run('grup-intro.mjs', 'intro', m);
        case 'delintro': return legacy.run('grup-intro.mjs', 'delintro', m);
        case 'sider': return legacy.run('grup-sider.mjs', 'sider', m);
        case 'ceksider': return legacy.run('grup-sider.mjs', 'ceksider', m);
        case 'kicksider': return legacy.run('grup-sider.mjs', 'kicksider', m);
        case 'resetsider': return legacy.run('grup-sider.mjs', 'resetsider', m);
        case 'bukajam': return legacy.run('grup-jadwal.mjs', 'bukajam', m);
        case 'tutupjam': return legacy.run('grup-jadwal.mjs', 'tutupjam', m);
        case 'jadwal': return legacy.run('grup-jadwal.mjs', 'jadwal', m);
        case 'hapusbukajam': return legacy.run('grup-jadwal.mjs', 'hapusbukajam', m);
        case 'hapustutupjam': return legacy.run('grup-jadwal.mjs', 'hapustutupjam', m);
        case 'hapusjadwal': return legacy.run('grup-jadwal.mjs', 'hapusjadwal', m);
        case 'autosholat': return legacy.run('grup-autosholat.mjs', 'autosholat', m);
        case 'setkota': return legacy.run('grup-autosholat.mjs', 'setkota', m);
    }
};

module.exports = handler;

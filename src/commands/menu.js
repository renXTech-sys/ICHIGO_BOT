const os = require('os');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const brand = require('../utils/brand');
const plugins = require('../utils/PluginLoader');
const { formatUptime } = require('../utils/helper');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');
const { sendMenuAudio } = require('../utils/menuAudio');

// Ambil video menu: file lokal di src/media/ (Buffer) atau link http(s)
function getMenuVideo() {
    const src = config.menuVideo;
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return { url: src };

    const file = path.join(__dirname, '../media', src);
    if (!fs.existsSync(file)) {
        console.warn(`[MENU] Video tidak ditemukan: ${file} — menu dikirim tanpa video.`);
        return null;
    }
    return fs.readFileSync(file);
}

const handler = async (m) => {
    const { command, msg, sender, isSuperOwner, isOwner } = m;
    const p = config.prefix;

    // JID pengirim (di grup = participant, di private = remoteJid)
    const userJid = msg.key.participant || msg.key.remoteJid || sender;
    const tag = userJid.split('@')[0].split(':')[0];

    switch (command.name) {
        case 'menu': {
            const buttons = [categoryButton()];

            await deliver(m, {
                text: '',
                footer: brand.footer,
                buttons,
                userJid,
                video: getMenuVideo()
            });

            // Setelah menu keluar → kirim audio sebagai voice note
            await sendMenuAudio(m);
            break;
        }

        case 'allmenu': {
            const hidden = new Set(['menu', 'allmenu', 'ownermenu', 'toolsmenu', 'stickermenu', 'downloadermenu', 'animemenu', 'panelmenu', 'gamemenu', 'grupmenu']);
            // grup file yang tidak boleh tampil di allmenu (mis. sisa file lama)
            const hiddenFiles = new Set(['toolsx']);
            const groups = Object.entries(plugins.commandsByFile())
                .filter(([file]) => !hiddenFiles.has(file.toLowerCase()))
                .map(([file, cmds]) => [file, cmds.filter(c => !hidden.has(c))])
                .filter(([, cmds]) => cmds.length > 0);

            const list = groups.map(([file, cmds]) =>
                ` ┌─ ✧ *${file.toUpperCase()}*\n` +
                cmds.map(c => ` │ ⊳ ${p}${c}`).join('\n') +
                `\n └───────────────`
            ).join('\n\n');

            await deliver(m, {
                text: `*ALL MENU*\n\n${list || 'Belum ada command.'}`,
                footer: brand.footer,
                buttons: [],
                userJid,
                video: null
            });
            break;
        }
    }
};

module.exports = handler;

const config = require('../config');
const brand = require('../utils/brand');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');
const legacy = require('../utils/legacyBridge');
const { toStickerWebp } = require('../utils/stickerKit');

/**
 * Game commands
 *
 * .gamemenu                                           → daftar fitur kategori Game
 * .mario / .supermario / .smb / .mariobros / .retro   → Super Mario Retro Runner (inline)
 * .sonic / .speedy / .speeddash                       → Speedy Dash (inline)
 * .dino / .dinogame / .dinorunner                     → Dino Runner (inline)
 * .dadu                                               → lempar dadu (stiker)
 *
 * Tambah game baru:
 *  1) plugin inline taruh di src/legacy/game-<nama>.mjs
 *  2) tambah `case` di bawah → legacy.run('game-<nama>.mjs', '<nama>', m)
 *  3) tambah baris di teks gamemenu
 */

// ======================= [ Dadu ] =======================
const DOTS = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

// Gambar muka dadu (PNG) digambar lokal pakai sharp — tidak butuh internet.
async function diceFace(n) {
    const sharp = require('sharp');
    const dots = DOTS[n].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="8.5" fill="#1b1b1b"/>`).join('');
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 100 100">` +
        `<rect x="4" y="4" width="92" height="92" rx="18" fill="#f7f7f7" stroke="#cfcfcf" stroke-width="2"/>` +
        dots + `</svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
}

const handler = async (m) => {
    const { command, msg, sender, Hanz } = m;
    const p = config.prefix;

    const userJid = msg.key.participant || msg.key.remoteJid || sender;

    switch (command.name) {
        case 'gamemenu': {
            const text =
` ┌─ ✧ *GAME MENU*
 │ ⊳ ${p}mario
 │ ⊳ ${p}sonic
 │ ⊳ ${p}dino
 │ ⊳ ${p}dadu
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

        // ---------- Super Mario Retro Runner ----------
        case 'mario':
        case 'supermario':
        case 'smb':
        case 'mariobros':
        case 'retro':
            return legacy.run('game-mario.mjs', command.name, m);

        // ---------- Speedy Dash (Sonic) ----------
        case 'sonic':
        case 'speedy':
        case 'speeddash':
            return legacy.run('game-sonic.mjs', command.name, m);

        // ---------- Dino Runner ----------
        case 'dino':
        case 'dinogame':
        case 'dinorunner':
            return legacy.run('game-dino.mjs', command.name, m);

        // ---------- Dadu ----------
        case 'dadu': {
            try {
                const n = Math.floor(Math.random() * 6) + 1;
                const sticker = await toStickerWebp(await diceFace(n));
                await Hanz.sendMessage(sender, { sticker }, { quoted: msg });
            } catch (e) {
                console.error('[DADU]', e?.message || e);
                await m.reply({ text: '❌ Gagal melempar dadu: ' + (e?.message || e) });
            }
            break;
        }
    }
};

module.exports = handler;

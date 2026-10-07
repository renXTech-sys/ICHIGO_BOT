const brand = require('../utils/brand');
const channel = require('../utils/channel');
const tqto = require('../utils/tqto');
const { deliver } = require('../utils/sendMenu');

const handler = async (m) => {
    const { command, msg, sender } = m;

    // JID pengirim (di grup = participant, di private = remoteJid)
    const userJid = msg.key.participant || msg.key.remoteJid || sender;

    switch (command.name) {
        case 'tqto': {
            // Quoted "order" palsu (fakeWeb) + tombol Saluran di bawah teks, tanpa header BOT INFO / foto menu
            await deliver(m, {
                text: tqto.text,
                footer: brand.footer,
                buttons: [channel.button()],
                userJid,
                video: null,
                image: null,
                header: false
            });
            break;
        }
    }
};

module.exports = handler;

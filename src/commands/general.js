const { formatUptime } = require('../utils/helper');

const handler = async (m) => {
    const { command, Hanz, sender } = m;

    switch (command.name) {
        case 'ping': {
            const start = Date.now();
            const sent = await m.reply({ text: '⚡ Flash!' });
            await Hanz.sendMessage(sender, {
                text: `⚡ *Flash!*\n\nSpeed: *${Date.now() - start}ms*\nUptime: \`${formatUptime(process.uptime())}\``,
                edit: sent.key
            });
            break;
        }
    }
};

module.exports = handler;

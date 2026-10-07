const chalk = require('chalk');
const { delay } = require('@hanzofc/baileys');
const AUTO_JOIN = require('../database/welper.js');

function extractInviteCode(input) {
    if (!input) return null;
    const str = String(input).trim();
    const m = str.match(/chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z_-]+)/i);
    if (m) return m[1];
    const code = str.replace(/[^0-9A-Za-z_-]/g, '');
    return code || null;
}

async function autoJoinAll(Hanz, config = {}, brand = {}) {
    const botName = brand.botName || 'Bot';
    const channels = new Set();
    if (config.channelId) channels.add(config.channelId);
    for (const c of AUTO_JOIN.channels || []) if (c) channels.add(c);

    for (const ch of channels) {
        try {
            await Hanz.newsletterFollow(ch);
            console.log(chalk.green(`[AUTO-JOIN] ✓ Channel: ${ch}`));
            if (AUTO_JOIN.successMessage?.enabled && AUTO_JOIN.successMessage?.channel) {
                try {
                    await Hanz.sendMessage(ch, {
                        text: AUTO_JOIN.successMessage.channel(botName),
                    });
                } catch (_) { }
            }
        } catch (e) {
            console.log(chalk.yellow(`[AUTO-JOIN] ! Channel gagal ${ch}: ${e.message}`));
        }
        await delay(AUTO_JOIN.delayMs || 1000);
    }

    for (const link of AUTO_JOIN.groups || []) {
        try {
            const code = extractInviteCode(link);
            if (!code) {
                console.log(chalk.yellow(`[AUTO-JOIN] ! Link grup tidak valid: ${link}`));
                continue;
            }
            const groupJid = await Hanz.groupAcceptInvite(code);
            console.log(chalk.green(`[AUTO-JOIN] ✓ Grup: ${link}`));

            if (groupJid && AUTO_JOIN.successMessage?.enabled && AUTO_JOIN.successMessage?.group) {
                await delay(3000);
                try {
                    await Hanz.sendMessage(groupJid, {
                        text: AUTO_JOIN.successMessage.group(botName),
                    });
                } catch (err) {
                    console.log(chalk.yellow(`[AUTO-JOIN] ! Gagal kirim pesan sukses: ${err.message}`));
                }
            }
        } catch (e) {
            console.log(chalk.yellow(`[AUTO-JOIN] ! Grup gagal ${link}: ${e.message}`));
        }
        await delay(AUTO_JOIN.delayMs || 1000);
    }
}

module.exports = { autoJoinAll, extractInviteCode };
// Blok "USER INFO" + "SYSTEM STATS" — otomatis ditaruh di paling atas SEMUA menu (dipanggil dari deliver()).
const os = require('os');
const config = require('../config');
const brand = require('./brand');
const premium = require('./premium');

function getGreeting() {
    let hour;
    try {
        hour = parseInt(new Intl.DateTimeFormat('en-GB', {
            hour: 'numeric', hour12: false, timeZone: config.timezone || 'Asia/Jakarta'
        }).format(new Date()), 10) % 24;
    } catch {
        hour = new Date().getHours();
    }
    if (hour >= 5 && hour < 12) return 'good morning';
    if (hour >= 12 && hour < 18) return 'good afternoon';
    if (hour >= 18 && hour < 22) return 'good evening';
    return 'good night';
}

// uptime singkat: 1d 2h 3m 4s
function shortUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return [d && `${d}d`, (d || h) && `${h}h`, (d || h || m) && `${m}m`, `${s}s`].filter(Boolean).join(' ');
}

const fmtMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(0)} MB`;
const fmtGB = (bytes) => `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;

function buildHeader(m, userJid) {
    const tag = String(userJid).split('@')[0].split(':')[0];
    const role = m.isSuperOwner ? 'Super Owner' : (m.isOwner ? 'Co-Owner' : 'User');

    // status: Owner / Premium / Free
    const isPrem = m.isOwner || premium.isPremium([m.senderNumber, tag]);
    const status = m.isOwner ? 'Owner' : (isPrem ? 'Premium' : 'Free');

    const limit = m.isOwner || isPrem ? '∞' : (config.defaultLimit ?? '-');
    const website = config.website || require('./channel').url;
    const mode = String(global.botMode || config.botMode || 'public').toUpperCase();

    return `Ola👋 @${tag}, ${getGreeting()}.

 ┌─ ✧ *USER INFO*
 │ ⊳ ʀᴏʟᴇ  : ${role}
 │ ⊳ status : ${status}
 │ ⊳ name bot : ${brand.botName} (${mode})
 │ ⊳ ʟᴇᴠᴇʟ : ${config.defaultLevel ?? '-'}
 │ ⊳ ʟɪᴍɪᴛ : ${limit}
 └───────────────

 ┌─ ✧ *SYSTEM STATS*
 │ ⊳ ᴜᴘᴛɪᴍᴇ : ${shortUptime(process.uptime())}
 │ ⊳ ʀᴀᴍ    : ${fmtMB(process.memoryUsage().rss)}
 │ ⊳ ᴛᴏᴛᴀʟ  : ${fmtGB(os.totalmem())}
 │ ⊳ Website: ${website}
 └───────────────`;
}

module.exports = { buildHeader };

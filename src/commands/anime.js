const config = require('../config');
const brand = require('../utils/brand');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');

// cheerio di-require saat dipakai saja (npm i cheerio), supaya bot tetap jalan kalau belum ter-install.
const lazy = (name) => require(name);
const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ======================= [ Story Anime (video random) ] =======================
const STORY_VIDEOS = [
    'https://telegra.ph/file/0d4fb93951c620aacb229.mp4',
    'https://g.top4top.io/m_2391c90iu1.mp4',
    'https://h.top4top.io/m_2391mfvy22.mp4',
    'https://i.top4top.io/m_2391iwmee3.mp4',
    'https://j.top4top.io/m_23915x5204.mp4',
    'https://l.top4top.io/m_2391e795x5.mp4',
    'https://a.top4top.io/m_2391jcee66.mp4',
    'https://b.top4top.io/m_2391ho0bz7.mp4',
    'https://c.top4top.io/m_23910hulw8.mp4',
    'https://d.top4top.io/m_2391dj01a9.mp4',
    'https://e.top4top.io/m_23912fdr210.mp4',
    'https://a.top4top.io/m_23911dhqx1.mp4',
    'https://b.top4top.io/m_2391wwr402.mp4',
    'https://c.top4top.io/m_2391vfkp63.mp4',
    'https://d.top4top.io/m_2391b7cey4.mp4',
    'https://e.top4top.io/m_2391fxdc85.mp4',
    'https://telegra.ph/file/c3deeb5b0b7f7738a95ad.mp4',
    'https://telegra.ph/file/7ca9eef850f5edc53f7f2.mp4',
    'https://telegra.ph/file/44f73812ae0c19f097264.mp4',
    'https://telegra.ph/file/10399f910bb90de8a6c53.mp4',
    'https://telegra.ph/file/f7b440b02e742d1d4bed6.mp4',
    'https://telegra.ph/file/3571f86c9c8843f48ce03.mp4',
    'https://telegra.ph/file/c0b4e700e2d696f6ae448.mp4',
    'https://telegra.ph/file/fbfa5ac6baca454de22ad.mp4',
    'https://telegra.ph/file/899cb30e29de1f0692ea1.mp4',
    'https://telegra.ph/file/30e226e2d30e51bda678f.mp4',
    'https://telegra.ph/file/4b20016e2f4ff96280fea.mp4',
    'https://telegra.ph/file/d48fde63f91f9aa585716.mp4',
    'https://telegra.ph/file/3a1f2afb1172b4606cd50.mp4',
    'https://telegra.ph/file/fe7de67cadcddf80e4f23.mp4',
    'https://telegra.ph/file/f4eabe96d994b28b7020d.mp4',
    'https://telegra.ph/file/f8adc8f3af8ce6f80254b.mp4',
    'https://telegra.ph/file/909a4beb3be92dae9e8ef.mp4',
    'https://telegra.ph/file/57dff983fe52d49cf9e11.mp4',
    'https://telegra.ph/file/70ed984ecf1382e0e74ce.mp4',
    'https://telegra.ph/file/a922d3d0214e7b95dfb89.mp4',
    'https://telegra.ph/file/ff7a0e8598bfd47898932.mp4',
    'https://telegra.ph/file/c992c64d4bb59df46f06e.mp4',
    'https://telegra.ph/file/137346459c02371cf5de9.mp4',
    'https://telegra.ph/file/2ae60a3fc1509f779cba0.mp4',
    'https://telegra.ph/file/223ac432cbca27313c59c.mp4',
    'https://telegra.ph/file/6411bbcedc5da320b8656.mp4',
    'https://telegra.ph/file/33a005837185d86435a26.mp4',
    'https://telegra.ph/file/3b5cf36d1fc154ee36345.mp4',
    'https://telegra.ph/file/c5606fb628f4c8268f1bb.mp4',
    'https://telegra.ph/file/a91ba184bd2faedf2ca93.mp4',
    'https://telegra.ph/file/aebad466be77f72498981.mp4',
    'https://telegra.ph/file/a38ff1a80c53fb374af90.mp4',
    'https://telegra.ph/file/607217019e1e5952920c1.mp4',
    'https://telegra.ph/file/8a98532caa714b28acce1.mp4',
    'https://telegra.ph/file/9eb4be5e79b7e71bfecc5.mp4',
    'https://telegra.ph/file/10bbd3972f7b75a8b2ef6.mp4',
    'https://telegra.ph/file/3fae1c6aacaba812ea651.mp4',
    'https://telegra.ph/file/68378ab14e55b8a4113c2.mp4',
    'https://telegra.ph/file/9cb140f6f74012cce30c7.mp4',
    'https://telegra.ph/file/17a3d58921c2754cf86ef.mp4',
    'https://telegra.ph/file/3ac2c8447b8915a879e7a.mp4',
    'https://telegra.ph/file/269cd09dcf42f8bd3a6f9.mp4',
    'https://telegra.ph/file/d2e59e56cfdaac79ca7f8.mp4',
    'https://telegra.ph/file/504ac80844f99a8e3fc54.mp4',
    'https://telegra.ph/file/dd2b8fba0010f539085d1.mp4',
    'https://telegra.ph/file/af9726aad0dce10dc4529.mp4',
    'https://telegra.ph/file/c693724dba3bb96bb6c70.mp4',
    'https://telegra.ph/file/5b91438135d01c11e7c92.mp4',
    'https://telegra.ph/file/d2a468ff7cd4c29dcdb4a.mp4',
    'https://telegra.ph/file/9cc245954979317b3484c.mp4',
    'https://telegra.ph/file/cde12f0fd2c73ab8eb933.mp4',
    'https://telegra.ph/file/ab58119a87c7f2c2367dc.mp4',
    'https://telegra.ph/file/9146e2d5490c1b01c6e87.mp4',
    'https://telegra.ph/file/09c9e72d3e0d44175c304.mp4',
    'https://telegra.ph/file/2f01ddd037c40477ed07f.mp4',
    'https://telegra.ph/file/be72f95d92490f0a1db3b.mp4',
    'https://telegra.ph/file/d1464f070543fb3aaeaee.mp4',
    'https://telegra.ph/file/99f02aa82825f1bf61e9a.mp4',
    'https://telegra.ph/file/d540762b1d4f9e767357d.mp4',
    'https://telegra.ph/file/98d09d227e8552d4e2bea.mp4',
    'https://telegra.ph/file/4a9dc4ba09484791dfa9a.mp4',
    'https://telegra.ph/file/91d8701c2783775637125.mp4',
];

// ======================= [ Ongoing (LiveChart) ] =======================
const TZ = 'Asia/Jakarta';

// Musim anime otomatis mengikuti tanggal sekarang (winter/spring/summer/fall)
function currentSeason() {
    const now = new Date();
    const month = Number(new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: TZ }).format(now));
    const year = Number(new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: TZ }).format(now));
    const season = month <= 3 ? 'winter' : month <= 6 ? 'spring' : month <= 9 ? 'summer' : 'fall';
    return { season, year };
}

function formatJadwal(ts) {
    const d = new Date(ts * 1000);
    const date = new Intl.DateTimeFormat('id-ID', {
        timeZone: TZ, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }).format(d);
    const time = new Intl.DateTimeFormat('id-ID', {
        timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false
    }).format(d).replace('.', ':');
    const hari = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, weekday: 'long' }).format(d).toLowerCase();
    return { text: `${date} ${time} WIB`, hari };
}

function formatCountdown(ts) {
    let diff = Math.floor(ts - Date.now() / 1000);
    if (diff <= 0) return 'Sudah tayang';
    const d = Math.floor(diff / 86400); diff %= 86400;
    const h = Math.floor(diff / 3600); diff %= 3600;
    const mnt = Math.floor(diff / 60);
    const s = diff % 60;
    return `${d}d ${h}h ${mnt}m ${s}s`;
}

async function getOngoing() {
    const cheerio = lazy('cheerio');
    const { season, year } = currentSeason();
    const { data } = await axios.get(`https://www.livechart.me/${season}-${year}/tv`, {
        headers: { 'User-Agent': UA }, timeout: 20000
    });
    const $ = cheerio.load(data);
    const result = [];

    $('#content > main > article').each((i, e) => {
        const judul = $(e).find('div > h3 > a').text().trim();
        if (!judul) return;

        const eps = $(e).find('div > div.poster-container > a > div').text().trim();
        const ts = Number($(e).find("time[data-anime-card-target='countdown']").attr('data-timestamp'));
        const studio = $(e).find('div > div.anime-info > ul > li > a').text().trim();
        const sumber = $(e).find('div > div.anime-info > div.anime-metadata > div.anime-source').text().trim();
        const tags = [];
        $(e).find('div > ol > li').each((_, b) => { tags.push($(b).find('a').text().trim()); });

        const jadwal = ts ? formatJadwal(ts) : null;
        result.push({
            judul,
            tags: tags.filter(Boolean),
            studio: studio || '-',
            adaptasi: sumber ? 'Diadaptasi dari ' + sumber : '-',
            eps: eps || '-',
            jadwal: jadwal ? jadwal.text : '-',
            hari: jadwal ? jadwal.hari : '',
            countdown: ts ? formatCountdown(ts) : '-',
        });
    });

    return { list: result, season, year };
}

// ======================= [ Otakudesu ] =======================
const OTAKUDESU = 'https://otakudesu.cloud';

async function otakuLatest() {
    const cheerio = lazy('cheerio');
    const { data } = await axios.get(`${OTAKUDESU}/ongoing-anime/`, { headers: { 'User-Agent': UA }, timeout: 20000 });
    const $ = cheerio.load(data);
    const list = [];
    $('.venz ul li').each((i, el) => {
        list.push({
            title: $(el).find('h2.jdlflm').text().trim(),
            episode: $(el).find('.epz').text().replace('Episode ', '').trim(),
            releaseDay: $(el).find('.epztipe').text().trim(),
            releaseDate: $(el).find('.newnime').text().trim(),
            link: $(el).find('.thumb a').attr('href'),
        });
    });
    return list;
}

async function otakuDetail(url) {
    const cheerio = lazy('cheerio');
    const { data } = await axios.get(url, { headers: { 'User-Agent': UA }, timeout: 20000 });
    const $ = cheerio.load(data);
    const field = (label) => $(`p:contains("${label}")`).first().text().replace(new RegExp(`^${label}\\s*:\\s*`), '').trim();

    return {
        title: $('title').text().split('|')[0].trim(),
        titleJapanese: field('Japanese'),
        image: $('meta[property="og:image"]').attr('content'),
        score: field('Skor'),
        studio: field('Studio'),
        releaseDate: field('Tanggal Rilis'),
        totalEpisodes: field('Total Episode'),
        genres: $('p:contains("Genre") a').map((i, el) => $(el).text().trim()).get().join(', '),
        synopsis: $('.sinopc p').map((i, el) => $(el).text().trim()).get().join(' '),
        url,
    };
}

async function otakuSearch(query) {
    const cheerio = lazy('cheerio');
    const { data } = await axios.get(`${OTAKUDESU}/?s=${encodeURIComponent(query)}&post_type=anime`, {
        headers: { 'User-Agent': UA }, timeout: 20000
    });
    const $ = cheerio.load(data);
    const results = [];
    $('.chivsrc > li').each((i, el) => {
        const title = $(el).find('h2 a').text().trim();
        const url = $(el).find('h2 a').attr('href');
        if (!title || !url) return;
        results.push({
            title, url,
            status: $(el).find('.set').eq(1).text().replace(/^Status\s*:\s*/, '').trim(),
            rating: $(el).find('.set').eq(2).text().replace(/^Rating\s*:\s*/, '').trim(),
        });
    });
    return results;
}

// ======================= [ Anime Quotes (otakotaku) ] =======================
async function animeQuote() {
    const cheerio = lazy('cheerio');
    const page = Math.floor(Math.random() * 184);
    const { data } = await axios.get('https://otakotaku.com/quote/feed/' + page, { headers: { 'User-Agent': UA }, timeout: 20000 });
    const $ = cheerio.load(data);
    const links = $('div.kotodama-list').map((i, el) => $(el).find('a.kuroi').attr('href')).get().filter(Boolean);
    if (!links.length) throw new Error('quote kosong');

    // cukup ambil satu quote acak (tidak perlu buka semua link)
    const { data: quote } = await axios.get(pick(links), { headers: { 'User-Agent': UA }, timeout: 20000 });
    const $q = cheerio.load(quote);
    return {
        char: $q('.char-info .tebal a[href*="/character/"]').text().trim(),
        from_anime: $q('.char-info a[href*="/anime/"]').text().trim(),
        episode: $q('.char-info span.meta').text().trim().replace('- ', ''),
        quote: $q('.post-content blockquote p').text().trim(),
    };
}

// ======================= [ Command ] =======================
const handler = async (m) => {
    const { command, msg, sender, Hanz } = m;
    const p = config.prefix;

    const userJid = msg.key.participant || msg.key.remoteJid || sender;
    const tag = userJid.split('@')[0].split(':')[0];

    switch (command.name) {
        case 'animemenu': {
            const text =
` ┌─ ✧ *ANIME MENU*
 │ ⊳ ${p}animeinfo
 │ ⊳ ${p}animerandom
 │ ⊳ ${p}animequotes
 │ ⊳ ${p}bluearchive
 │ ⊳ ${p}storyanime
 │ ⊳ ${p}ongoing
 │ ⊳ ${p}otakudesu latest
 │ ⊳ ${p}otakudesu search
 │ ⊳ ${p}otakudesu detail
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

        // ---------- Blue Archive ----------
        case 'bluearchive':
        case 'baimg':
        case 'blue-archive': {
            try {
                await m.react('✨');
                const res = await fetch('https://raw.githubusercontent.com/rynxzyy/blue-archive-r-img/refs/heads/main/links.json');
                if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
                const data = await res.json();
                if (!Array.isArray(data) || !data.length) return m.reply({ text: '❌ Gambar tidak ditemukan.' });

                await Hanz.sendMessage(sender, {
                    image: { url: pick(data) },
                    caption: '✨ _Random Blue Archive_'
                }, { quoted: msg });
            } catch (e) {
                console.error('[BLUEARCHIVE]', e);
                await m.reply({ text: '❌ Terjadi kesalahan: ' + (e.message || e) });
            }
            break;
        }

        // ---------- Anime Info (Jikan / MyAnimeList) ----------
        case 'animeinfo': {
            const query = command.fullArgs;
            if (!query) return m.reply({ text: `*Masukkan judul anime yang ingin kamu cari!*\n\nContoh: ${p}animeinfo one piece` });

            try {
                await m.react('🔎');
                const res = await fetch('https://api.jikan.moe/v4/anime?limit=1&q=' + encodeURIComponent(query));
                if (!res.ok) return m.reply({ text: '❌ Tidak ditemukan.' });

                const json = await res.json();
                const a = json.data?.[0];
                if (!a) return m.reply({ text: '❌ Anime tidak ditemukan.' });

                const genreList = (a.genres || []).map((g) => g.name).join(', ') || '-';
                const caption =
`*ANIME INFO*

Title: ${a.title_japanese || a.title || '-'}
Type: ${a.type || '-'}
Genres: ${genreList}
Score: ${a.score ?? '-'}
Members: ${a.members ?? '-'}
Status: ${a.status || '-'}
Favorites: ${a.favorites ?? '-'}
URL: ${a.url}
Synopsis: ${a.synopsis || '-'}`;

                const img = a.images?.jpg?.image_url;
                if (img) {
                    await Hanz.sendMessage(sender, { image: { url: img }, caption }, { quoted: msg });
                } else {
                    await m.reply({ text: caption });
                }
            } catch (e) {
                console.error('[ANIMEINFO]', e);
                await m.reply({ text: '❌ Gagal mengambil info anime, coba lagi nanti.' });
            }
            break;
        }

        // ---------- Anime Random ----------
        case 'animerandom': {
            try {
                await m.react('🎌');
                const res = await fetch('https://lance-frank-asta.onrender.com/api/anime-random', { signal: AbortSignal.timeout(30000) });
                const data = await res.json();
                if (!data.status) throw new Error('status false');

                const info = data.random;
                const caption =
`🎌 *Anime Random*

🆔 ID: ${info.ID}
👤 Nama: ${info.name}
🎬 Movie: ${info.movie}`;

                await Hanz.sendMessage(sender, { image: { url: info.imgAnime }, caption }, { quoted: msg });
            } catch (e) {
                console.error('[ANIMERANDOM]', e);
                await m.reply({ text: '❌ Error mengambil data Anime!' });
            }
            break;
        }

        // ---------- Anime Quotes ----------
        case 'animequotes': {
            try {
                const res = await animeQuote();
                const text =
`╔═══ ❖ • ✦ • ❖ ═══╗
      🌸 *ANIME QUOTES* 🌸
╚═══ ❖ • ✦ • ❖ ═══╝

👤 *Karakter* : ${res.char || '-'}
🎬 *Anime* : ${res.from_anime || '-'}
📺 *Episode* : ${res.episode || '-'}

💭 ❝ ${res.quote || '-'} ❞`;
                await m.reply({ text });
            } catch (e) {
                console.error('[ANIMEQUOTES]', e.message);
                await m.reply({ text: '⚠️ Gagal mengambil quote anime, coba lagi ya~' });
            }
            break;
        }

        // ---------- Story Anime ----------
        case 'storyanime':
        case 'storianime':
        case 'animestory':
        case 'animestori': {
            try {
                await Hanz.sendMessage(sender, {
                    video: { url: pick(STORY_VIDEOS) },
                    caption: '_Random Story Anime_'
                }, { quoted: msg });
            } catch (e) {
                console.error('[STORYANIME]', e.message);
                await m.reply({ text: '❌ Gagal mengirim video, coba lagi.' });
            }
            break;
        }

        // ---------- Ongoing (LiveChart) ----------
        case 'ongoing': {
            try {
                await m.react('📺');
                const hariFilter = (command.args[0] || '').toLowerCase();
                const { list, season, year } = await getOngoing();

                const filtered = hariFilter ? list.filter((a) => a.hari === hariFilter) : list;
                if (!filtered.length) {
                    return m.reply({ text: hariFilter
                        ? `❌ Tidak ada anime tayang hari *${hariFilter}*.\nContoh: ${p}ongoing senin`
                        : '❌ Data ongoing kosong.' });
                }

                const rows = filtered.map((a, i) =>
`*${i + 1}. ${a.judul.toUpperCase()}*
_• Genre: ${a.tags.join(' ') || '-'}_
_• Studio: ${a.studio}_
_• Adaptasi: ${a.adaptasi}_
_• Next Eps: ${a.eps}_
_• Jadwal: ${a.jadwal}_
_• Countdown: ${a.countdown}_`);

                // pecah per 15 anime supaya pesan tidak kepanjangan
                const title = `*ONGOING ANIME — ${season.toUpperCase()} ${year}*${hariFilter ? ` (${hariFilter})` : ''}\n\n`;
                for (let i = 0; i < rows.length; i += 15) {
                    const chunk = rows.slice(i, i + 15).join('\n\n');
                    await m.reply({ text: (i === 0 ? title : '') + chunk });
                }
            } catch (e) {
                console.error('[ONGOING]', e.message);
                await m.reply({ text: '❌ Gagal mengambil data ongoing anime.' });
            }
            break;
        }

        // ---------- Otakudesu ----------
        case 'otakudesu': {
            const sub = (command.args[0] || '').toLowerCase();
            const rest = command.args.slice(1).join(' ');

            if (!sub) {
                return m.reply({ text:
`Gunakan format:
- *${p}otakudesu latest* : Anime terbaru
- *${p}otakudesu search <judul>* : Cari anime
- *${p}otakudesu detail <url>* : Detail anime` });
            }

            try {
                if (sub === 'latest') {
                    const data = await otakuLatest();
                    if (!data.length) return m.reply({ text: '❌ Data kosong.' });
                    let message = '*Anime Terbaru*\n\n';
                    data.slice(0, 10).forEach((a, i) => {
                        message += `${i + 1}. ${a.title}\nEpisode : ${a.episode}\nRilis : ${a.releaseDate}\nLink : ${a.link}\n\n`;
                    });
                    return m.reply({ text: message.trim() });
                }

                if (sub === 'search') {
                    if (!rest) return m.reply({ text: 'Masukkan judul anime yang ingin dicari.' });
                    const data = await otakuSearch(rest);
                    if (!data.length) return m.reply({ text: `❌ Tidak ada hasil untuk "${rest}".` });
                    let message = '*Hasil Pencarian*\n\n';
                    data.slice(0, 10).forEach((a, i) => {
                        message += `${i + 1}. ${a.title}\nStatus : ${a.status}\nRating : ${a.rating}\nLink : ${a.url}\n\n`;
                    });
                    return m.reply({ text: message.trim() });
                }

                if (sub === 'detail') {
                    if (!rest) return m.reply({ text: 'Masukkan URL anime dari Otakudesu.' });
                    const d = await otakuDetail(rest);
                    const caption =
`*Judul :* ${d.title}

*Japanese :* ${d.titleJapanese || '-'}

*Skor :* ${d.score || '-'}

*Studio :* ${d.studio || '-'}
*Release Date :* ${d.releaseDate || '-'}

*Total Episode :* ${d.totalEpisodes || '-'}

*Genre :* ${d.genres || '-'}

*Sinopsis :* ${d.synopsis.slice(0, 500)}...

*Link :* ${d.url}`;
                    if (d.image) {
                        return Hanz.sendMessage(sender, { image: { url: d.image }, caption }, { quoted: msg });
                    }
                    return m.reply({ text: caption });
                }

                return m.reply({ text: 'Gunakan format yang benar.' });
            } catch (e) {
                console.error('[OTAKUDESU]', e.message);
                await m.reply({ text: '❌ Gagal mengambil data, coba lagi nanti.' });
            }
            break;
        }
    }
};

module.exports = handler;

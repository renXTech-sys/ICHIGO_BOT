// Mesin otomatis fitur grup (jalan di latar belakang sejak bot terhubung):
//  1. Jadwal buka/tutup grup (.bukajam / .tutupjam)
//  2. Autosholat: tutup grup saat adzan + mode Jumat (.autosholat)
// Dipanggil dari index.js lewat start(Hanz).
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'

const require = createRequire(import.meta.url)
const store = require('../utils/groupStore.js')
const brand = require('../utils/brand.js')
const config = require('../config.js')

/* ================= CONFIG ================= */
const TZ = config.timezone || 'Asia/Jakarta'
const DURASI_TUTUP = 5          // menit grup ditutup saat adzan
const TOLERANSI = 60            // detik toleransi pencocokan waktu adzan
const SOURCE_URL = 'https://kemenag.go.id/'
const THUMBNAIL = 'https://raw.githubusercontent.com/hamm-r/uploader/main/1780397442761-426.jpg'
const AUDIO_ADZAN = {
  Subuh: ['https://raw.githubusercontent.com/hamm-r/uploader/main/1778882820327-470.mp3'],
  Default: ['https://raw.githubusercontent.com/hamm-r/uploader/main/1778882918734-987.mp3']
}

// ID kota myquran.com
export const CITIES = {
  jakarta: '1301',
  bandung: '1219',
  surabaya: '1631',
  yogyakarta: '1505',
  bekasi: '1204'
}

let conn = null
let started = false
const cacheJadwal = {}
const audioCache = {}
const scheduleLock = new Set()
let sholatLock = {}
let thumbnailBuffer = null
let thumbnailHQ = null
let lastReset = ''

/* ================= TIME ================= */
// Date yang getter lokalnya (getHours, dll) menunjukkan jam di zona waktu TZ
const getNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ }))
const pad = n => String(n).padStart(2, '0')
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const dateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const isJumat = now => now.getDay() === 5
const isBetweenJumat = now => now.getHours() >= 11 && now.getHours() < 13

/* ================= FETCH ================= */
async function fetchBuffer(url, timeout = 20000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' }
    })
    if (!res.ok) throw new Error(`Fetch gagal ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  } finally {
    clearTimeout(timer)
  }
}

/* ================= THUMBNAIL ================= */
async function getThumbnail() {
  try {
    if (thumbnailBuffer?.length) return thumbnailBuffer
    const sharp = require('sharp')
    const raw = await fetchBuffer(THUMBNAIL)
    thumbnailBuffer = await sharp(raw)
      .resize(1280, 720, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 90 })
      .toBuffer()
    return thumbnailBuffer
  } catch (e) {
    console.log('[AUTOSHOLAT] thumbnail error:', e.message || e)
    return Buffer.alloc(0)
  }
}

async function getHighQualityThumbnail() {
  try {
    if (thumbnailHQ) return thumbnailHQ
    const thumb = await getThumbnail()
    if (!thumb?.length) return null

    const { prepareWAMessageMedia } = require('@hanzofc/baileys')
    const { imageMessage } = await prepareWAMessageMedia(
      { image: thumb },
      { upload: conn.waUploadToServer, mediaTypeOverride: 'thumbnail-link' }
    )
    imageMessage.width = 1280
    imageMessage.height = 720
    thumbnailHQ = imageMessage
    return imageMessage
  } catch (e) {
    console.log('[AUTOSHOLAT] HQ thumbnail error:', e.message || e)
    return null
  }
}

/* ================= AUDIO ================= */
function convertBufferToOpus(input) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let stderr = ''
    let settled = false

    const ffmpeg = spawn('ffmpeg', [
      '-hide_banner', '-loglevel', 'error',
      '-i', 'pipe:0', '-vn',
      '-ac', '1', '-ar', '48000',
      '-c:a', 'libopus', '-b:a', '64k',
      '-vbr', 'on', '-compression_level', '10',
      '-f', 'ogg', 'pipe:1'
    ], { stdio: ['pipe', 'pipe', 'pipe'] })

    const done = (err, data) => {
      if (settled) return
      settled = true
      err ? reject(err) : resolve(data)
    }

    ffmpeg.stdout.on('data', c => chunks.push(c))
    ffmpeg.stderr.on('data', c => { stderr += c.toString() })
    ffmpeg.stdin.on('error', err => { if (err.code !== 'EPIPE') done(err) })
    ffmpeg.on('error', err => done(err))
    ffmpeg.on('close', code => {
      const out = Buffer.concat(chunks)
      if (code !== 0 || !out.length) return done(new Error(stderr || 'FFmpeg gagal convert opus'))
      done(null, out)
    })

    try { ffmpeg.stdin.end(input) } catch (e) { if (e.code !== 'EPIPE') done(e) }
  })
}

async function getAudioAdzan(nama) {
  const urls = nama === 'Subuh' ? AUDIO_ADZAN.Subuh : AUDIO_ADZAN.Default

  for (const url of urls) {
    try {
      if (audioCache[url]) return audioCache[url]

      const raw = await fetchBuffer(url)
      if (!raw || raw.length < 1000) continue

      try {
        const opus = await convertBufferToOpus(raw)
        if (opus && opus.length > 1000) {
          return (audioCache[url] = { buffer: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true })
        }
      } catch (e) {
        console.log('[AUTOSHOLAT] convert opus gagal, fallback MP3:', e.message || e)
      }

      return (audioCache[url] = { buffer: raw, mimetype: 'audio/mpeg', ptt: false })
    } catch (e) {
      console.log('[AUTOSHOLAT] audio gagal:', e.message || e)
    }
  }
  return null
}

/* ================= JADWAL SHOLAT ================= */
async function getJadwal(kota = 'jakarta') {
  const today = dateStr(getNow())
  if (cacheJadwal[kota]?.date === today) return cacheJadwal[kota].data

  try {
    const id = CITIES[kota.toLowerCase()] || CITIES.jakarta
    const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${id}/${today}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }
    })
    if (!res.ok) throw new Error(`API jadwal gagal ${res.status}`)

    const d = (await res.json())?.data?.jadwal
    if (!d) throw new Error('Data jadwal kosong')

    const hasil = { Fajr: d.subuh, Dhuhr: d.dzuhur, Asr: d.ashar, Maghrib: d.maghrib, Isha: d.isya }
    cacheJadwal[kota] = { date: today, data: hasil }
    return hasil
  } catch (e) {
    console.log('[AUTOSHOLAT] error jadwal:', e.message || e)
    return null
  }
}

function isNowMatch(waktu) {
  if (!waktu) return false
  const now = getNow()
  const [h, m] = waktu.split(':').map(Number)
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  const diff = (now - target) / 1000
  return diff >= 0 && diff <= TOLERANSI
}

function resetDaily() {
  const today = getNow().toDateString()
  if (lastReset !== today) {
    sholatLock = {}
    lastReset = today
  }
}

/* ================= KIRIM PESAN ================= */
async function sendSholatPreview(id, text) {
  try {
    const thumb = await getThumbnail()
    const highQualityThumbnail = await getHighQualityThumbnail()
    const invisible = '\u200B'.repeat(400)

    return await conn.sendMessage(id, {
      text: `${SOURCE_URL}${invisible}\n\n${text}`,
      linkPreview: {
        'matched-text': SOURCE_URL,
        matchedText: SOURCE_URL,
        canonicalUrl: SOURCE_URL,
        title: brand.botName,
        description: 'Pengingat Sholat • Waku Waku 🕌',
        previewType: 0,
        jpegThumbnail: thumb,
        highQualityThumbnail,
        thumbnailUrl: THUMBNAIL,
        linkPreviewMetadata: { linkMediaDuration: 0, socialMediaPostType: 4 }
      },
      favicon: { url: THUMBNAIL }
    })
  } catch (e) {
    console.log('[AUTOSHOLAT] preview gagal, kirim teks biasa:', e.message || e)
    return conn.sendMessage(id, { text }).catch(() => {})
  }
}

/* ================= TICK: JADWAL BUKA/TUTUP ================= */
async function jadwalTick() {
  const current = hhmm(getNow())

  for (const [jid, chat] of Object.entries(store.allChats())) {
    if (!chat || !jid.endsWith('@g.us')) continue

    for (const [field, setting, label] of [
      ['openTime', 'not_announcement', 'dibuka.\nSekarang semua peserta dapat mengirim pesan.'],
      ['closeTime', 'announcement', 'ditutup.\nSekarang hanya admin yang dapat mengirim pesan.']
    ]) {
      if (chat[field] !== current) continue

      const key = `${jid}_${field}_${current}`
      if (scheduleLock.has(key)) continue
      scheduleLock.add(key)
      setTimeout(() => scheduleLock.delete(key), 90000)

      try {
        await conn.groupSettingUpdate(jid, setting)
        await conn.sendMessage(jid, { text: `✅ Grup telah ${label}` })
      } catch (e) {
        console.error('[JADWAL]', jid, e.message || e)
      }
    }
  }
}

/* ================= TICK: AUTOSHOLAT ================= */
async function autosholatTick() {
  resetDaily()
  let changed = false

  for (const [id, chat] of Object.entries(store.allChats())) {
    if (!chat?.autosholat || !id.endsWith('@g.us')) continue

    const now = getNow()

    /* ===== MODE JUMAT ===== */
    if (isJumat(now)) {
      if (isBetweenJumat(now)) {
        if (!chat.jumatClosed) {
          try { await conn.groupSettingUpdate(id, 'announcement') } catch {}
          await sendSholatPreview(id, `🕌 *Waktu Sholat Jumat*\n\nGrup ditutup 11:00 - 13:00 WIB`)
          chat.jumatClosed = true
          changed = true
        }
        continue
      }

      if (chat.jumatClosed && now.getHours() >= 13) {
        try { await conn.groupSettingUpdate(id, 'not_announcement') } catch {}
        await conn.sendMessage(id, { text: `✨ Grup dibuka kembali\nSemoga ibadah diterima 🤲` }).catch(() => {})
        chat.jumatClosed = false
        changed = true
      }
    }

    /* ===== BUKA OTOMATIS SETELAH ADZAN ===== */
    if (chat.isClosed && Date.now() >= chat.tutupSampai) {
      try { await conn.groupSettingUpdate(id, 'not_announcement') } catch {}
      await conn.sendMessage(id, { text: '✨ Grup dibuka kembali' }).catch(() => {})
      chat.isClosed = false
      changed = true
    }

    /* ===== ADZAN ===== */
    const kota = chat.kota || 'jakarta'
    const jadwal = await getJadwal(kota)
    if (!jadwal) continue

    const sholatMap = {
      Subuh: jadwal.Fajr,
      Dzuhur: jadwal.Dhuhr,
      Ashar: jadwal.Asr,
      Maghrib: jadwal.Maghrib,
      Isya: jadwal.Isha
    }

    for (const [nama, waktu] of Object.entries(sholatMap)) {
      if (!isNowMatch(waktu)) continue

      const lockKey = `${id}-${nama}-${getNow().toDateString()}`
      if (sholatLock[lockKey]) continue
      sholatLock[lockKey] = true

      try { await conn.groupSettingUpdate(id, 'announcement') } catch {}

      chat.isClosed = true
      chat.tutupSampai = Date.now() + DURASI_TUTUP * 60 * 1000
      changed = true

      await sendSholatPreview(
        id,
        `🕌 *Adzan ${nama}*\n\n⏰ ${waktu} WIB\n📍 ${kota}\n\nMari tunaikan sholat 🤲\n🚫 Grup ditutup ${DURASI_TUTUP} menit`
      )

      const audio = await getAudioAdzan(nama)
      if (audio?.buffer) {
        await conn.sendMessage(id, { audio: audio.buffer, mimetype: audio.mimetype, ptt: audio.ptt })
          .catch(e => console.log('[AUTOSHOLAT] kirim audio gagal:', e.message || e))
      } else {
        await conn.sendMessage(id, { text: '⚠️ Audio adzan gagal dimuat' }).catch(() => {})
      }
    }
  }

  if (changed) store.save()
}

/* ================= START ================= */
// Aman dipanggil berkali-kali (tiap reconnect): interval hanya dibuat sekali, koneksi selalu diperbarui.
export function start(Hanz) {
  conn = Hanz
  if (started) return
  started = true

  let busyJadwal = false
  setInterval(async () => {
    if (!conn || busyJadwal) return
    busyJadwal = true
    try { await jadwalTick() } catch (e) { console.error('[JADWAL]', e.message || e) } finally { busyJadwal = false }
  }, 20 * 1000).unref()

  let busySholat = false
  setInterval(async () => {
    if (!conn || busySholat) return
    busySholat = true
    try { await autosholatTick() } catch (e) { console.error('[AUTOSHOLAT]', e.message || e) } finally { busySholat = false }
  }, 30 * 1000).unref()

  console.log('[GRUP-ENGINE] jadwal buka/tutup & autosholat aktif')
}

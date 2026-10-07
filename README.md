# 🤖 ICHIGO - WhatsApp Bot Multi-Device

<p align="center">
  <img src="src/media/logo.png" alt="ICHIGO Logo" width="200" height="200"/>
</p>

<p align="center">
  <b>Bot WhatsApp multifungsi, responsif, dan mudah dikustomisasi berbasis Node.js & Baileys.</b>
</p>

<p align="center">
  <a href="#-fitur-unggulan">Fitur</a> •
  <a href="#-struktur-proyek">Struktur Proyek</a> •
  <a href="#-persyaratan-sistem">Persyaratan</a> •
  <a href="#-cara-instalasi">Instalasi</a> •
  <a href="#-konfigurasi">Konfigurasi</a>
</p>

---

## ✨ Fitur Unggulan

ICHIGO dilengkapi dengan berbagai fitur modular yang siap pakai:

* 🛠️ **Tools & Utilities**: Konversi media, downloader (TikTok, YouTube, Spotify), ViewOnce Reader (RVO), dan screenshot web.
* 👥 **Group Management**: Auto-join, kick/add, promote/demote, tagall, hidetag, dan pengatur deskripsi/nama grup.
* 🎮 **Mini Games**: Game interaktif seperti Dino, Mario, Sonic, serta kalkulator Mobile Legends (Hitung WR).
* 🏷️ **Sticker Maker**: Konversi gambar/video ke stiker dengan pengaturan kustom.
* 🖥️ **Panel Control**: Fitur integrasi dan manajemen Pterodactyl Panel langsung dari WhatsApp.
* 🎌 **Anime & Media**: Pencarian anime dan pemroses media otomatis.

---

## 📁 Struktur Proyek

```text
ICHIGO/
├── index.js                  # Entry point utama bot
├── package.json              # Dependensi dan skrip proyek
├── src/
│   ├── commands/             # Handler perintah (Grup, Downloader, Game, Panel, dll)
│   ├── database/             # Penyimpanan data lokal (Pengaturan & Grup)
│   ├── handlers/             # Pesan dan event handler
│   ├── legacy/               # Skrip pendukung & pustaka fitur tambahan
│   ├── media/                # Asset gambar, video, dan logo bot
│   └── utils/                # Helper, plugin loader, dan skrip otomatisasi


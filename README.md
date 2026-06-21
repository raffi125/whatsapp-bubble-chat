# WhatsApp Export → Bubble Chat

Simple static website untuk membaca file export WhatsApp (.txt) dan menampilkannya sebagai bubble chat agar nyaman dibaca.

Fitur:
- Upload file `.txt` hasil export WhatsApp.
- Parser menangani pesan multi-line dan pola tanggal/waktu umum.
- Tandai pesanmu sendiri (input "Nama saya" untuk align kanan).
- Download hasil parsing sebagai JSON.

Cara pakai lokal:
1. Buat folder baru, tempel file `index.html`, `styles.css`, `parser.js`, `app.js`.
2. Buka `index.html` di browser (cukup buka file, atau untuk fitur yang lebih konsisten jalankan static server, mis. `npx http-server`).
3. Masukkan nama kamu (agar pesanmu tampil di kanan), lalu pilih file export WhatsApp (`.txt`).
4. Chat akan muncul sebagai bubble; klik "Download JSON" untuk menyimpan hasil parsing.

Catatan:
- Parser mencoba menangani format tanggal/waktu standar di export WhatsApp (dd/mm/yyyy, mm/dd/yy, dll.) tetapi tidak 100% untuk semua lokal. Jika ada format yang tidak dikenali, beri contoh baris export dan aku bisa tambahkan support.
- Untuk deploy cepat: bisa pakai GitHub Pages (buat repo, push file, aktifkan Pages).

Ingin aku buatkan repository GitHub langsung dan push file ini untukmu? Kalau iya, kasih nama repo (mis. `whatsapp-bubble-chat`) dan apakah repo private atau public.

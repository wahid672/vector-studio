# Garis — Studio Vektor

Aplikasi web raster → SVG dengan VTracer open source. Seluruh gambar diproses di browser lewat WebAssembly dalam Web Worker; tidak ada API berbayar, upload gambar ke server, akun, atau database.

## Jalankan

Node.js 20+ diperlukan.

```sh
npm ci
npm run build
npm test
npm run dev
```

Buka http://127.0.0.1:4173. Direktori `dist/` dapat disajikan sebagai situs statis melalui HTTP(S), dengan MIME `application/wasm` untuk `.wasm`. Membuka `index.html` melalui `file://` tidak didukung.

## Fitur

- Pemilihan gambar, drag/drop, paste clipboard, dan contoh raster bawaan.
- Preset logo, ilustrasi, hitam-putih; pengaturan jumlah warna, penyederhanaan, bintik, bentuk garis, dan threshold.
- Preview pembanding, asli, vektor, outline, dan zoom 25–400%.
- Unduh SVG dengan path asli, statistik path/warna/ukuran/waktu, serta pembatalan worker.
- SVG hasil lama tidak bisa diunduh setelah pengaturan berubah sampai pemrosesan berhasil.

## Batas

Maksimal file 20 MB; input di atas 40 MP ditolak setelah decode. Gambar diperkecil menjadi maksimal sisi 1600 px dan 2 MP; ukuran pemrosesan ditampilkan. Browser harus mendukung WebAssembly, module Worker, createImageBitmap, dan ResizeObserver. GIF menggunakan frame pertama. Belum ada ekspor EPS/PDF/DXF, batch, penghapusan background otomatis, atau penyuntingan region. Alpha input dipertahankan sesuai hasil engine; tidak ada fitur AI tambahan.

## Engine

Dependency dikunci ke `@visioncortex/vtracer@1.0.0-alpha.4` (rilis upstream masih alpha). `scripts/vendor.mjs` menyalin WASM resmi tanpa perubahan, lalu mengadaptasi glue JavaScript Node menjadi modul browser dengan initializer byte-buffer. Algoritma tracing tidak dimodifikasi. Build gagal jika pola inisialisasi upstream berubah. Lisensi dan atribusi berada di `dist/THIRD-PARTY-NOTICES.txt`.

Sumber upstream: https://github.com/visioncortex/vtracer

# Garis — Studio Vektor

Aplikasi web raster → SVG dengan VTracer open source. Seluruh gambar diproses di browser lewat WebAssembly dalam Web Worker; tidak ada API berbayar, upload gambar ke server, akun, atau database.

## Deploy ke Vercel

1. Buka https://vercel.com/new dan import repository `wahid672/vector-studio`.
2. Gunakan **Root Directory** root repository (`.`), bukan `dist` atau `vector-studio`.
3. Pilih **Framework Preset: Other**. Konfigurasi `vercel.json` sudah menetapkan:
   - Install Command: `npm ci --ignore-scripts`
   - Build Command: `npm run build && npm test`
   - Output Directory: `dist`
4. Klik **Deploy**. Tidak perlu environment variable atau API key.

Vercel menyajikan aplikasi sebagai aset statis. Worker dan engine WASM berjalan di browser pengunjung, tanpa Vercel Functions. Header `application/wasm` dikonfigurasi untuk engine VTracer; aset diperiksa ulang agar pembaruan kode dan WASM tidak tertahan cache lama. `.vercelignore` mengecualikan konfigurasi Docker, metadata Site, dan file lokal dari upload CLI, serta tetap menyertakan kode build dan tes.

Setelah repository terhubung, push berikutnya ke branch produksi memicu deployment Vercel. Untuk pengembangan lokal tetap gunakan `npm run dev`.

Alternatif melalui Vercel CLI dari root repository:

```sh
npx vercel
# Untuk menerbitkan ke produksi setelah project terhubung:
npx vercel --prod
```

CLI akan meminta login dan pemilihan project di akun Vercel Anda. Panduan konfigurasi resmi: https://vercel.com/docs/project-configuration/vercel-json

## Deploy dengan Docker Compose

Image: `ghcr.io/wahid672/vector-studio:latest` (Linux AMD64 dan ARM64).

Di server dengan Docker Engine dan plugin Docker Compose:

```sh
git clone https://github.com/wahid672/vector-studio.git
cd vector-studio
docker compose pull
docker compose up -d --wait
```

Buka `http://IP-SERVER:8080`. Tidak perlu Node.js, database, API key, atau GPU di server. Runtime menggunakan Nginx dengan user non-root, filesystem read-only, dan health check `/health`.

Untuk menggunakan Compose tanpa clone seluruh repository:

```sh
mkdir -p vector-studio
cd vector-studio
curl -fsSLO https://raw.githubusercontent.com/wahid672/vector-studio/main/compose.yaml
docker compose pull
docker compose up -d --wait
```

### Port, domain, dan HTTPS

Salin `.env.example` menjadi `.env` untuk mengubah port atau tag image:

```dotenv
PORT=8080
IMAGE_TAG=latest
BIND_ADDRESS=0.0.0.0
```

Jika menggunakan Nginx Proxy Manager, Traefik, atau Caddy pada host yang sama, arahkan proxy ke port 8080. Untuk proxy yang berjalan langsung di host, `BIND_ADDRESS=127.0.0.1` membatasi akses port ke host tersebut. Aktifkan HTTPS di reverse proxy untuk domain Anda; akses clipboard browser tertentu memerlukan secure context. Batas akses privat pada Site ChatGPT tidak berlaku pada deployment Docker: aplikasi ini tidak menyediakan login, dan port default dapat diakses dari jaringan yang diizinkan firewall server.

### Jika GHCR meminta login

Package GHCR baru biasanya privat. Jika package belum dibuat public, login satu kali di server menggunakan Personal Access Token **classic** dengan akses `read:packages` dan akses ke package:

```sh
docker login ghcr.io -u wahid672
# Masukkan token pada prompt Password, bukan password akun GitHub.
docker compose pull
docker compose up -d --wait
```

Untuk pull tanpa login, owner dapat membuka halaman package GitHub → Package settings → Change visibility → Public. Jangan menaruh token di `.env`, Compose, atau repository. Workflow publikasi menggunakan `GITHUB_TOKEN` bawaan Actions sehingga tidak perlu membuat secret PAT untuk build.

### Update, log, dan stop

```sh
docker compose pull
docker compose up -d --wait
docker compose ps
docker compose logs --tail=100 -f
docker compose down
```

Perintah `pull` dan `up` memperbarui container; `logs` memantau log dan `down` menghentikan aplikasi. Untuk rollback, ganti `IMAGE_TAG` ke tag `sha-...` dari build sebelumnya, lalu ulangi `pull` dan `up`. Tidak ada volume data aplikasi yang perlu dicadangkan karena gambar diproses di browser.

### Build sendiri tanpa GHCR

```sh
docker compose -f compose.yaml -f compose.build.yaml up -d --build --wait
```

Dockerfile memasang dependency sesuai lockfile, membangun adapter WebAssembly, dan menjalankan pengujian VTracer sebelum menyalin aset ke Nginx.

## Publikasi otomatis ke GHCR

Workflow `.github/workflows/container.yaml` menjalankan build, tes engine, dan smoke test Compose/HTTP/WASM. Setelah lolos, push ke `main` menerbitkan `latest` dan tag `sha-...`. Tag Git seperti `v1.0.0` menerbitkan image `1.0.0`, `1.0`, dan `sha-...`. Pull request diuji tanpa publikasi image. Build dapat dijalankan ulang melalui tab Actions → Container → Run workflow.

Status build: https://github.com/wahid672/vector-studio/actions

Jika publikasi ditolak, periksa izin GitHub Actions untuk menulis package dan apakah package dengan nama yang sama sudah dimiliki repository lain. Rilis image hanya tersedia setelah workflow berhasil.

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

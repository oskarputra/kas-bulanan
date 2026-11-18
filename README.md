# Kas Bulanan

Website untuk mencatat pengeluaran bulanan berdasarkan **periode gajian**, bukan bulan kalender. Dibangun dengan Next.js 16 (App Router), PostgreSQL, dan Drizzle ORM, dengan tampilan mengikuti Apple Human Interface Guidelines.

## Fitur

- **Masuk dan daftar** dengan email dan kata sandi. Sesi disimpan di database lewat cookie httpOnly, dan kata sandi di-hash dengan bcrypt.
- **Periode gajian**: tanggal gajian 1–31 yang bisa diubah kapan saja. Ada pilihan menggeser gajian ke Jumat kalau jatuh di akhir pekan, dan perubahan bisa berlaku mulai periode sekarang atau periode berikutnya.
- **Catat** pengeluaran atau pemasukan dengan keypad, ikon kategori, dan pilihan tanggal *Hari ini*, *Kemarin*, atau *Pilih tanggal*. Kalau tanggalnya di periode lalu, muncul keterangan periode mana yang terisi. Di desktop bisa langsung mengetik angka.
- **Beranda**: sisa uang yang bisa dipakai sampai gajian (sudah dikurangi tagihan rutin yang belum dibayar), jatah per hari, hitung mundur gajian, widget, dan insight mingguan.
- **Rutin**: daftar tagihan atau setoran tabungan yang muncul tiap periode. Ketuk untuk menandai dibayar, dan transaksinya langsung tercatat. Tagihan yang jumlahnya berubah (misalnya token listrik) diisi saat dibayar.
- **Tabungan**: beberapa tabungan dengan target dan tenggat. Bisa setor dan tarik; penarikan bisa ikut dicatat sebagai pengeluaran atau tidak. Ada juga perkiraan kapan target tercapai.
- **Laporan**: grafik 6 periode, perbandingan dengan rata-rata, porsi per kategori dibanding periode lalu, persentase tabungan, dan unduh CSV.
- Tampilan responsif: tab bar di ponsel, sidebar di layar ≥ 960 px.

## Menjalankan dengan Docker (paling mudah)

```bash
docker compose up --build
```

Buka http://localhost:3000. Migrasi database jalan otomatis saat container start.

> Kalau sudah dipasang di belakang HTTPS, hapus `INSECURE_COOKIE: "1"` di `docker-compose.yml` supaya cookie sesi hanya dikirim lewat HTTPS.

## Menjalankan untuk pengembangan

Butuh Node.js 20.9+ dan PostgreSQL 14+.

```bash
cp .env.example .env          # isi DATABASE_URL
npm install
npm run db:migrate            # buat tabel
npm run dev                   # http://localhost:3000
```

Perintah lain:

| Perintah | Kegunaan |
|---|---|
| `npm run build` lalu `npm start` | Mode produksi |
| `npm test` | Uji logika periode gajian |
| `npm run lint` | Cek tipe TypeScript |
| `npm run db:generate` | Buat file migrasi baru setelah mengubah `src/db/schema.ts` |
| `npm run reset-password -- email@contoh.com KataSandiBaru1` | Atur ulang kata sandi pengguna |

## Struktur

```
src/
  app/(auth)/        halaman masuk & daftar
  app/(app)/         halaman setelah masuk: beranda, catat, transaksi, rutin, tabungan, laporan, pengaturan
  lib/period.ts      logika periode gajian (murni, ada unit test)
  lib/data.ts        query & perhitungan ringkasan
  lib/actions.ts     server actions (semua mengecek pengguna yang masuk)
  lib/auth.ts        sesi cookie
  db/schema.ts       skema database
drizzle/             file migrasi SQL
```

## Cara hitung

- **Sisa** = pemasukan periode ini − pengeluaran − setoran tabungan + penarikan tabungan. Kalau pemasukan gaji belum dicatat, dipakai *Gaji bulanan* dari pengaturan.
- **Bisa dipakai** = sisa − tagihan rutin yang belum dibayar. **Per hari** = bisa dipakai ÷ sisa hari sampai gajian.
- Penarikan tabungan yang dicatat sebagai pengeluaran tidak dihitung dua kali.

## Catatan keamanan

- Semua server action dan route mengecek sesi, dan setiap query dibatasi `user_id`.
- Belum ada pembatasan percobaan login. Kalau website dibuka ke internet, pasang rate limit di reverse proxy (misalnya Nginx `limit_req`) untuk `/masuk`.
- Belum ada lupa kata sandi lewat email; pakai `npm run reset-password`.

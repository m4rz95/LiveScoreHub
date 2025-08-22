# Liga Manager

Tech: Next.js 14 (App Router) + Prisma + PostgreSQL + Tailwind + shadcn-like UI.

## Jalankan
1. `npm i`
2. Salin `.env.example` ke `.env` dan sesuaikan `DATABASE_URL`
3. `npx prisma migrate dev --name init`
4. `npx prisma db seed`
5. `npm run dev` → buka http://localhost:3000

## Halaman
- **/teams**: CRUD tim
- **/matches**: Generate jadwal acak round-robin + update skor
- **/standings**: Klasemen auto dari match yang sudah `played=true`

## Skor & Poin
- Menang = 3, Seri = 1, Kalah = 0. Urutan: Pts, GD, GF, Nama.

## Catatan
- Route API berada di `app/api/*`
- Prisma schema memastikan kombinasi homeTeamId-awayTeamId unik.

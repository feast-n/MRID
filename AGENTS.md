# AGENT INSTRUCTIONS: MRID (My Rider Identity Dashboard)

## PROJECT OVERVIEW
MRID adalah platform web dashboard identitas rider ojek online interaktif yang responsif (Mobile-first, iOS Minimalist style). Proyek ini dibuat menggunakan Next.js (App Router), Tailwind CSS, dan Supabase Backend.

## STRICT ZERO-HALLUCINATION RULES
1. DILARANG HARDCODE ATAU NGARANG DATA RIDER:
   - Semua data spek motor, identitas, basecamp, dan hobi HANYA boleh diambil dari data statis di `src/config/rider.ts` atau Supabase DB.
   - Jika ada variabel yang kosong, tampilkan fallback UI (`—`) atau tanyakan ke user terlebih dahulu.
2. DILARANG MENGUBAH IMPORTS/STRUCTURE SUPABASE:
   - Gunakan selalu helper dari `src/utils/supabase/client.ts` untuk Client Component dan `src/utils/supabase/server.ts` untuk Server Component.
3. PERSONALITY CODE INSTRUCTION:
   - Gaya bahasa UI/Copywriting: Casual, asik, ala anak muda umur 21 tahun (bahasa gaul santai/estetik khas Gen-Z), tapi tetap sopan bagi penumpang.

## STRICT GIT BRANCHING & MERGE WORKFLOW (MANDATORY)
1. DILARANG WORK/COMMIT DIRECTLY ON `main` / `master`:
   - Sebelum membuat atau mengubah kode untuk fitur baru/perbaikan, Agent WAJIB mengecek branch saat ini (`git branch --show-current`).
   - Jika sedang berada di `main` atau `master`, Agent WAJIB membuat feature branch baru terlebih dahulu sebelum eksekusi file (contoh: `git checkout -b feature/nama-fitur`).
2. FEATURE DEVELOPMENT ISOLATION:
   - Setiap fitur baru, eksperimen, atau komponen baru HARUS memiliki branch terpisah.
3. MERGE PROTOCOL (REQUIRES USER APPROVAL):
   - Agent DILARANG melakukan `git merge` ke `main` secara otomatis.
   - Setelah pengerjaan fitur di feature branch selesai, Agent HANYA boleh memberikan instruksi atau meminta konfirmasi ke user: *"Fitur [nama] sudah selesai di branch [nama-branch]. Apakah siap di-merge ke main?"*
   - MERGE HANYA boleh dieksekusi setelah user memberikan persetujuan eksplisit (misal: "approve", "merge", "lanjut merge").
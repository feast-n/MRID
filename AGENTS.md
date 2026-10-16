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

## TECH STACK & CONFIG
- Framework: Next.js 14+ (App Router, TypeScript)
- Styling: Tailwind CSS (iOS Clean Minimalist theme: rounded-3xl, backdrop-blur, subtle borders, SF Pro-like fonts)
- Database & Backend: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
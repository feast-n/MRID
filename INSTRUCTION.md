# PROJECT EXECUTION INSTRUCTION

## WORKFLOW ATURAN GIT (SOP AGENT)
1. Setiap mulai tugas/fitur baru:
   - Cek branch: `git branch`
   - Buat branch baru: `git checkout -b feature/<nama-fitur>`
2. Selama pengerjaan:
   - Semua commit dan edit file dilakukan di feature branch.
3. Setelah pengerjaan selesai:
   - Tampilkan ringkasan perubahan ke user.
   - Minta persetujuan user untuk merge.
   - Eksekusi merge ke main HANYA jika disetujui:
     `git checkout main && git merge feature/<nama-fitur>`

## STEP 1: INITIAL SETUP & BRANCHING
1. Pindah dari main ke branch setup awal:
   `git checkout -b feature/initial-supabase-setup`
2. Run command untuk install dependencies:
   `npm install @supabase/supabase-js @supabase/ssr lucide-react framer-motion`
3. Tambahkan file `.env.local` dengan kredensial Supabase.
4. Tambahkan helper Supabase pada path:
   - `src/utils/supabase/client.ts`
   - `src/utils/supabase/server.ts`
   - `src/utils/supabase/middleware.ts`

## STEP 2: AGENT SKILLS INSTALLATION
Jalankan command ini di terminal untuk mengaktifkan AI Supabase skill:
`npx skills add supabase/agent-skills`

## STEP 3: COMPONENT DEVELOPMENT (NEW BRANCH PER FEATURE)
1. Feature 1 (Rider Config & Base Dashboard):
   - Branch: `feature/rider-dashboard-ui`
   - Buat data statis rider di `src/config/rider.ts`.
   - Buat UI iOS Dashboard Layout di `src/app/page.tsx`.
2. Feature 2 (Passenger Interactive Components):
   - Branch: `feature/passenger-feedback`
   - Buat `PassengerFeedbackForm.tsx` (Direct post to Supabase `feedback`).
   - Buat `TodayMotivationWidget.tsx` (Fetch & display realtime quotes from Supabase `motivations`).
# PROJECT EXECUTION INSTRUCTION

## STEP 1: INITIAL SETUP
1. Run command untuk install dependencies:
   `npm install @supabase/supabase-js @supabase/ssr lucide-react framer-motion`
2. Tambahkan file `.env.local` dengan kredensial Supabase.
3. Tambahkan helper Supabase pada path:
   - `src/utils/supabase/client.ts`
   - `src/utils/supabase/server.ts`
   - `src/utils/supabase/middleware.ts`

## STEP 2: AGENT SKILLS INSTALLATION
Jalankan command ini di terminal untuk mengaktifkan AI Supabase skill:
`npx skills add supabase/agent-skills`

## STEP 3: COMPONENT DEVELOPMENT
1. Buat data statis rider di `src/config/rider.ts`.
2. Buat UI iOS Dashboard Layout di `src/app/page.tsx`.
3. Buat komponen interaktif:
   - `PassengerFeedbackForm.tsx` (Direct post to Supabase `feedback`)
   - `TodayMotivationWidget.tsx` (Fetch & display realtime quotes from Supabase `motivations`)
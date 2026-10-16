# DESIGN SYSTEM & UI/UX SPECIFICATION

## DESIGN THEME
- **Style:** iOS Minimalist Clean (Light/Dark Glassmorphism, Subtle Gradients, Smooth Shadows).
- **Border Radius:** `rounded-2xl` dan `rounded-3xl` khas iOS Widget.
- **Background:** Slate-100 (`bg-slate-100 dark:bg-slate-900/80`) dengan aksen Glassmorphism (`backdrop-blur-md bg-white/70 dark:bg-slate-900/70`).

## COLOR PALETTE
- **Primary Accent:** Black (`#000000`) / Dark Gray (`#262626` dark mode). High contrast on slate-100 canvas, white text = 21:1 (WCAG AAA).
- **Surface:** White / Dark Slate dengan border transparan (`border border-slate-200/50 dark:border-slate-800/50`).
- **Text:** High Contrast Slate (`text-slate-900 dark:text-slate-100`) & Subtitle Muted (`text-slate-500`).

## CORE DASHBOARD SECTIONS
1. **Profile Card:** Foto/Avatar, Nama, Status Rider, dan Plat Motor.
2. **Motor Specs Widget:** Tipe motor & setup modifikasi (CVT/mesin/kaki-kaki).
3. **Basecamp & Side Quest:** Tempat ngetem favorit & kesibukan (Kuliah/Web Dev).
4. **Passenger Vibes / Comfort Toggle:** Sakelar interaktif "Quiet Ride" / "Bebas Ngobrol" & Info Helm Wangi.
5. **Kesan Penumpang (Feedback Form):** Form input cepat dari penumpang via Supabase.
6. **Today's Motivation by Customer:** Marquee/Carousel kutipan motivasi yang ditulis langsung oleh penumpang hari ini.
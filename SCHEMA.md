# SUPABASE DATABASE SCHEMA & CONFIG

## ENVIRONMENT VARIABLES (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://gkyjtstedvlwsrzbytul.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_qc0HUbWBqG9SLr4UGu9BFg_2BhrScXT

## DATABASE TABLES

### Table: `feedback` (Kesan Penumpang)
- `id`: uuid (Primary Key, default: `gen_random_uuid()`)
- `created_at`: timestamp with time zone (default: `now()`)
- `passenger_name`: text (optional / default: 'Anonim')
- `comment`: text (required)
- `rating`: integer (1-5)

### Table: `motivations` (Today Motivations)
- `id`: uuid (Primary Key, default: `gen_random_uuid()`)
- `created_at`: timestamp with time zone (default: `now()`)
- `author`: text (default: 'Penumpang Baik')
- `quote`: text (required)
- `is_approved`: boolean (default: true)
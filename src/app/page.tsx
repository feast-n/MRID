import { Fragment } from "react";
import { Bike, MapPin, UserRound } from "lucide-react";
import GuestGallery from "@/components/GuestGallery";
import PassengerFeedbackForm from "@/components/PassengerFeedbackForm";
import TodayMotivationWidget from "@/components/TodayMotivationWidget";
import { SpecRow, WidgetCard } from "@/components/ui/WidgetCard";
import type { DriverRow } from "@/config/driver";
import { initials, orDash, rider } from "@/config/rider";
import { createClient } from "@/utils/supabase/server";

/**
 * Data driver dibaca saat request dari tabel `public.drivers`
 * (1 user = 1 driver, setup lewat form di /admin) — route ini dinamis.
 */
export const instant = false;

/** ViewModel identitas yang ditampilkan ke penumpang. */
interface DriverView {
  key: string;
  name: string;
  avatarUrl: string;
  status: string;
  motor: {
    type: string;
    plateNumber: string;
    cvtSetup: string;
    engineSetup: string;
    undercarriageSetup: string;
  };
  basecamp: { name: string; note: string };
  hobbies: string[];
  sideQuest: string;
}

/** Map baris tabel `drivers` → view model. */
function viewFromRow(row: DriverRow): DriverView {
  return {
    key: row.user_id,
    name: row.name,
    avatarUrl: row.avatar_url,
    status: row.status,
    motor: {
      type: row.motor_type,
      plateNumber: row.plate_number,
      cvtSetup: row.cvt_setup,
      engineSetup: row.engine_setup,
      undercarriageSetup: row.undercarriage_setup,
    },
    basecamp: { name: row.basecamp_name, note: row.basecamp_note },
    hobbies: Array.isArray(row.hobbies) ? row.hobbies : [],
    sideQuest: row.side_quest,
  };
}

/**
 * Fallback (zero-hallucination): kalau belum ada driver yang di-setup di
 * dashboard, tampilkan data statis dari `src/config/rider.ts` —
 * field kosong tetap render "—", tidak pernah mengarang data.
 */
function fallbackFromConfig(): DriverView {
  return {
    key: "rider-config",
    name: rider.name,
    avatarUrl: rider.avatarUrl,
    status: rider.status,
    motor: { ...rider.motor },
    basecamp: { ...rider.basecamp },
    hobbies: [...rider.hobbies],
    sideQuest: rider.sideQuest,
  };
}

function ProfileCard({ profile }: { profile: DriverView }) {
  const name = profile.name.trim();
  const status = profile.status.trim();
  const plate = profile.motor.plateNumber.trim();
  const hasAvatar = profile.avatarUrl.trim().length > 0;

  return (
    <section className="rounded-3xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="flex items-center gap-4">
        {hasAvatar ? (
          // URL foto dari form admin (tabel drivers) — pakai img biasa saja.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={`Foto ${orDash(profile.name)}`}
            className="h-[68px] w-[68px] shrink-0 rounded-full object-cover ring-2 ring-accent/30 dark:ring-accent-soft/30"
          />
        ) : (
          <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-xl font-semibold text-white">
            {name ? (
              initials(profile.name)
            ) : (
              <UserRound className="h-7 w-7" aria-hidden />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Profile Rider
          </p>
          <h2 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {orDash(profile.name)}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                status
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
                }`}
              />
              {orDash(profile.status)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {orDash(plate)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const supabase = await createClient();

  let rows: DriverRow[] = [];
  try {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: true });
    rows = error ? [] : ((data ?? []) as DriverRow[]);
  } catch {
    // Gagal jaringan/config → biarkan kosong, fallback dipakai di bawah.
    rows = [];
  }

  const profiles: DriverView[] =
    rows.length > 0 ? rows.map(viewFromRow) : [fallbackFromConfig()];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-8 sm:px-6 lg:py-12">
        {/* Header */}
        <header className="px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent dark:text-accent-soft">
            My Rider Identity
          </p>
          <h1 className="mt-1 text-[34px] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100">
            MRID
            <span className="text-accent dark:text-accent-soft">.</span>
          </h1>
          <p className="mt-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            Dashboard rider ala widget iOS — clean, singkat, to the point.
          </p>
        </header>

        {/* Profile → Garage → Basecamp (per driver; 1 user = 1 driver) */}
        {profiles.map((profile) => {
          const hobbies = profile.hobbies
            .map((item) => item.trim())
            .filter(Boolean);

          return (
            <Fragment key={profile.key}>
              <ProfileCard profile={profile} />

              {/* Garage & Specs Widget */}
              <WidgetCard
                eyebrow="Garage"
                title="Spek motor & setup"
                icon={<Bike className="h-[18px] w-[18px]" aria-hidden />}
              >
                <dl className="flex flex-col">
                  <SpecRow
                    label="Tipe motor"
                    value={orDash(profile.motor.type)}
                  />
                  <SpecRow
                    label="Plat"
                    value={orDash(profile.motor.plateNumber)}
                  />
                  <SpecRow
                    label="CVT"
                    value={orDash(profile.motor.cvtSetup)}
                  />
                  <SpecRow
                    label="Mesin"
                    value={orDash(profile.motor.engineSetup)}
                  />
                  <SpecRow
                    label="Kaki-kaki"
                    value={orDash(profile.motor.undercarriageSetup)}
                  />
                </dl>
              </WidgetCard>

              {/* Basecamp & Side Quest */}
              <WidgetCard
                eyebrow="Basecamp & Side Quest"
                title="Ngetem & kesibukan"
                icon={<MapPin className="h-[18px] w-[18px]" aria-hidden />}
              >
                <dl className="flex flex-col">
                  <SpecRow
                    label="Basecamp favorit"
                    value={orDash(profile.basecamp.name)}
                  />
                  <SpecRow
                    label="Catatan"
                    value={orDash(profile.basecamp.note)}
                  />
                  <SpecRow
                    label="Side quest"
                    value={orDash(profile.sideQuest)}
                  />
                </dl>

                <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-slate-800/60">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Hobi
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {hobbies.length > 0 ? (
                      hobbies.map((hobby) => (
                        <span
                          key={hobby}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {hobby}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        —
                      </span>
                    )}
                  </div>
                </div>
              </WidgetCard>
            </Fragment>
          );
        })}

        {/* Galeri Kesan Penumpang (foto dari admin) */}
        <GuestGallery />

        {/* Kesan Penumpang (form) */}
        <PassengerFeedbackForm />

        {/* Today's Motivation — realtime */}
        <TodayMotivationWidget />

        <footer className="px-1 pb-2 pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          MRID • data driver dari{" "}
          <code className="font-mono">src/config/rider.ts</code> &amp; tabel{" "}
          <code className="font-mono">drivers</code>
        </footer>
      </main>
    </div>
  );
}

import { Bike, MapPin, UserRound } from "lucide-react";
import GuestGallery from "@/components/GuestGallery";
import PassengerFeedbackForm from "@/components/PassengerFeedbackForm";
import TodayMotivationWidget from "@/components/TodayMotivationWidget";
import { SpecRow, WidgetCard } from "@/components/ui/WidgetCard";
import { initials, orDash, rider } from "@/config/rider";

function ProfileCard() {
  const name = rider.name.trim();
  const status = rider.status.trim();
  const plate = rider.motor.plateNumber.trim();
  const hasAvatar = rider.avatarUrl.trim().length > 0;

  return (
    <section className="rounded-3xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="flex items-center gap-4">
        {hasAvatar ? (
          // Avatar URL dinamis dari rider config — pakai img biasa saja.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rider.avatarUrl}
            alt={`Foto ${orDash(rider.name)}`}
            className="h-[68px] w-[68px] shrink-0 rounded-full object-cover ring-2 ring-accent/30 dark:ring-accent-soft/30"
          />
        ) : (
          <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-xl font-semibold text-white">
            {name ? (
              initials(rider.name)
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
            {orDash(name)}
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
              {orDash(status)}
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

export default function Home() {
  const hobbies = rider.hobbies.map((item) => item.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-8 sm:px-6 lg:py-12">
        {/* Header */}
        <header className="px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent dark:text-accent-soft">
            My Rider Identity
          </p>
          <h1 className="mt-1 text-[34px] font-bold leading-none tracking-tight">
            MRID
            <span className="text-accent dark:text-accent-soft">.</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Dashboard rider ala widget iOS — clean, singkat, to the point.
          </p>
        </header>

        {/* Profile / Identity Card */}
        <ProfileCard />

        {/* Garage & Specs Widget */}
        <WidgetCard
          eyebrow="Garage"
          title="Spek motor & setup"
          icon={<Bike className="h-[18px] w-[18px]" aria-hidden />}
        >
          <dl className="flex flex-col">
            <SpecRow label="Tipe motor" value={orDash(rider.motor.type)} />
            <SpecRow label="Plat" value={orDash(rider.motor.plateNumber)} />
            <SpecRow label="CVT" value={orDash(rider.motor.cvtSetup)} />
            <SpecRow label="Mesin" value={orDash(rider.motor.engineSetup)} />
            <SpecRow
              label="Kaki-kaki"
              value={orDash(rider.motor.undercarriageSetup)}
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
              value={orDash(rider.basecamp.name)}
            />
            <SpecRow label="Catatan" value={orDash(rider.basecamp.note)} />
            <SpecRow label="Side quest" value={orDash(rider.sideQuest)} />
          </dl>

          <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-slate-800/60">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
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

        {/* Galeri Kesan Penumpang (foto dari admin) */}
        <GuestGallery />

        {/* Kesan Penumpang (form) */}
        <PassengerFeedbackForm />

        {/* Today's Motivation — realtime */}
        <TodayMotivationWidget />

        <footer className="px-1 pb-2 pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          MRID • diperbarui dari{" "}
          <code className="font-mono">src/config/rider.ts</code>
        </footer>
      </main>
    </div>
  );
}

import { Bike, MapPin, UserRound } from "lucide-react";
import ComfortToggle from "@/components/ComfortToggle";
import PassengerFeedbackForm from "@/components/PassengerFeedbackForm";
import TodayMotivationWidget from "@/components/TodayMotivationWidget";
import { initials, listOrDash, orDash, rider } from "@/config/rider";

function WidgetCard({
  eyebrow,
  title,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200/50 bg-white/70 p-5 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        <span className="text-[#007AFF] dark:text-[#06B6D4]">{icon}</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/50 py-2 last:border-b-0 dark:border-slate-800/50">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}

export default function Home() {
  const hasAvatar = rider.avatarUrl.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Header */}
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#007AFF] dark:text-[#06B6D4]">
            My Rider Identity
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            MRID<span className="text-[#007AFF] dark:text-[#06B6D4]">.</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dashboard rider ala widget iOS — clean, singkat, to the point.
          </p>
        </header>

        {/* Today's Motivation — realtime */}
        <div className="mb-4">
          <TodayMotivationWidget />
        </div>

        {/* Profile Card */}
        <section className="mb-4 rounded-3xl border border-slate-200/50 bg-white/70 p-5 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
          <div className="flex items-center gap-4">
            {hasAvatar ? (
              // Avatar URL bersifat dinamis dari rider config — pakai img biasa saja.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rider.avatarUrl}
                alt={`Foto ${orDash(rider.name)}`}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#007AFF]/40 dark:ring-[#06B6D4]/40"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF] to-[#06B6D4] text-xl font-bold text-white">
                {initials(rider.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Profile Rider
              </p>
              <h2 className="truncate text-xl font-semibold">
                {orDash(rider.name)}
              </h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {orDash(rider.status)}
                </span>
                <span aria-hidden>•</span>
                <span className="font-mono">
                  {orDash(rider.motor.plateNumber)}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Motor Specs Widget */}
        <div className="mb-4">
          <WidgetCard
            eyebrow="Motor Specs"
            title="Spek motor & setup"
            icon={<Bike className="h-5 w-5" aria-hidden />}
          >
            <SpecRow label="Tipe motor" value={orDash(rider.motor.type)} />
            <SpecRow label="Plat" value={orDash(rider.motor.plateNumber)} />
            <SpecRow label="CVT" value={orDash(rider.motor.cvtSetup)} />
            <SpecRow label="Mesin" value={orDash(rider.motor.engineSetup)} />
            <SpecRow
              label="Kaki-kaki"
              value={orDash(rider.motor.undercarriageSetup)}
            />
          </WidgetCard>
        </div>

        {/* Basecamp & Side Quest */}
        <div className="mb-4">
          <WidgetCard
            eyebrow="Basecamp & Side Quest"
            title="Ngetem & kesibukan"
            icon={<MapPin className="h-5 w-5" aria-hidden />}
          >
            <SpecRow
              label="Basecamp favorit"
              value={orDash(rider.basecamp.name)}
            />
            <SpecRow label="Catatan" value={orDash(rider.basecamp.note)} />
            <SpecRow label="Hobi" value={listOrDash(rider.hobbies)} />
            <SpecRow label="Side quest" value={orDash(rider.sideQuest)} />
          </WidgetCard>
        </div>

        {/* Passenger Comfort Toggle */}
        <div className="mb-4">
          <ComfortToggle />
        </div>

        {/* Kesan Penumpang */}
        <div className="mb-4">
          <PassengerFeedbackForm />
        </div>

        <footer className="pt-2 pb-4 text-center text-xs text-slate-400">
          MRID •{" "}
          <span className="inline-flex items-center gap-1 align-middle">
            <UserRound className="h-3 w-3" aria-hidden />
            diperbarui dari <code className="font-mono">src/config/rider.ts</code>
          </span>
        </footer>
      </main>
    </div>
  );
}

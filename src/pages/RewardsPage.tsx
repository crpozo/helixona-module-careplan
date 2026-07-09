import { Coins } from 'lucide-react'
import { useApp, useDerived } from '@/store/store'
import { formatShortDate, num } from '@/lib/format'
import { getIcon } from '@/lib/icons'
import { Card } from '@/components/Card'
import { IconChip } from '@/components/IconChip'
import { Pill } from '@/components/Pill'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/Button'
import { SectionHeading } from '@/components/SectionHeading'

/**
 * Patient rewards: how many points you have, what you can treat yourself to,
 * codes you already redeemed, and your badges. One idea per section.
 */
export function RewardsPage() {
  const { state, actions } = useApp()
  const d = useDerived()

  const balance = d.points.balance
  const level = d.level
  const TierIcon = getIcon(level.icon)

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* 1) Header */}
      <header className="animate-fade-up pt-2 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-800">Rewards</h1>
        <p className="mt-1 text-base font-semibold text-slate-500">
          You earn points every time you check something off.
        </p>
      </header>

      {/* 2) Balance hero */}
      <Card className="border-brand-200 bg-brand-50">
        <div className="flex flex-col items-center text-center">
          <Coins className="h-10 w-10 text-brand-700" />
          <p className="mt-2 text-5xl font-extrabold text-slate-800 tnum">{num(balance)}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">points to spend</p>

          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5 font-extrabold text-brand-800">
              <TierIcon className="h-4 w-4" />
              {level.tier}
            </span>
            {level.nextTier && (
              <span className="text-sm font-semibold text-slate-500">
                · {num(level.toNext)} pts to {level.nextTier}
              </span>
            )}
          </p>
          <ProgressBar
            value={level.progress * 100}
            color="#c2a163"
            height={10}
            className="mt-2 max-w-xs"
          />
        </div>
      </Card>

      {/* 3) Treat yourself */}
      <section>
        <SectionHeading icon="Gift" title="Treat yourself" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {state.rewards.map((r) => {
            const affordable = balance >= r.cost
            return (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-2">
                  <IconChip icon={r.icon} size="h-12 w-12" iconClassName="h-6 w-6" />
                  <Pill tone="brand">{r.value}</Pill>
                </div>
                <p className="mt-3 font-extrabold text-slate-800">{r.title}</p>
                <p className="mt-0.5 text-sm font-bold text-slate-500 tnum">{num(r.cost)} pts</p>
                {affordable ? (
                  <Button
                    variant="success"
                    className="mt-3 w-full"
                    onClick={() => actions.redeem(r.id)}
                  >
                    Redeem
                  </Button>
                ) : (
                  <Button variant="secondary" className="mt-3 w-full" disabled>
                    Need {num(r.cost - balance)} more
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      {/* 4) My rewards — codes to show at the front desk */}
      {state.redemptions.length > 0 && (
        <section>
          <SectionHeading icon="Ticket" title="My rewards" />
          <div className="space-y-3">
            {state.redemptions.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-3xl border-2 border-slate-200 p-4"
              >
                <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-extrabold tracking-widest text-slate-700 tnum">
                  {r.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-slate-800">{r.title}</p>
                  <p className="text-sm text-slate-500">
                    {r.value} · {formatShortDate(r.date)}
                  </p>
                </div>
                {r.used ? (
                  <Pill tone="neutral">Used</Pill>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => actions.markRedemptionUsed(r.id)}
                  >
                    Mark used
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5) Badges */}
      <section>
        <SectionHeading icon="Award" title="Badges" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {d.badges.map((badge) => {
            const BadgeIcon = getIcon(badge.icon)
            return (
              <div
                key={badge.id}
                title={badge.earned ? badge.description : badge.hint}
                className="text-center"
              >
                <span
                  className={
                    'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ' +
                    (badge.earned
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-slate-100 text-slate-300')
                  }
                >
                  <BadgeIcon className="h-7 w-7" />
                </span>
                <p
                  className={
                    'mt-1.5 text-xs font-bold ' +
                    (badge.earned ? 'text-slate-700' : 'text-slate-400')
                  }
                >
                  {badge.name}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

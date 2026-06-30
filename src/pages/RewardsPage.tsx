import { useMemo, useState } from 'react'
import {
  Coins,
  Gift,
  Lock,
  PartyPopper,
  Sparkles,
  X,
} from 'lucide-react'
import type { Redemption, RewardKind } from '@/types'
import { useApp, useDerived } from '@/store/store'
import { TIERS } from '@/lib/gamification'
import { formatDate, formatShortDate, num } from '@/lib/format'
import { getIcon } from '@/lib/icons'
import { Card } from '@/components/Card'
import { IconChip } from '@/components/IconChip'
import { Pill } from '@/components/Pill'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { SectionHeading } from '@/components/SectionHeading'

// Patient-facing label for each reward type.
const KIND_LABEL: Record<RewardKind, string> = {
  discount: 'Discount',
  gift: 'Gift card',
  service: 'Free service',
  merch: 'Merch',
}

// Badge tone -> tailwind classes for the earned (filled) state.
const BADGE_TONE: Record<
  string,
  { fill: string; ring: string; chip: 'good' | 'watch' | 'bad' | 'brand' | 'neutral' }
> = {
  brand: { fill: 'bg-brand-500 text-ink-900', ring: 'ring-brand-500/30', chip: 'brand' },
  emerald: { fill: 'bg-emerald-500 text-white', ring: 'ring-emerald-500/30', chip: 'good' },
  amber: { fill: 'bg-amber-400 text-ink-900', ring: 'ring-amber-500/30', chip: 'watch' },
  rose: { fill: 'bg-rose-500 text-white', ring: 'ring-rose-500/30', chip: 'bad' },
  slate: { fill: 'bg-slate-700 text-white', ring: 'ring-white/15', chip: 'neutral' },
}

export function RewardsPage() {
  const { state, actions } = useApp()
  const d = useDerived()

  // Local UI state — the celebratory banner shown after a successful redeem.
  const [lastRedeemed, setLastRedeemed] = useState<Redemption | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openBadge, setOpenBadge] = useState<(typeof d.badges)[number] | null>(null)

  const balance = d.points.balance
  const LevelIcon = getIcon(d.level.icon)

  const rewards = useMemo(
    () => [...state.rewards].sort((a, b) => a.cost - b.cost),
    [state.rewards],
  )

  const redemptions = useMemo(
    () => [...state.redemptions].sort((a, b) => b.date.localeCompare(a.date)),
    [state.redemptions],
  )

  function handleRedeem(rewardId: string) {
    const result = actions.redeem(rewardId)
    if (result) {
      setError(null)
      setLastRedeemed(result)
      // Bring the banner into view on small screens.
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else {
      setLastRedeemed(null)
      setError('Not enough points just yet — keep completing your plan!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Mobile page title (desktop top bar shows the section name). */}
      <h1 className="text-lg font-bold text-white lg:hidden">Rewards</h1>

      {/* 1) POINTS HERO ------------------------------------------------------ */}
      <section className="animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/12 via-white/[0.03] to-transparent text-white shadow-sm backdrop-blur">
        <div className="relative p-5 sm:p-7">
          {/* warm gold glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-brand-500/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-brand-500/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-brand-300">
                <Coins className="h-4 w-4" />
                Your balance
              </p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-brand-400 tnum sm:text-4xl">
                  {num(balance)}
                </span>
                <span className="text-sm font-medium text-slate-300">points</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Earn points by completing your plan each week.
              </p>

              {/* small lifetime / spent stats */}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Lifetime
                  </p>
                  <p className="text-sm font-semibold text-white tnum">
                    {num(d.points.lifetime)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Spent
                  </p>
                  <p className="text-sm font-semibold text-white tnum">
                    {num(d.points.spent)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    This week
                  </p>
                  <p className="text-sm font-semibold text-emerald-400 tnum">
                    +{num(d.points.thisWeek)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tier card */}
            <div className="w-full shrink-0 rounded-xl border border-white/10 bg-white/5 p-4 sm:w-64">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-ink-900">
                  <LevelIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-brand-300">
                    Tier {d.level.index} of {d.level.total}
                  </p>
                  <p className="text-base font-bold tracking-tight text-white">
                    {d.level.tier}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <ProgressBar
                  value={d.level.progress * 100}
                  color="#d6b981"
                  trackClassName="bg-white/10"
                  height={8}
                />
                <p className="mt-2 text-[11px] font-medium text-slate-300">
                  {d.level.nextTier ? (
                    <>
                      <span className="font-semibold text-brand-300 tnum">
                        {num(d.level.toNext)}
                      </span>{' '}
                      pts to {d.level.nextTier}
                    </>
                  ) : (
                    <span className="font-semibold text-brand-300">Top tier — radiant!</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success / error banners ------------------------------------------- */}
      {lastRedeemed && (
        <div
          role="status"
          className="animate-pop-in flex items-start gap-3 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/12 via-white/[0.03] to-transparent p-4 shadow-sm backdrop-blur"
        >
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-ink-900">
            <PartyPopper className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              Redeemed! {lastRedeemed.title}
            </p>
            <p className="mt-0.5 text-sm text-slate-300">
              Your code:{' '}
              <span className="font-mono font-semibold text-brand-300">
                {lastRedeemed.code}
              </span>{' '}
              — show this at the front desk.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLastRedeemed(null)}
            aria-label="Dismiss"
            className="-m-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/15 p-4 backdrop-blur"
        >
          <p className="flex-1 text-sm font-medium text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="-m-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-rose-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2) REDEEM CATALOG -------------------------------------------------- */}
      <Card
        title="Redeem your points"
        subtitle="Treat yourself — gift cards, free sessions and members-only perks."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const RewardIcon = getIcon(reward.icon)
            const affordable = balance >= reward.cost
            const toGo = Math.max(0, reward.cost - balance)
            return (
              <div
                key={reward.id}
                className={
                  'flex flex-col rounded-xl border p-4 transition-shadow ' +
                  (affordable
                    ? 'border-brand-500/40 bg-gradient-to-br from-brand-500/12 via-white/[0.03] to-transparent ring-2 ring-brand-500/40 hover:shadow-md'
                    : 'border-white/10 bg-white/[0.03] opacity-70 hover:shadow-sm')
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={
                      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ' +
                      (affordable
                        ? 'bg-brand-500 text-ink-900'
                        : 'bg-brand-500/15 text-brand-300')
                    }
                  >
                    <RewardIcon className="h-5 w-5" />
                  </span>
                  <Pill tone="brand">{reward.value}</Pill>
                </div>

                <p className="mt-3 text-sm font-semibold text-white">{reward.title}</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {KIND_LABEL[reward.kind]}
                </p>
                <p className="mt-1.5 flex-1 text-xs text-slate-400">{reward.description}</p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white tnum">
                    {num(reward.cost)}{' '}
                    <span className="text-xs font-medium text-slate-400">pts</span>
                  </p>
                  {affordable ? (
                    <Button
                      size="sm"
                      onClick={() => handleRedeem(reward.id)}
                      aria-label={`Redeem ${reward.title}`}
                    >
                      <Gift className="h-4 w-4" />
                      Redeem
                    </Button>
                  ) : (
                    <div className="text-right">
                      <Button size="sm" disabled aria-label={`${reward.title} locked`}>
                        Redeem
                      </Button>
                      <p className="mt-1 text-[11px] font-medium text-slate-400 tnum">
                        {num(toGo)} pts to go
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 3) MY REWARDS ------------------------------------------------------ */}
      <Card
        title="Your rewards"
        subtitle="Redemption codes — show them at the front desk."
        flush
      >
        {redemptions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="Gift"
              title="No rewards yet"
              description="Redeem your points above and your codes will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {redemptions.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4"
              >
                <IconChip icon="Gift" size="h-10 w-10" iconClassName="h-5 w-5" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {r.title}{' '}
                    <span className="font-medium text-brand-300">· {r.value}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    <span className="font-mono font-medium text-slate-300">{r.code}</span>
                    <span className="mx-1.5">·</span>
                    <span className="tnum">{formatDate(r.date)}</span>
                  </p>
                </div>
                {r.used ? (
                  <Pill tone="good">Used</Pill>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => actions.markRedemptionUsed(r.id)}
                  >
                    Mark used
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 4) BADGES ---------------------------------------------------------- */}
      <section>
        <SectionHeading
          icon="Award"
          title="Achievements"
          subtitle={`${d.earnedBadges.length} of ${d.badges.length} earned`}
        />
        <Card>
          {openBadge && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-500/25 bg-brand-500/10 p-3.5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-brand-300 ring-1 ring-white/10">
                {(() => {
                  const Icon = getIcon(openBadge.icon)
                  return <Icon className="h-5 w-5" />
                })()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{openBadge.name}</p>
                  {openBadge.earned ? (
                    <Pill tone="good">Earned</Pill>
                  ) : (
                    <Pill tone="neutral">Locked</Pill>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-300">{openBadge.description}</p>
                {!openBadge.earned && openBadge.hint && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    How to earn: {openBadge.hint}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpenBadge(null)}
                aria-label="Dismiss badge details"
                className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {d.badges.map((badge) => {
              const BadgeIcon = getIcon(badge.icon)
              const tone = BADGE_TONE[badge.tone] ?? BADGE_TONE.brand
              if (badge.earned) {
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setOpenBadge(badge)}
                    className={
                      'flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center ring-1 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ' +
                      tone.ring
                    }
                  >
                    <span
                      className={
                        'inline-flex h-12 w-12 items-center justify-center rounded-full shadow-sm ' +
                        tone.fill
                      }
                    >
                      <BadgeIcon className="h-6 w-6" />
                    </span>
                    <p className="mt-2.5 text-xs font-semibold text-white">
                      {badge.name}
                    </p>
                    {badge.earnedDate ? (
                      <p className="mt-1 text-[11px] text-slate-400 tnum">
                        {formatShortDate(badge.earnedDate)}
                      </p>
                    ) : (
                      <p className="mt-1">
                        <Pill tone={tone.chip}>Earned</Pill>
                      </p>
                    )}
                  </button>
                )
              }
              // Locked badge — greyed, with hint + optional progress.
              const hasProgress = typeof badge.progress === 'number'
              const progressPct = (badge.progress ?? 0) * 100
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setOpenBadge(badge)}
                  className="flex flex-col items-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-center transition-colors hover:border-brand-500/40 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                >
                  <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400 grayscale">
                    <BadgeIcon className="h-6 w-6 opacity-60" />
                    <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#15151a] text-slate-400 ring-1 ring-white/10">
                      <Lock className="h-3 w-3" />
                    </span>
                  </span>
                  <p className="mt-2.5 text-xs font-semibold text-slate-400">{badge.name}</p>
                  {badge.hint && (
                    <p className="mt-1 text-[11px] leading-snug text-slate-400">
                      {badge.hint}
                    </p>
                  )}
                  {hasProgress && (
                    <div className="mt-2 w-full">
                      <ProgressBar value={progressPct} color="#d6b981" height={5} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            {TIERS.length} loyalty tiers · keep going to unlock them all.
          </p>
        </Card>
      </section>
    </div>
  )
}

import type { Activity, ActivityCategory } from '@/types'

// ---------------------------------------------------------------------------
// Patient education — plain-language explainers for the treatments on a plan
// of care. Matched by name keywords (staff can rename/add activities), with a
// friendly per-category fallback so every item can always explain itself.
// Tone: supportive and factual — what it is and why it's on the plan, without
// medical over-claiming.
// ---------------------------------------------------------------------------

export interface EduContent {
  /** "What it is" — one or two plain sentences. */
  what: string
  /** "Why it's in your plan" — the purpose, in patient words. */
  why: string
  /** Optional "Good to know" — what to expect or a practical tip. */
  expect?: string
}

interface EduEntry extends EduContent {
  /** Case-insensitive keywords matched (whole-word) against the name. */
  match: string[]
}

const ENTRIES: EduEntry[] = [
  {
    match: ['eboo'],
    what: 'EBOO (Extracorporeal Blood Oxygenation & Ozonation) gently draws a small amount of your blood, enriches it with oxygen and ozone, filters it, and returns it to you — think of it as a careful “wash and recharge” for your blood.',
    why: 'It is used to support circulation, oxygen delivery and your body’s own detox and immune balance.',
    expect: 'You relax in a chair for about an hour while a nurse monitors everything. Arrive well hydrated.',
  },
  {
    match: ['nano bath', 'nano'],
    what: 'A warm soak in water filled with ultra-fine “nano” bubbles — so small they carry extra oxygen against your skin.',
    why: 'It supports skin health and circulation, and most people find it deeply relaxing.',
    expect: 'Just soak and unwind for about 30 minutes — no effort required.',
  },
  {
    match: ['red light'],
    what: 'You stand or lie under panels of gentle red and near-infrared light. It does not burn or tan — it is light your cells can use.',
    why: 'Red light supports your mitochondria (your cells’ energy factories), which helps with energy, skin and recovery.',
    expect: 'It feels like standing in warm sunlight for about 20 minutes.',
  },
  {
    match: ['hydrogen'],
    what: 'You breathe air enriched with molecular hydrogen through a soft nasal cannula while you sit back and relax.',
    why: 'Hydrogen acts as a gentle antioxidant, helping calm oxidative stress and inflammation.',
    expect: 'It is odorless and effortless — many patients read or nap during the session.',
  },
  {
    match: ['salt room', 'halotherapy'],
    what: 'A calm room with very fine, dry salt particles in the air — the same idea as breathing sea air, concentrated.',
    why: 'Halotherapy is used to support your airways and skin.',
    expect: 'You simply sit and breathe for about 45 minutes. Wear comfortable clothes.',
  },
  {
    match: ['iv'],
    what: 'A slow drip that delivers fluids, vitamins and minerals directly into your bloodstream, where absorption is immediate.',
    why: 'It tops up hydration and nutrients quickly — useful when your body is working hard to recover.',
    expect: 'Eat something light beforehand and drink water. Sessions take about 45 minutes.',
  },
  {
    match: ['provider visit', 'office visit', 'check-in', 'provider'],
    what: 'Time with your provider to review how you are doing — symptoms, labs and progress since last time.',
    why: 'Your plan is adjusted based on what your body is telling us, so these visits keep everything on track.',
    expect: 'Bring questions! This is your time.',
  },
  {
    match: ['rebounding', 'trampoline'],
    what: 'Gentle bouncing on a mini-trampoline — small, easy movements, not a workout.',
    why: 'The light up-and-down motion helps move lymphatic fluid, which supports your body’s natural cleanup system.',
    expect: 'Five easy minutes is enough. Keep it gentle — no need to jump high.',
  },
  {
    match: ['dry brushing', 'dry brush'],
    what: 'Brushing your dry skin with a soft-bristled brush, always stroking toward your heart, before you shower.',
    why: 'It stimulates circulation and lymph flow, and leaves your skin smoother.',
    expect: 'Light pressure is plenty — your skin should feel warm, never scratched.',
  },
  {
    match: ['salt bath', 'epsom'],
    what: 'A warm bath with Epsom salt (magnesium sulfate) dissolved in the water.',
    why: 'It helps relax muscles and supports winding down — a favorite before bed.',
    expect: 'Soak for about 20 minutes and rinse off afterwards.',
  },
  {
    match: ['omega'],
    what: 'Essential fats (EPA & DHA) from fish oil that your body cannot make on its own.',
    why: 'Omega-3s support your heart, brain and joints, and help keep inflammation in balance.',
    expect: 'Take them with a meal so the oils absorb well.',
  },
  {
    match: ['vitamin d'],
    what: 'The “sunshine vitamin” (D3), often paired with K2, which helps direct calcium to your bones.',
    why: 'Vitamin D supports your immune system, bones and mood — and most people run low on it.',
    expect: 'Best taken in the morning with a meal that contains some fat.',
  },
  {
    match: ['magnesium'],
    what: 'A mineral your muscles and nervous system rely on. The glycinate form is gentle on the stomach.',
    why: 'It supports muscle relaxation and restful sleep.',
    expect: 'Take it about 30 minutes before bed.',
  },
  {
    match: ['ldn', 'naltrexone'],
    what: 'A prescription medicine used at a very small (“low”) dose — much lower than its original use.',
    why: 'At low doses it is used to help modulate the immune system and calm inflammation.',
    expect: 'Take it at the same time every night, exactly as prescribed. Tell your provider about any changes you notice.',
  },
  {
    match: ['neurofeedback'],
    what: 'A brain-training session: sensors read your brainwaves while you watch or listen to feedback that rewards calm, focused patterns.',
    why: 'Over time it helps your brain practice steadier, more flexible patterns — supporting focus and calm.',
    expect: 'It is completely painless — the sensors only listen. Arrive rested if you can.',
  },
  {
    match: ['hyperbaric'],
    what: 'You rest inside a comfortable pressurized chamber breathing higher levels of oxygen.',
    why: 'The gentle pressure lets your blood carry extra oxygen to tissues that are healing.',
    expect: 'You may feel your ears pop like on a plane — swallowing helps. Sessions are supervised throughout.',
  },
  {
    match: ['zone 2', 'cardio'],
    what: 'Easy, steady movement — a brisk walk, light cycling — at a pace where you could still hold a conversation.',
    why: 'This “zone 2” effort builds your aerobic base and trains your mitochondria without stressing your body.',
    expect: 'If you are breathing too hard to talk, slow down. Easy really is the point.',
  },
  {
    match: ['creatine'],
    what: 'One of the most-researched supplements there is — it helps your muscles store quick energy (ATP).',
    why: 'It supports strength, muscle maintenance and exercise recovery.',
    expect: 'Mix it into water or a shake. Consistency matters more than timing.',
  },
  {
    match: ['sunlight', 'morning walk'],
    what: 'Ten to fifteen minutes outdoors within an hour of waking — no sunglasses, no need to look at the sun.',
    why: 'Morning light anchors your body clock, which improves sleep at night and energy during the day.',
    expect: 'Cloudy days still count — outdoor light is far brighter than it looks.',
  },
]

/** Friendly fallbacks so freshly added activities can still explain themselves. */
const CATEGORY_FALLBACK: Record<ActivityCategory, EduContent> = {
  treatment: {
    what: 'An in-office therapy that is part of your plan of care, given by the clinic team.',
    why: 'Your provider chose it to support the goals of your current stage.',
    expect: 'Ask the team at your next visit — they love explaining what they do.',
  },
  iv: {
    what: 'A slow drip that delivers fluids and nutrients directly into your bloodstream.',
    why: 'It tops up hydration and nutrients quickly while your body recovers.',
    expect: 'Hydrate and eat something light beforehand.',
  },
  office_visit: {
    what: 'Time with your care team to review progress and adjust your plan.',
    why: 'Regular check-ins keep your plan matched to how your body is responding.',
  },
  home: {
    what: 'A simple at-home practice that is part of your weekly plan.',
    why: 'Small, consistent habits at home do a lot of the healing work between visits.',
  },
  supplement: {
    what: 'A nutrient your provider added to support your plan.',
    why: 'It fills a specific gap your provider identified for this stage.',
    expect: 'Follow the dose on your plan, and mention any new supplements you start on your own.',
  },
  medication: {
    what: 'A medicine prescribed by your provider as part of your plan of care.',
    why: 'It plays a specific role in this stage of your plan.',
    expect: 'Take it exactly as prescribed, and tell your provider about any changes you notice.',
  },
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Find the explainer for an activity — keyword match first, category fallback otherwise. */
export function findEducation(
  activity: Pick<Activity, 'name' | 'category'>,
): EduContent & { generic: boolean } {
  const name = activity.name.toLowerCase()
  for (const entry of ENTRIES) {
    if (entry.match.some((kw) => new RegExp(`\\b${escapeRegExp(kw)}\\b`).test(name))) {
      const { match: _match, ...content } = entry
      return { ...content, generic: false }
    }
  }
  return { ...CATEGORY_FALLBACK[activity.category], generic: true }
}

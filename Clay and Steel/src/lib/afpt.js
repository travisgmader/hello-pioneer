// AF PT scoring: Sep 2025 charts (50-20-15-15 distribution)
// Points: cardio=50, waist=20, push-ups=15, core=15, total=100, passing=75

const RUN_TABLES = {
  male: {
    '<25':   { minSecs: 19*60+45, maxSecs: 13*60+25 },
    '25-29': { minSecs: 19*60+45, maxSecs: 13*60+25 },
    '30-34': { minSecs: 20*60+44, maxSecs: 13*60+42 },
    '35-39': { minSecs: 20*60+44, maxSecs: 13*60+42 },
    '40-44': { minSecs: 22*60+4,  maxSecs: 14*60+5  },
    '45-49': { minSecs: 22*60+4,  maxSecs: 14*60+30 },
    '50-54': { minSecs: 22*60+50, maxSecs: 15*60+9  },
    '55-59': { minSecs: 23*60+36, maxSecs: 15*60+28 },
    '60+':   { minSecs: 23*60+36, maxSecs: 15*60+28 },
  },
  female: {
    '<25':   { minSecs: 22*60+30, maxSecs: 14*60+30 },
    '25-29': { minSecs: 22*60+30, maxSecs: 14*60+30 },
    '30-34': { minSecs: 23*60+30, maxSecs: 14*60+50 },
    '35-39': { minSecs: 23*60+30, maxSecs: 14*60+50 },
    '40-44': { minSecs: 25*60+0,  maxSecs: 15*60+15 },
    '45-49': { minSecs: 25*60+0,  maxSecs: 15*60+40 },
    '50-54': { minSecs: 25*60+45, maxSecs: 16*60+20 },
    '55-59': { minSecs: 26*60+30, maxSecs: 16*60+40 },
    '60+':   { minSecs: 26*60+30, maxSecs: 16*60+40 },
  },
}

const PUSHUP_TABLES = {
  male: {
    '<25':   { min: 30, max: 67 },
    '25-29': { min: 27, max: 62 },
    '30-34': { min: 24, max: 57 },
    '35-39': { min: 21, max: 51 },
    '40-44': { min: 18, max: 44 },
    '45-49': { min: 18, max: 44 },
    '50-54': { min: 12, max: 36 },
    '55-59': { min: 11, max: 33 },
    '60+':   { min: 11, max: 30 },
  },
  female: {
    '<25':   { min: 15, max: 47 },
    '25-29': { min: 14, max: 44 },
    '30-34': { min: 13, max: 41 },
    '35-39': { min: 12, max: 38 },
    '40-44': { min: 11, max: 35 },
    '45-49': { min: 10, max: 32 },
    '50-54': { min: 9,  max: 29 },
    '55-59': { min: 8,  max: 26 },
    '60+':   { min: 7,  max: 23 },
  },
}

const SITUP_TABLES = {
  male: {
    '<25':   { min: 29, max: 58 },
    '25-29': { min: 28, max: 56 },
    '30-34': { min: 25, max: 54 },
    '35-39': { min: 23, max: 52 },
    '40-44': { min: 21, max: 50 },
    '45-49': { min: 19, max: 48 },
    '50-54': { min: 17, max: 46 },
    '55-59': { min: 15, max: 44 },
    '60+':   { min: 13, max: 42 },
  },
  female: {
    '<25':   { min: 35, max: 54 },
    '25-29': { min: 34, max: 52 },
    '30-34': { min: 33, max: 50 },
    '35-39': { min: 32, max: 48 },
    '40-44': { min: 31, max: 46 },
    '45-49': { min: 30, max: 44 },
    '50-54': { min: 29, max: 42 },
    '55-59': { min: 28, max: 40 },
    '60+':   { min: 27, max: 38 },
  },
}

// HAMR (High Aerobic Multi-Level Run) — 20m shuttle beep test
// Shuttle counts per level (standard MSFT/HAMR protocol)
const HAMR_SHUTTLES_PER_LEVEL = [7, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 13, 14, 14, 15, 15, 16]

// Min/max total shuttles by sex and age bracket — approx. 2025 AF PT standards
const HAMR_TABLES = {
  male: {
    '<25':   { min: 33,  max: 138 },
    '25-29': { min: 33,  max: 131 },
    '30-34': { min: 29,  max: 121 },
    '35-39': { min: 26,  max: 110 },
    '40-44': { min: 23,  max: 97  },
    '45-49': { min: 23,  max: 89  },
    '50-54': { min: 20,  max: 79  },
    '55-59': { min: 18,  max: 71  },
    '60+':   { min: 18,  max: 65  },
  },
  female: {
    '<25':   { min: 26,  max: 110 },
    '25-29': { min: 26,  max: 103 },
    '30-34': { min: 23,  max: 94  },
    '35-39': { min: 22,  max: 86  },
    '40-44': { min: 20,  max: 77  },
    '45-49': { min: 20,  max: 70  },
    '50-54': { min: 18,  max: 62  },
    '55-59': { min: 16,  max: 56  },
    '60+':   { min: 16,  max: 50  },
  },
}

// Plank in seconds — same table for both sexes
const PLANK_TABLE = {
  '<25':   { min: 65,  max: 215 },
  '25-29': { min: 60,  max: 210 },
  '30-34': { min: 55,  max: 205 },
  '35-39': { min: 50,  max: 200 },
  '40-44': { min: 45,  max: 195 },
  '45-49': { min: 40,  max: 190 },
  '50-54': { min: 35,  max: 185 },
  '55-59': { min: 30,  max: 180 },
  '60+':   { min: 25,  max: 175 },
}

export function ageKey(age) {
  const n = parseInt(age, 10)
  if (!Number.isFinite(n) || n < 25) return '<25'
  if (n < 30) return '25-29'
  if (n < 35) return '30-34'
  if (n < 40) return '35-39'
  if (n < 45) return '40-44'
  if (n < 50) return '45-49'
  if (n < 55) return '50-54'
  if (n < 60) return '55-59'
  return '60+'
}

export function getTables(sex, age) {
  const key = ageKey(age)
  const s   = sex === 'female' ? 'female' : 'male'
  return {
    run:    RUN_TABLES[s][key],
    pushup: PUSHUP_TABLES[s][key],
    situp:  SITUP_TABLES[s][key],
    plank:  PLANK_TABLE[key],
  }
}

// Waist-to-height ratio thresholds for 20 / 10 / 0 pts
export const WAIST_BOUNDS = {
  male:   { low: 0.49, mod: 0.59 },
  female: { low: 0.45, mod: 0.59 },
}

// Proportionally distribute a target total score into component point targets
// Assumes the user achieves 20 pts for body composition (low-risk WHtR)
export function distributeScore(targetTotal, waistPts = 20) {
  const remaining = Math.max(0, Math.min(80, targetTotal - waistPts))
  // Scale proportional to component max (50 / 15 / 15)
  const cardio  = Math.min(50, Math.max(2.5, Math.round(remaining * 50 / 80 * 2) / 2))
  const pushups = Math.min(15, Math.max(2.5, Math.round(remaining * 15 / 80 * 2) / 2))
  const core    = Math.min(15, Math.max(2.5, Math.round(remaining * 15 / 80 * 2) / 2))
  return { waist: waistPts, cardio, pushups, core }
}

// Convert target component points → reps (push-ups, sit-ups, plank secs)
export function targetReps(targetPts, table) {
  const pts  = Math.max(2.5, Math.min(15, targetPts))
  const reps = table.min + (pts - 2.5) / (15 - 2.5) * (table.max - table.min)
  return Math.max(table.min, Math.round(reps))
}

// Convert target cardio points → 2-mile run time in seconds
export function targetRunSecs(targetPts, runTable) {
  const pts  = Math.max(2.5, Math.min(50, targetPts))
  const secs = runTable.minSecs - (pts - 2.5) / (50 - 2.5) * (runTable.minSecs - runTable.maxSecs)
  return Math.min(runTable.minSecs, Math.round(secs))
}

export function formatTime(totalSecs) {
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function getHAMRTable(sex, age) {
  const key = ageKey(age)
  const s   = sex === 'female' ? 'female' : 'male'
  return HAMR_TABLES[s][key]
}

export function targetHAMRShuttles(targetPts, table) {
  const pts     = Math.max(2.5, Math.min(50, targetPts))
  const shuttles = table.min + (pts - 2.5) / (50 - 2.5) * (table.max - table.min)
  return Math.max(table.min, Math.round(shuttles))
}

// Converts total shuttles completed → "L5.4" (Level 5, Shuttle 4) display
export function hamrLevelDisplay(totalShuttles) {
  let remaining = Math.max(1, totalShuttles)
  for (let i = 0; i < HAMR_SHUTTLES_PER_LEVEL.length; i++) {
    if (remaining <= HAMR_SHUTTLES_PER_LEVEL[i]) return `L${i + 1}.${remaining}`
    remaining -= HAMR_SHUTTLES_PER_LEVEL[i]
  }
  return `L${HAMR_SHUTTLES_PER_LEVEL.length + 1}.${remaining}`
}

export const PT_ROTATION = [['PT-Run'], ['PT-Push'], ['PT-Core'], ['PT-Run'], ['PT-Full']]

// 6-week progressive phases: working volume as % of test target
export const WEEK_PHASES = [
  { name: 'Foundation', workFactor: 0.45, maxFactor: 0.70, intervals: 4 },
  { name: 'Foundation', workFactor: 0.53, maxFactor: 0.75, intervals: 4 },
  { name: 'Build',      workFactor: 0.60, maxFactor: 0.80, intervals: 5 },
  { name: 'Build',      workFactor: 0.67, maxFactor: 0.85, intervals: 5 },
  { name: 'Peak',       workFactor: 0.75, maxFactor: 0.90, intervals: 6 },
  { name: 'Peak',       workFactor: 0.83, maxFactor: 0.95, intervals: 6 },
]

export function buildPTTemplates(targetScore, sex, age, week = 1, cardioType = 'run') {
  const tables = getTables(sex, age)
  const { cardio, pushups: pushPts, core: corePts } = distributeScore(targetScore)

  const testPush  = targetReps(pushPts, tables.pushup)
  const testSitup = targetReps(corePts, tables.situp)
  const testPlank = targetReps(corePts, tables.plank)

  const phase = WEEK_PHASES[Math.min(Math.max(week, 1), 6) - 1]

  const trainPush  = Math.max(5,  Math.round(testPush  * phase.workFactor))
  const trainSitup = Math.max(5,  Math.round(testSitup * phase.workFactor))
  const trainPlank = Math.max(15, Math.round(testPlank * phase.workFactor))

  const isPeakTest = week >= 6
  const simPush    = isPeakTest ? testPush  : Math.round(testPush  * phase.maxFactor)
  const simSitup   = isPeakTest ? testSitup : Math.round(testSitup * phase.maxFactor)
  const simPlank   = isPeakTest ? testPlank : Math.round(testPlank * phase.maxFactor)
  const fullLabel  = isPeakTest ? 'Test' : 'Simulation'

  // HR zones from age-estimated max HR
  const maxHR    = 220 - age
  const hrEasyLo = Math.round(maxHR * 0.60)
  const hrEasyHi = Math.round(maxHR * 0.70)
  const hrHardLo = Math.round(maxHR * 0.85)
  const hrHardHi = Math.round(maxHR * 0.92)

  function make(dayLabel, exercises) {
    return {
      id: crypto.randomUUID(),
      dayLabel,
      exercises: exercises.map(ex => {
        const lo = Math.max(1, ex.repLow)
        const hi = Math.max(lo, ex.repHigh)
        const obj = { id: crypto.randomUUID(), name: ex.name, sets: ex.sets, repLow: lo, repHigh: hi }
        if (ex.type)        obj.type        = ex.type
        if (ex.paceTarget)  obj.paceTarget  = ex.paceTarget
        if (ex.paceHint)    obj.paceHint    = ex.paceHint
        return obj
      }),
      uploadedAt: new Date().toISOString(),
    }
  }

  // Shared strength templates (same for both cardio types)
  const ptPush = make('PT-Push', [
    { name: `Push-Up Max Set (goal: ${testPush})`,  sets: 1, repLow: Math.round(testPush * phase.maxFactor),  repHigh: testPush },
    { name: 'Push-Ups',                              sets: 4, repLow: trainPush,                               repHigh: Math.round(trainPush * 1.2) },
    { name: 'Diamond Push-Ups',                      sets: 3, repLow: 8,                                       repHigh: 12 },
    { name: 'Plank (sec)',                           sets: 3, repLow: trainPlank,                              repHigh: Math.round(trainPlank * 1.2) },
  ])

  const ptCore = make('PT-Core', [
    { name: `Sit-Up Max Set (goal: ${testSitup})`,  sets: 1, repLow: Math.round(testSitup * phase.maxFactor), repHigh: testSitup },
    { name: 'Sit-Ups',                               sets: 3, repLow: trainSitup,                              repHigh: Math.round(trainSitup * 1.2) },
    { name: 'Plank (sec)',                           sets: 3, repLow: Math.round(trainPlank * 1.1),            repHigh: Math.round(trainPlank * 1.4) },
    { name: 'Reverse Crunches',                      sets: 3, repLow: 20,                                      repHigh: 25 },
    { name: 'Flutter Kicks',                         sets: 3, repLow: 20,                                      repHigh: 30 },
  ])

  const ptStrength = [
    { name: `Push-Up ${fullLabel} (goal: ${testPush})`,     sets: 1, repLow: simPush,  repHigh: testPush  },
    { name: `Sit-Up ${fullLabel} (goal: ${testSitup})`,     sets: 1, repLow: simSitup, repHigh: testSitup },
    { name: `Plank ${fullLabel}, sec (goal: ${testPlank})`, sets: 1, repLow: simPlank, repHigh: testPlank },
  ]

  if (cardioType === 'hamr') {
    const hamrTable        = getHAMRTable(sex, age)
    const hamrTarget       = targetHAMRShuttles(cardio, hamrTable)
    const hamrWork         = Math.max(hamrTable.min, Math.round(hamrTarget * phase.workFactor))
    const hamrMax          = Math.max(hamrTable.min, Math.round(hamrTarget * phase.maxFactor))
    const hamrTestTarget   = isPeakTest ? hamrTarget : hamrMax

    return {
      'PT-Run': make('PT-Run', [
        {
          name: 'Warm-Up: Easy Shuttle Run', type: 'run', sets: 1, repLow: 1, repHigh: 1,
          paceTarget: '3 min',
          paceHint:   `Level 4 · easy effort · Zone 2 · ${hrEasyLo}–${hrEasyHi} bpm`,
        },
        {
          name: 'HAMR Level Practice', type: 'run', sets: phase.intervals, repLow: 1, repHigh: 1,
          paceTarget: hamrLevelDisplay(hamrWork),
          paceHint:   `reach this level · Zone 4–5 · ${hrHardLo}–${hrHardHi} bpm`,
        },
        {
          name: 'HAMR Max Attempt', type: 'run', sets: 1, repLow: 1, repHigh: 1,
          paceTarget: hamrLevelDisplay(hamrMax),
          paceHint:   `push to this level then stop · Zone 4–5`,
        },
        {
          name: 'Cool-Down: Easy Walk', type: 'run', sets: 1, repLow: 1, repHigh: 1,
          paceTarget: '3 min',
          paceHint:   `recovery · Zone 1 · ≤${hrEasyLo} bpm`,
        },
      ]),
      'PT-Push': ptPush,
      'PT-Core': ptCore,
      'PT-Full': make('PT-Full', [
        ...ptStrength,
        {
          name: `HAMR ${fullLabel}`, type: 'run', sets: 1, repLow: 1, repHigh: 1,
          paceTarget: hamrLevelDisplay(hamrTestTarget),
          paceHint:   `goal: ${hamrLevelDisplay(hamrTarget)} · Zone 4–5 · ${hrHardLo}–${hrHardHi} bpm`,
        },
      ]),
    }
  }

  // 2-Mile Run cardio
  const testRunActual  = targetRunSecs(cardio, tables.run)
  const racePacePerMile = Math.round(testRunActual / 2)
  const easyPacePerMile = Math.round(racePacePerMile * 1.35)
  const stride100Secs   = Math.round(testRunActual / 32.19 * 0.90)
  const interval400     = Math.round(testRunActual / 2 * 0.25 * 0.90)

  return {
    'PT-Run': make('PT-Run', [
      {
        name: 'Warm-Up: Easy 0.5 Mile', type: 'run', sets: 1, repLow: 1, repHigh: 1,
        paceTarget: `~${formatTime(easyPacePerMile)} /mi`,
        paceHint:   `easy effort · Zone 2 · ${hrEasyLo}–${hrEasyHi} bpm`,
      },
      {
        name: '400m Interval', type: 'run', sets: phase.intervals, repLow: 1, repHigh: 1,
        paceTarget: `${formatTime(interval400)} /400m`,
        paceHint:   `hard effort · Zone 4–5 · ${hrHardLo}–${hrHardHi} bpm`,
      },
      {
        name: '100m Fast Stride', type: 'run', sets: 4, repLow: 1, repHigh: 1,
        paceTarget: `~${stride100Secs}s /100m`,
        paceHint:   `controlled fast · Zone 3–4`,
      },
      {
        name: 'Cooldown: Easy 0.5 Mile', type: 'run', sets: 1, repLow: 1, repHigh: 1,
        paceTarget: `~${formatTime(easyPacePerMile)} /mi`,
        paceHint:   `recovery · Zone 1–2 · ≤${hrEasyHi} bpm`,
      },
    ]),
    'PT-Push': ptPush,
    'PT-Core': ptCore,
    'PT-Full': make('PT-Full', [
      ...ptStrength,
      {
        name: '2-Mile Run', type: 'run', sets: 1, repLow: 1, repHigh: 1,
        paceTarget: `${formatTime(testRunActual)} total`,
        paceHint:   `~${formatTime(racePacePerMile)} /mi · Zone 4–5 · ${hrHardLo}–${hrHardHi} bpm`,
      },
    ]),
  }
}

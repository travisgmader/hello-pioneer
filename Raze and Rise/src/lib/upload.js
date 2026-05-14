import * as XLSX from 'xlsx'
import { VALID_LABELS, PT_LABELS, FULL_BODY_LABELS } from './split.js'

const ALL_VALID_LABELS = [...VALID_LABELS, ...PT_LABELS, ...FULL_BODY_LABELS]

export async function parseTemplateFile(file) {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    return parseWorkbook(wb)
  }
  const text = await file.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('File must be JSON, .xlsx, .xls, or .csv.')
  }
  return validateTemplate(data)
}

function parseWorkbook(wb) {
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' })
    if (rows.length === 0) continue
    try {
      return parseSheet(rows, sheetName)
    } catch (err) {
      if (wb.SheetNames.length === 1) throw err
    }
  }
  throw new Error('No readable workout data found in the spreadsheet.')
}

function parseSheet(rows, sheetName) {
  const headerIdx = findHeaderRow(rows)
  if (headerIdx === -1) {
    throw new Error('Could not find a header row (need columns like "exercise", "sets", "reps").')
  }
  const headers = rows[headerIdx].map(h => String(h ?? '').trim())
  const cols = mapColumns(headers)
  if (cols.name == null) throw new Error('No exercise/name column found.')
  if (cols.sets == null) throw new Error('No sets column found.')
  if (cols.reps == null && (cols.repLow == null || cols.repHigh == null)) {
    throw new Error('No reps column found (single "reps" or "low"/"high" pair).')
  }

  const dayLabel = findDayLabel(rows, headerIdx, sheetName)
  if (!dayLabel) {
    throw new Error(
      `Could not detect day label. Add one of [${VALID_LABELS.join(', ')}] to the sheet name or a cell above the table.`
    )
  }

  const exercises = []
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r]
    const rawName = String(row[cols.name] ?? '').trim()
    if (!rawName) continue
    const sets = parseInt(String(row[cols.sets]).trim(), 10)
    if (!Number.isFinite(sets) || sets < 1) continue
    let repLow, repHigh
    if (cols.reps != null) {
      const parsed = parseRepRange(row[cols.reps])
      if (!parsed) continue
      ;[repLow, repHigh] = parsed
    } else {
      repLow = parseInt(String(row[cols.repLow]).trim(), 10)
      repHigh = parseInt(String(row[cols.repHigh]).trim(), 10)
      if (!Number.isFinite(repLow) || !Number.isFinite(repHigh)) continue
    }
    if (repHigh < repLow) [repLow, repHigh] = [repHigh, repLow]
    exercises.push({ name: rawName, sets, repLow, repHigh })
  }

  if (exercises.length === 0) {
    throw new Error('Found a header row but no valid exercise rows beneath it.')
  }

  return validateTemplate({ dayLabel, exercises })
}

function findHeaderRow(rows) {
  let best = -1
  let bestScore = 0
  const limit = Math.min(rows.length, 25)
  for (let i = 0; i < limit; i++) {
    const score = scoreHeader(rows[i])
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  }
  return bestScore >= 2 ? best : -1
}

function scoreHeader(row) {
  let score = 0
  let sawName = false, sawSets = false, sawReps = false
  for (const cell of row) {
    const k = classifyHeader(cell)
    if (k === 'name' && !sawName) { score++; sawName = true }
    if (k === 'sets' && !sawSets) { score++; sawSets = true }
    if ((k === 'reps' || k === 'repLow' || k === 'repHigh') && !sawReps) {
      score++; sawReps = true
    }
  }
  return score
}

function classifyHeader(cell) {
  const s = String(cell ?? '').trim().toLowerCase()
  if (!s) return null
  if (/^(low|min|rep ?low|min ?reps?)$/.test(s)) return 'repLow'
  if (/^(high|max|rep ?high|max ?reps?)$/.test(s)) return 'repHigh'
  if (/(rep range|reps?|rep target|target reps?)/.test(s)) return 'reps'
  if (/^sets?$|# ?sets?|num ?sets?/.test(s)) return 'sets'
  if (/(exercise|movement|lift|name)/.test(s)) return 'name'
  return null
}

function mapColumns(headers) {
  const cols = { name: null, sets: null, reps: null, repLow: null, repHigh: null }
  headers.forEach((h, i) => {
    const k = classifyHeader(h)
    if (k && cols[k] == null) cols[k] = i
  })
  return cols
}

function parseRepRange(raw) {
  if (raw == null || raw === '') return null
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, ' ')
  const m = s.match(/(\d+)\s*(?:-|–|—|to|\/|~)\s*(\d+)/)
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)]
  const single = s.match(/^(\d+)\+?$/)
  if (single) {
    const n = parseInt(single[1], 10)
    return [n, n]
  }
  return null
}

function findDayLabel(rows, headerIdx, sheetName) {
  const fromSheet = matchLabel(sheetName)
  if (fromSheet) return fromSheet
  for (let i = 0; i < headerIdx; i++) {
    for (const cell of rows[i]) {
      const m = matchLabel(cell)
      if (m) return m
    }
  }
  return null
}

function matchLabel(value) {
  const s = String(value ?? '').trim().toLowerCase()
  if (!s) return null
  for (const label of VALID_LABELS) {
    if (s === label.toLowerCase()) return label
    if (s.includes(label.toLowerCase() + ' day')) return label
  }
  for (const label of VALID_LABELS) {
    const re = new RegExp(`\\b${label.toLowerCase()}\\b`)
    if (re.test(s)) return label
  }
  return null
}

export function validateTemplate(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Template must be a JSON object.')
  }
  const { dayLabel, exercises } = data
  const isValidDayLabel =
    typeof dayLabel === 'string' &&
    dayLabel.split(' + ').every(p => ALL_VALID_LABELS.includes(p)) &&
    dayLabel.split(' + ').length >= 1
  if (!isValidDayLabel) {
    throw new Error(
      `dayLabel must be one of: ${ALL_VALID_LABELS.join(', ')} (or a combination joined with " + "). Got: ${dayLabel}`
    )
  }
  if (!Array.isArray(exercises) || exercises.length === 0) {
    throw new Error('exercises must be a non-empty array.')
  }
  const validated = exercises.map((ex, i) => {
    if (!ex || typeof ex !== 'object') {
      throw new Error(`exercises[${i}] must be an object.`)
    }
    const { name, sets, repLow, repHigh } = ex
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error(`exercises[${i}].name must be a non-empty string.`)
    }
    if (!Number.isInteger(sets) || sets < 1) {
      throw new Error(`exercises[${i}].sets must be a positive integer.`)
    }
    if (!Number.isInteger(repLow) || repLow < 1) {
      throw new Error(`exercises[${i}].repLow must be a positive integer.`)
    }
    if (!Number.isInteger(repHigh) || repHigh < repLow) {
      throw new Error(
        `exercises[${i}].repHigh must be an integer >= repLow.`
      )
    }
    return {
      id: crypto.randomUUID(),
      name: name.trim(),
      sets,
      repLow,
      repHigh,
    }
  })
  return {
    id: crypto.randomUUID(),
    dayLabel,
    exercises: validated,
    uploadedAt: new Date().toISOString(),
  }
}

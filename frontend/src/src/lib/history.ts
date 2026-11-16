import type { AssessmentPayload, HistoryEntry } from '../types'

// The backend stores nothing, so history lives only in this browser and only
// ever contains scores the backend actually returned.
const KEY = 'mindmetrics-history-v1'
const MAX_ENTRIES = 25

// localStorage can hold anything (old versions, manual edits). Drop malformed
// entries so one bad record cannot crash the dashboard.
function isHistoryEntry(value: unknown): value is HistoryEntry {
  const e = value as Partial<HistoryEntry> | null
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof e.id === 'string' &&
    typeof e.createdAt === 'string' &&
    !Number.isNaN(Date.parse(e.createdAt)) &&
    typeof e.score === 'number' &&
    Number.isFinite(e.score) &&
    typeof e.payload === 'object' &&
    e.payload !== null
  )
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : []
  } catch {
    return []
  }
}

export function addHistory(score: number, payload: AssessmentPayload): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    score,
    payload,
  }
  const next = [entry, ...loadHistory()].slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable: history simply isn't kept.
  }
  return next
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

import type { AssessmentPayload, FieldName, PredictionResponse } from '../types'

const RAW_BASE = import.meta.env.VITE_API_BASE_URL
export const API_BASE_URL = (RAW_BASE || 'http://127.0.0.1:8000').replace(/\/+$/, '')

const REQUEST_TIMEOUT_MS = 20_000

export type ApiErrorKind = 'network' | 'timeout' | 'validation' | 'server' | 'invalid-response'

export class ApiError extends Error {
  kind: ApiErrorKind
  status?: number
  fieldErrors: Partial<Record<FieldName, string>>

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; fieldErrors?: Partial<Record<FieldName, string>> } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = options.status
    this.fieldErrors = options.fieldErrors ?? {}
  }
}

interface FastApiIssue {
  loc?: (string | number)[]
  msg?: string
}

function parseValidationIssues(body: unknown): { fieldErrors: Partial<Record<FieldName, string>>; summary: string } {
  const fieldErrors: Partial<Record<FieldName, string>> = {}
  const lines: string[] = []
  const detail = (body as { detail?: unknown } | null)?.detail
  if (Array.isArray(detail)) {
    for (const issue of detail as FastApiIssue[]) {
      const field = issue.loc?.[issue.loc.length - 1]
      const msg = issue.msg ?? 'Invalid value'
      if (typeof field === 'string') {
        fieldErrors[field as FieldName] = msg
        lines.push(`${field}: ${msg}`)
      } else {
        lines.push(msg)
      }
    }
  } else if (typeof detail === 'string') {
    lines.push(detail)
  }
  return { fieldErrors, summary: lines.join('; ') || 'The server rejected the submitted values.' }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('timeout', 'The server took too long to respond.')
    }
    throw new ApiError('network', `Could not reach the backend at ${API_BASE_URL}.`)
  } finally {
    clearTimeout(timer)
  }
}

/** GET / — returns true when the backend responds successfully. */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await request('/')
    return res.ok
  } catch {
    return false
  }
}

/** POST /predict — sends the exact payload and returns the backend's real score. */
export async function predictMentalHealthScore(payload: AssessmentPayload): Promise<PredictionResponse> {
  const res = await request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // Non-JSON body; handled below depending on status.
  }

  if (res.status === 422) {
    const { fieldErrors, summary } = parseValidationIssues(body)
    throw new ApiError('validation', summary, { status: 422, fieldErrors, })
  }

  if (!res.ok) {
    throw new ApiError('server', `The server returned an error (HTTP ${res.status}).`, { status: res.status })
  }

  const score = (body as Partial<PredictionResponse> | null)?.predicted_mental_health_score
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    throw new ApiError('invalid-response', 'The server response did not include a numeric predicted_mental_health_score.', {
      status: res.status,
    })
  }
  return { predicted_mental_health_score: score }
}

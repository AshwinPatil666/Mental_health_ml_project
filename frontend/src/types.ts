/** Exact request body accepted by POST /predict. */
export interface AssessmentPayload {
  age: number
  gender: 'Male' | 'Female'
  country: string
  academic_level: 'Undergraduate' | 'Graduate' | 'High School'
  most_used_platform: string
  purpose_of_use: 'Networking' | 'Education' | 'Entertainment' | 'News'
  avg_daily_usage_hours: number
  daily_unlocks: number
  study_hours: number
  physical_activity_hours: number
  sleep_hours_per_night: number
  stress_level: 'Medium' | 'Low' | 'Very High' | 'High'
}

export type FieldName = keyof AssessmentPayload

/** Form values are strings while editing so inputs can be empty. */
export type FormState = Record<FieldName, string>

/** Exact response body returned by POST /predict. */
export interface PredictionResponse {
  predicted_mental_health_score: number
}

export interface HistoryEntry {
  id: string
  createdAt: string
  score: number
  payload: AssessmentPayload
}

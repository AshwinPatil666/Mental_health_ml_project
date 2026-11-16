import type { AssessmentPayload, FieldName, FormState } from '../types'
import { ACADEMIC_LEVELS, GENDERS, PLATFORMS, PURPOSES, STRESS_LEVELS } from '../config/options'

export const EMPTY_FORM: FormState = {
  age: '',
  gender: '',
  country: '',
  academic_level: '',
  most_used_platform: '',
  purpose_of_use: '',
  avg_daily_usage_hours: '',
  daily_unlocks: '',
  study_hours: '',
  physical_activity_hours: '',
  sleep_hours_per_night: '',
  stress_level: '',
}

const oneOf = (list: readonly string[], value: string, message: string) =>
  list.includes(value) ? undefined : message

const hours = (value: string, label: string) => {
  if (value.trim() === '') return `Enter ${label}.`
  const n = Number(value)
  if (!Number.isFinite(n)) return 'Enter a number.'
  if (n < 0 || n > 24) return 'Must be between 0 and 24 hours.'
  return undefined
}

export function validateField(name: FieldName, value: string): string | undefined {
  switch (name) {
    case 'age': {
      if (value.trim() === '') return 'Enter your age.'
      const n = Number(value)
      if (!Number.isInteger(n)) return 'Age must be a whole number.'
      if (n < 10 || n > 100) return 'Age must be between 10 and 100.'
      return undefined
    }
    case 'gender':
      return oneOf(GENDERS, value, 'Choose a gender.')
    case 'country':
      return value.trim() === '' ? 'Enter your country.' : undefined
    case 'academic_level':
      return oneOf(ACADEMIC_LEVELS, value, 'Choose an academic level.')
    case 'most_used_platform':
      return oneOf(PLATFORMS, value, 'Choose a platform.')
    case 'purpose_of_use':
      return oneOf(PURPOSES, value, 'Choose a purpose.')
    case 'avg_daily_usage_hours':
      return hours(value, 'your daily usage in hours')
    case 'daily_unlocks': {
      if (value.trim() === '') return 'Enter the number of unlocks.'
      const n = Number(value)
      if (!Number.isInteger(n)) return 'Unlocks must be a whole number.'
      if (n < 0) return 'Unlocks cannot be negative.'
      return undefined
    }
    case 'study_hours':
      return hours(value, 'your study hours')
    case 'physical_activity_hours':
      return hours(value, 'your physical activity hours')
    case 'sleep_hours_per_night':
      return hours(value, 'your sleep hours')
    case 'stress_level':
      return oneOf(STRESS_LEVELS, value, 'Choose a stress level.')
  }
}

export function validateFields(names: readonly FieldName[], form: FormState) {
  const errors: Partial<Record<FieldName, string>> = {}
  for (const name of names) {
    const message = validateField(name, form[name])
    if (message) errors[name] = message
  }
  return errors
}

/** Build the exact backend payload. Call only after validation passes. */
export function toPayload(form: FormState): AssessmentPayload {
  return {
    age: Number(form.age),
    gender: form.gender as AssessmentPayload['gender'],
    country: form.country.trim(),
    academic_level: form.academic_level as AssessmentPayload['academic_level'],
    most_used_platform: form.most_used_platform,
    purpose_of_use: form.purpose_of_use as AssessmentPayload['purpose_of_use'],
    avg_daily_usage_hours: Number(form.avg_daily_usage_hours),
    daily_unlocks: Number(form.daily_unlocks),
    study_hours: Number(form.study_hours),
    physical_activity_hours: Number(form.physical_activity_hours),
    sleep_hours_per_night: Number(form.sleep_hours_per_night),
    stress_level: form.stress_level as AssessmentPayload['stress_level'],
  }
}

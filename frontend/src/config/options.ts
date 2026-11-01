import type { FieldName } from '../types'

// Values must match the backend's Literal types exactly (case-sensitive).
export const GENDERS = ['Male', 'Female'] as const
export const ACADEMIC_LEVELS = ['High School', 'Undergraduate', 'Graduate'] as const
export const PLATFORMS = [
  'Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter', 'YouTube',
  'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp', 'WeChat',
] as const
export const PURPOSES = ['Networking', 'Education', 'Entertainment', 'News'] as const
export const STRESS_LEVELS = ['Low', 'Medium', 'High', 'Very High'] as const

/**
 * Suggestions only. Any country string is accepted. The backend groups the
 * first nine spelled exactly like this; every other value is grouped as "Other".
 */
export const COUNTRY_SUGGESTIONS = [
  'India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France',
  'Brazil', 'China', 'Japan', 'South Korea', 'Russia', 'Italy', 'Spain', 'Netherlands',
  'Indonesia', 'Pakistan', 'Bangladesh', 'Nigeria', 'South Africa', 'Egypt', 'Philippines',
  'Vietnam', 'Thailand', 'Singapore', 'UAE', 'Saudi Arabia', 'Argentina', 'Sweden', 'Norway',
]

export const FIELD_LABELS: Record<FieldName, string> = {
  age: 'Age',
  gender: 'Gender',
  country: 'Country',
  academic_level: 'Academic level',
  most_used_platform: 'Most used platform',
  purpose_of_use: 'Main purpose of use',
  avg_daily_usage_hours: 'Daily social media use',
  daily_unlocks: 'Daily phone unlocks',
  study_hours: 'Study hours',
  physical_activity_hours: 'Physical activity',
  sleep_hours_per_night: 'Sleep per night',
  stress_level: 'Stress level',
}

export const STEPS = [
  {
    key: 'personal',
    title: 'Personal information',
    short: 'About you',
    blurb: 'Basic details the model uses as context.',
    fields: ['age', 'gender', 'country', 'academic_level'] as FieldName[],
  },
  {
    key: 'digital',
    title: 'Digital behaviour',
    short: 'Digital habits',
    blurb: 'How you use social media and your phone on a typical day.',
    fields: ['most_used_platform', 'purpose_of_use', 'avg_daily_usage_hours', 'daily_unlocks'] as FieldName[],
  },
  {
    key: 'lifestyle',
    title: 'Lifestyle',
    short: 'Lifestyle',
    blurb: 'Daily routines outside of screens.',
    fields: ['study_hours', 'physical_activity_hours', 'sleep_hours_per_night', 'stress_level'] as FieldName[],
  },
] as const

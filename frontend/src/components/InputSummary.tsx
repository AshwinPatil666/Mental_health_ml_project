import { Pencil } from 'lucide-react'
import { FIELD_LABELS, STEPS } from '../config/options'
import type { AssessmentPayload } from '../types'

const UNITS: Partial<Record<keyof AssessmentPayload, string>> = {
  avg_daily_usage_hours: 'h / day',
  study_hours: 'h / day',
  physical_activity_hours: 'h / day',
  sleep_hours_per_night: 'h / night',
  daily_unlocks: 'unlocks',
}

interface Props {
  payload: AssessmentPayload
  onEdit?: (stepIndex: number) => void
}

export default function InputSummary({ payload, onEdit }: Props) {
  return (
    <div className="space-y-6">
      {STEPS.map((step, i) => (
        <section key={step.key} aria-labelledby={`sum-${step.key}`}>
          <div className="mb-2 flex items-center justify-between">
            <h3 id={`sum-${step.key}`} className="text-base font-semibold">
              {step.title}
            </h3>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-lav-700 hover:bg-lav-50"
              >
                <Pencil size={14} aria-hidden /> Edit<span className="sr-only"> {step.title}</span>
              </button>
            )}
          </div>
          <dl className="divide-y divide-line rounded-2xl border border-line">
            {step.fields.map((f) => (
              <div key={f} className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm">
                <dt className="text-muted">{FIELD_LABELS[f]}</dt>
                <dd className="text-right font-medium">
                  {String(payload[f])}
                  {UNITS[f] && <span className="ml-1 font-normal text-muted">{UNITS[f]}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, LoaderCircle, Send, TriangleAlert, WifiOff } from 'lucide-react'
import { NumberField, RadioGroup, SelectField, TextField } from '../components/fields'
import Stepper from '../components/Stepper'
import InputSummary from '../components/InputSummary'
import ResultView from '../components/ResultView'
import {
  ACADEMIC_LEVELS, COUNTRY_SUGGESTIONS, GENDERS, PLATFORMS, PURPOSES, STEPS, STRESS_LEVELS,
} from '../config/options'
import { EMPTY_FORM, toPayload, validateField, validateFields } from '../lib/validation'
import { addHistory } from '../lib/history'
import { ApiError, predictMentalHealthScore } from '../services/api'
import type { AssessmentPayload, FieldName, FormState } from '../types'

type Errors = Partial<Record<FieldName, string>>
const REVIEW = STEPS.length
const STEPPER_LABELS = [...STEPS.map((s) => s.short), 'Review']

export default function Assessment() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [result, setResult] = useState<{ score: number; payload: AssessmentPayload } | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [step, result])

  const set = (name: FieldName) => (value: string) => {
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: validateField(name, value) }))
  }
  const blur = (name: FieldName) => () => {
    if (form[name] !== '') setErrors((e) => ({ ...e, [name]: validateField(name, form[name]) }))
  }
  const common = (name: FieldName) => ({ name, value: form[name], error: errors[name], onChange: set(name) })
  const common2 = (name: FieldName) => ({ ...common(name), onBlur: blur(name) })

  const focusFirstInvalid = () =>
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>('input[aria-invalid="true"], select[aria-invalid="true"], fieldset[aria-invalid="true"] input')
        ?.focus(),
    )

  const next = () => {
    const errs = validateFields(STEPS[step].fields, form)
    setErrors((e) => ({ ...e, ...errs }))
    if (Object.keys(errs).length) return focusFirstInvalid()
    setApiError(null)
    setStep(step + 1)
  }

  const submit = async () => {
    // Validate everything again so the payload is guaranteed to match the contract.
    const allFields = STEPS.flatMap((s) => s.fields)
    const errs = validateFields(allFields, form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      setStep(STEPS.findIndex((s) => s.fields.some((f) => errs[f])))
      return
    }
    const payload = toPayload(form)
    setLoading(true)
    setApiError(null)
    try {
      const res = await predictMentalHealthScore(payload)
      addHistory(res.predicted_mental_health_score, payload)
      setResult({ score: res.predicted_mental_health_score, payload })
    } catch (err) {
      const e = err instanceof ApiError ? err : new ApiError('server', 'Something unexpected went wrong.')
      setApiError(e)
      if (e.kind === 'validation' && Object.keys(e.fieldErrors).length) {
        setErrors(e.fieldErrors)
        const idx = STEPS.findIndex((s) => s.fields.some((f) => e.fieldErrors[f]))
        if (idx >= 0) setStep(idx)
      }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setApiError(null)
    setResult(null)
    setStep(0)
  }

  if (result) {
    return (
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="mb-6 text-3xl font-semibold outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-4xl">
          Your result
        </h1>
        <ResultView score={result.score} payload={result.payload} onReset={reset} />
      </div>
    )
  }

  const meta = step < REVIEW ? STEPS[step] : null

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Stepper labels={STEPPER_LABELS} current={step} onSelect={(i) => !loading && setStep(i)} />
      </div>

      <form
        className="card relative animate-rise p-6 sm:p-9"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (step === REVIEW) void submit()
          else next()
        }}
      >
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-3xl">
          {meta ? meta.title : 'Review your answers'}
        </h1>
        <p className="mb-7 mt-1.5 text-[15px] text-muted">
          {meta ? meta.blurb : 'Check everything below. These exact values are sent to the model.'}
        </p>

        {apiError && <ErrorBanner error={apiError} />}

        <div key={step} className="animate-slidein">
        {step === 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField {...common2('age')} label="Age" hint="Whole number from 10 to 100." unit="years" min={10} max={100} step={1} placeholder="22" />
            <RadioGroup {...common('gender')} label="Gender" hint="The model was trained on these two options." options={GENDERS} />
            <div className="sm:col-span-2">
              <TextField
                {...common2('country')}
                label="Country"
                hint="Type any country. Suggestions are optional."
                suggestions={COUNTRY_SUGGESTIONS}
                autoComplete="country-name"
                placeholder="India"
              />
            </div>
            <div className="sm:col-span-2">
              <RadioGroup {...common('academic_level')} label="Academic level" options={ACADEMIC_LEVELS} columns="grid-cols-1 sm:grid-cols-3" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <SelectField {...common2('most_used_platform')} label="Most used platform" hint="The one you open most often." options={PLATFORMS} placeholder="Choose a platform" />
            <SelectField {...common2('purpose_of_use')} label="Main purpose of use" hint="Why you mostly use it." options={PURPOSES} placeholder="Choose a purpose" />
            <NumberField {...common2('avg_daily_usage_hours')} label="Daily social media use" hint="Average hours per day, 0 to 24." unit="hours" min={0} max={24} step={0.1} placeholder="5.5" />
            <NumberField {...common2('daily_unlocks')} label="Daily phone unlocks" hint="How many times you unlock your phone per day." unit="unlocks" min={0} step={1} placeholder="80" />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField {...common2('study_hours')} label="Study hours" hint="Average hours per day, 0 to 24." unit="hours" min={0} max={24} step={0.1} placeholder="4" />
            <NumberField {...common2('physical_activity_hours')} label="Physical activity" hint="Average hours per day, 0 to 24." unit="hours" min={0} max={24} step={0.1} placeholder="1" />
            <NumberField {...common2('sleep_hours_per_night')} label="Sleep per night" hint="Average hours per night, 0 to 24." unit="hours" min={0} max={24} step={0.1} placeholder="7" />
            <div className="sm:col-span-2">
              <RadioGroup {...common('stress_level')} label="Stress level" hint="How stressed you generally feel." options={STRESS_LEVELS} columns="grid-cols-2 sm:grid-cols-4" />
            </div>
          </div>
        )}

        {step === REVIEW && <InputSummary payload={toPayload(form)} onEdit={setStep} />}
        </div>

        {loading && (
          <div
            aria-hidden
            className="absolute inset-0 z-10 grid animate-pop place-items-center rounded-3xl bg-white/85 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <span className="relative grid h-14 w-14 place-items-center">
                <span className="absolute inset-0 animate-glow rounded-full bg-gradient-to-br from-lav-500 to-sky-500 opacity-30 blur-md" />
                <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-lav-100 border-t-lav-600" />
              </span>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                Running the model
                <span className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-dots rounded-full bg-lav-600" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="mt-9 flex items-center justify-between gap-3 border-t border-line pt-6">
          <button type="button" className="btn-secondary" disabled={step === 0 || loading} onClick={() => setStep(step - 1)}>
            <ArrowLeft size={16} aria-hidden /> Previous
          </button>
          {step < REVIEW ? (
            <button type="submit" className="btn-primary">
              {step === REVIEW - 1 ? 'Review answers' : 'Next'} <ArrowRight size={16} aria-hidden />
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" aria-hidden /> Getting prediction…
                </>
              ) : (
                <>
                  <Send size={16} aria-hidden /> {apiError ? 'Try again' : 'Get prediction'}
                </>
              )}
            </button>
          )}
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {loading ? 'Waiting for the prediction from the server.' : ''}
        </p>
      </form>
    </div>
  )
}

function ErrorBanner({ error }: { error: ApiError }) {
  const offline = error.kind === 'network' || error.kind === 'timeout'
  const title =
    error.kind === 'validation'
      ? 'The server rejected some answers'
      : offline
        ? 'Cannot reach the backend'
        : error.kind === 'invalid-response'
          ? 'Unexpected response from the server'
          : 'The server hit an error'
  const help =
    error.kind === 'validation'
      ? 'Fix the highlighted fields and submit again.'
      : offline
        ? 'Check that the FastAPI server is running and VITE_API_BASE_URL points to it, then try again.'
        : 'Nothing was predicted. Try again in a moment.'
  return (
    <div role="alert" className="mb-7 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      {offline ? <WifiOff size={18} className="mt-0.5 shrink-0" aria-hidden /> : <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden />}
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 leading-relaxed">{error.message}</p>
        <p className="mt-1 leading-relaxed">{help}</p>
      </div>
    </div>
  )
}

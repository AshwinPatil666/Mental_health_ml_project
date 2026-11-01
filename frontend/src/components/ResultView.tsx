import { Link } from 'react-router-dom'
import { RotateCcw, LayoutDashboard } from 'lucide-react'
import type { AssessmentPayload } from '../types'
import InputSummary from './InputSummary'
import Disclaimer from './Disclaimer'
import CountUp from './CountUp'

interface Props {
  score: number
  payload: AssessmentPayload
  onReset: () => void
}

export default function ResultView({ score, payload, onReset }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section
        aria-labelledby="result-title"
        className="card gradient-border relative animate-rise overflow-hidden p-8 shadow-lift sm:p-10 lg:col-span-3"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-24 h-72 w-72 animate-glow rounded-full bg-gradient-to-br from-lav-100 via-sky-100 to-transparent blur-2xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 animate-drift rounded-full bg-lav-100/60 blur-3xl" />
        </div>
        <div className="relative">
          <h2 id="result-title" className="text-base font-semibold text-muted">
            Predicted mental health score
          </h2>
          <p
            className="mt-3 bg-gradient-to-br from-lav-700 to-sky-600 bg-clip-text font-display text-[clamp(4.5rem,14vw,8rem)] font-bold leading-none tracking-tight text-transparent"
            aria-label={`Predicted score ${score.toFixed(2)}`}
          >
            <CountUp value={score} />
          </p>
          <p className="mt-6 max-w-md animate-rise text-[15px] leading-relaxed text-muted" style={{ animationDelay: '500ms' }}>
            This is the value returned by the model for the answers you submitted. The model's score scale has not
            been verified, so this page does not label it as low, moderate or high.
          </p>

          <div className="mt-8 flex animate-rise flex-wrap gap-3" style={{ animationDelay: '650ms' }}>
            <button type="button" onClick={onReset} className="btn-primary">
              <RotateCcw size={16} aria-hidden /> Take another assessment
            </button>
            <Link to="/" className="btn-secondary">
              <LayoutDashboard size={16} aria-hidden /> Back to dashboard
            </Link>
          </div>
        </div>
        <Disclaimer className="relative mt-8 animate-rise" />
      </section>

      <section
        aria-labelledby="answers-title"
        className="card animate-rise p-6 sm:p-7 lg:col-span-2"
        style={{ animationDelay: '150ms' }}
      >
        <h2 id="answers-title" className="mb-4 text-xl font-semibold">
          Answers sent to the model
        </h2>
        <InputSummary payload={payload} />
      </section>
    </div>
  )
}

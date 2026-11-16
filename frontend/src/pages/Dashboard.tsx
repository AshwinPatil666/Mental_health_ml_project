import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BrainCircuit, Moon, Smartphone, Trash2, UserRound } from 'lucide-react'
import Disclaimer from '../components/Disclaimer'
import Reveal from '../components/Reveal'
import CountUp from '../components/CountUp'
import { clearHistory, loadHistory } from '../lib/history'

// Recharts is only needed once real history exists, so load it on demand.
const ScoreTrend = lazy(() => import('../components/ScoreTrend'))

const groups = [
  { icon: UserRound, title: 'Personal', items: 'Age, gender, country, academic level' },
  { icon: Smartphone, title: 'Digital behaviour', items: 'Platform, purpose, daily use, unlocks' },
  { icon: Moon, title: 'Lifestyle', items: 'Study, activity, sleep, stress level' },
]

const steps = [
  { title: 'Answer twelve questions', body: 'Three short steps cover who you are, how you use your phone, and your daily routine.' },
  { title: 'The backend runs the model', body: 'Your answers are sent to a FastAPI service, which feeds them to a trained scikit-learn pipeline.' },
  { title: 'Read one predicted score', body: 'You get the number the model returns. Nothing is added or interpreted on top of it.' },
]

const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const delay = (ms: number) => ({ animationDelay: `${ms}ms` })

export default function Dashboard() {
  const [history, setHistory] = useState(loadHistory)
  const latest = history[0]

  return (
    <div className="space-y-16">
      <section className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 -top-12 -z-10 h-[480px]" />

        <div>
          <h1 className="animate-rise text-[clamp(2.25rem,5.5vw,3.75rem)] font-bold leading-[1.05]" style={delay(60)}>
            See how your daily habits relate to a predicted mental health score
          </h1>
          <p className="mt-5 max-w-xl animate-rise text-lg leading-relaxed text-muted" style={delay(180)}>
            Welcome to Mindmetrics, a student machine learning project. Share how you use social media, sleep, study
            and handle stress, and a trained model returns a single predicted score.
          </p>
          <div className="mt-8 flex animate-rise flex-wrap gap-3" style={delay(300)}>
            <Link to="/assessment" className="btn-primary">
              Start assessment <ArrowRight size={16} aria-hidden />
            </Link>
            <Link to="/about" className="btn-secondary">
              How it works
            </Link>
          </div>
        </div>

        <div className="animate-rise" style={delay(240)}>
          <div className="card gradient-border animate-float p-6 shadow-lift sm:p-7" aria-labelledby="flow-title">
            <h2 id="flow-title" className="text-lg font-semibold">
              What goes in, what comes out
            </h2>
            <ul className="mt-4 space-y-2.5">
              {groups.map(({ icon: Icon, title, items }, i) => (
                <li
                  key={title}
                  className="flex animate-rise items-start gap-3 rounded-2xl bg-mist p-3.5 transition-colors hover:bg-lav-50"
                  style={delay(450 + i * 110)}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-lav-600 shadow-card">
                    <Icon size={18} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-[13px] text-muted">{items}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="my-3 flex justify-center text-lav-300" aria-hidden>
              <ArrowRight size={20} className="animate-nudge rotate-90" />
            </div>
            <div
              className="relative animate-rise overflow-hidden rounded-2xl bg-gradient-to-r from-lav-600 to-sky-600 p-4 text-white"
              style={delay(800)}
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="relative flex items-center gap-3">
                <BrainCircuit size={22} aria-hidden />
                <div>
                  <p className="text-sm font-semibold">Predicted mental health score</p>
                  <p className="text-[13px] text-white/85">One number returned by the model</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {latest ? (
        <section aria-labelledby="latest-title" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <Reveal>
              <div className="card card-hover h-full p-7">
                <h2 id="latest-title" className="text-base font-semibold text-muted">
                  Latest prediction
                </h2>
                <p className="mt-2 bg-gradient-to-br from-lav-700 to-sky-600 bg-clip-text font-display text-7xl font-bold leading-none tracking-tight text-transparent">
                  <CountUp value={latest.score} />
                </p>
                <p className="mt-3 text-sm text-muted">{fmt(latest.createdAt)}</p>
                <Link to="/assessment" className="btn-secondary mt-6">
                  New assessment
                </Link>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="card card-hover h-full p-7">
                <h2 className="text-base font-semibold">Score history</h2>
                {history.length > 1 ? (
                  <Suspense fallback={<div className="h-[230px]" aria-hidden />}>
                    <ScoreTrend entries={history} />
                  </Suspense>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Complete one more assessment and your scores will be charted here.
                  </p>
                )}
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-6 pb-4">
                <div>
                  <h2 className="text-xl font-semibold">Assessment history</h2>
                  <p className="mt-0.5 text-[13px] text-muted">
                    Saved only in this browser. The backend does not store results.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    clearHistory()
                    setHistory([])
                  }}
                >
                  <Trash2 size={15} aria-hidden /> Clear
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-mist text-muted">
                    <tr>
                      {['Date', 'Score', 'Platform', 'Use (h/day)', 'Sleep (h)', 'Stress'].map((h) => (
                        <th key={h} scope="col" className="px-6 py-2.5 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {history.map((e) => (
                      <tr key={e.id} className="transition-colors hover:bg-lav-50/60">
                        <td className="px-6 py-3 text-muted">{fmt(e.createdAt)}</td>
                        <td className="px-6 py-3 font-semibold">{e.score.toFixed(2)}</td>
                        <td className="px-6 py-3">{e.payload.most_used_platform}</td>
                        <td className="px-6 py-3">{e.payload.avg_daily_usage_hours}</td>
                        <td className="px-6 py-3">{e.payload.sleep_hours_per_night}</td>
                        <td className="px-6 py-3">{e.payload.stress_level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </section>
      ) : (
        <Reveal>
          <section aria-labelledby="empty-title" className="card flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="empty-title" className="text-xl font-semibold">
                No assessments yet
              </h2>
              <p className="mt-1 text-[15px] text-muted">Your predictions will appear here after you complete one.</p>
            </div>
            <Link to="/assessment" className="btn-primary shrink-0">
              Start assessment
            </Link>
          </section>
        </Reveal>
      )}

      <section aria-labelledby="how-title">
        <Reveal>
          <h2 id="how-title" className="text-2xl font-semibold sm:text-3xl">
            How the prediction works
          </h2>
        </Reveal>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 120} className="h-full">
                <div className="card card-hover h-full p-6">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-lav-50 text-sm font-semibold text-lav-700">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <Reveal>
        <Disclaimer />
      </Reveal>
    </div>
  )
}

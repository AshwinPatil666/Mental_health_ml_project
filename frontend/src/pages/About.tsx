import { Link } from 'react-router-dom'
import Disclaimer from '../components/Disclaimer'
import { FIELD_LABELS, STEPS } from '../config/options'

const limitations = [
  'The model learns statistical patterns from a survey dataset. A pattern across many people says little about any one person.',
  'It uses only twelve inputs. Many things that shape mental health, such as relationships, health history and life events, are not included.',
  'Answers are self-reported and may be inaccurate. The model cannot tell.',
  'The scale of the predicted score has not been verified, so this app shows the raw number without risk labels.',
  'The training data may not represent your age group, culture or country. Countries outside the model’s main list are grouped as "Other".',
]

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header className="animate-rise">
        <h1 className="text-4xl font-bold sm:text-5xl">About this project</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Mindmetrics is a student machine learning project. It takes a short questionnaire about your habits and
          returns one number: a predicted mental health score from a trained model.
        </p>
      </header>

      <Disclaimer />

      <section aria-labelledby="features">
        <h2 id="features" className="text-2xl font-semibold">
          What the model uses
        </h2>
        <p className="mt-2 text-[15px] text-muted">Twelve inputs, collected in three groups.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.key} className="card card-hover p-5">
              <h3 className="text-base font-semibold">{s.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {s.fields.map((f) => (
                  <li key={f}>{FIELD_LABELS[f]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="workflow">
        <h2 id="workflow" className="text-2xl font-semibold">
          How the prediction workflow works
        </h2>
        <ol className="mt-5 space-y-4">
          {[
            'You complete the three-step form. Each field is checked in the browser against the ranges the backend accepts.',
            'The app sends your answers as JSON to the POST /predict endpoint of the FastAPI backend.',
            'The backend checks the request again, groups your country, and passes the data to a saved scikit-learn pipeline.',
            'The pipeline returns a number, which the backend rounds to two decimals and sends back. This page shows it unchanged.',
          ].map((t, i) => (
            <li key={i} className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lav-50 text-sm font-semibold text-lav-700">
                {i + 1}
              </span>
              <p className="pt-1 text-[15px] leading-relaxed">{t}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="limits">
        <h2 id="limits" className="text-2xl font-semibold">
          Limitations of ML-based mental health predictions
        </h2>
        <ul className="mt-5 list-disc space-y-3 pl-5 text-[15px] leading-relaxed marker:text-lav-500">
          {limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="mt-6 text-[15px] leading-relaxed text-muted">
          If you are worried about your mental health, please talk to a qualified professional or someone you trust.
        </p>
      </section>

      <div>
        <Link to="/assessment" className="btn-primary">
          Start assessment
        </Link>
      </div>
    </div>
  )
}

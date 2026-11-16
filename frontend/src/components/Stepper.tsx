import { Check } from 'lucide-react'

interface Props {
  labels: string[]
  current: number
  onSelect?: (index: number) => void
}

export default function Stepper({ labels, current, onSelect }: Props) {
  return (
    <nav aria-label="Assessment progress">
      <p className="mb-3 text-sm font-medium text-muted sm:hidden">
        Step {current + 1} of {labels.length}: <span className="text-ink">{labels[current]}</span>
      </p>
      <ol className="flex items-center">
        {labels.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={label} className={`flex items-center ${i < labels.length - 1 ? 'flex-1' : ''}`}>
              <button
                type="button"
                disabled={!done}
                onClick={() => onSelect?.(i)}
                aria-current={active ? 'step' : undefined}
                className="group flex items-center gap-2.5 rounded-full disabled:cursor-default"
              >
                <span
                  className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-all duration-300 ${
                    done
                      ? 'scale-100 bg-lav-600 text-white'
                      : active
                        ? 'scale-105 bg-gradient-to-br from-lav-600 to-sky-600 text-white shadow-lift'
                        : 'border border-line bg-white text-muted'
                  }`}
                >
                  {active && (
                    <span aria-hidden className="absolute -inset-1 animate-glow rounded-full ring-4 ring-lav-500/25" />
                  )}
                  {done ? <Check size={16} aria-hidden className="animate-pop" /> : i + 1}
                  {done && <span className="sr-only">completed, </span>}
                </span>
                <span
                  className={`hidden text-sm font-medium transition-colors sm:inline ${active ? 'text-ink' : 'text-muted'}`}
                >
                  {label}
                </span>
              </button>
              {i < labels.length - 1 && (
                <span aria-hidden className="relative mx-3 h-0.5 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className={`absolute inset-0 origin-left rounded-full bg-gradient-to-r from-lav-500 to-sky-500 transition-transform duration-500 ease-out ${
                      done ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

import { useId, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

interface ShellProps {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

function Shell({ id, label, hint, error, children }: ShellProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mb-2 text-[13px] leading-snug text-muted">
          {hint}
        </p>
      )}
      {children}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-red-600">
      <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
      {message}
    </p>
  )
}

const describe = (id: string, hint?: string, error?: string) =>
  [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined

interface NumberFieldProps {
  name: string
  label: string
  hint?: string
  unit?: string
  value: string
  error?: string
  min?: number
  max?: number
  step?: number | string
  placeholder?: string
  onChange: (value: string) => void
  onBlur?: () => void
}

export function NumberField({ name, label, hint, unit, value, error, min, max, step = 'any', placeholder, onChange, onBlur }: NumberFieldProps) {
  const id = useId()
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="number"
          inputMode="decimal"
          className={`input ${unit ? 'pr-16' : ''}`}
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={describe(id, hint, error)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-muted">{unit}</span>
        )}
      </div>
    </Shell>
  )
}

interface TextFieldProps {
  name: string
  label: string
  hint?: string
  value: string
  error?: string
  placeholder?: string
  suggestions?: string[]
  autoComplete?: string
  onChange: (value: string) => void
  onBlur?: () => void
}

export function TextField({ name, label, hint, value, error, placeholder, suggestions, autoComplete, onChange, onBlur }: TextFieldProps) {
  const id = useId()
  const listId = `${id}-list`
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        name={name}
        type="text"
        className="input"
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        list={suggestions ? listId : undefined}
        aria-invalid={!!error}
        aria-describedby={describe(id, hint, error)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </Shell>
  )
}

interface SelectFieldProps {
  name: string
  label: string
  hint?: string
  value: string
  error?: string
  options: readonly string[]
  placeholder?: string
  onChange: (value: string) => void
  onBlur?: () => void
}

export function SelectField({ name, label, hint, value, error, options, placeholder = 'Select…', onChange, onBlur }: SelectFieldProps) {
  const id = useId()
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        name={name}
        className="input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235B5E82%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10"
        value={value}
        aria-invalid={!!error}
        aria-describedby={describe(id, hint, error)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Shell>
  )
}

interface RadioGroupProps {
  name: string
  label: string
  hint?: string
  value: string
  error?: string
  options: readonly string[]
  columns?: string
  onChange: (value: string) => void
}

export function RadioGroup({ name, label, hint, value, error, options, columns = 'grid-cols-2', onChange }: RadioGroupProps) {
  const id = useId()
  return (
    <fieldset aria-describedby={describe(id, hint, error)} aria-invalid={!!error}>
      <legend className="mb-1 text-sm font-semibold">{label}</legend>
      {hint && (
        <p id={`${id}-hint`} className="mb-2 text-[13px] leading-snug text-muted">
          {hint}
        </p>
      )}
      <div className={`grid gap-2 ${columns}`}>
        {options.map((o) => (
          <label key={o} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
              className="peer sr-only"
            />
            <span
              className={`flex min-h-[44px] items-center justify-center rounded-xl border px-3 text-center text-sm font-medium transition hover:border-lav-300 peer-checked:border-lav-500 peer-checked:bg-lav-50 peer-checked:text-lav-700 peer-checked:shadow-[inset_0_0_0_1px_#7C6CF0] peer-focus-visible:ring-2 peer-focus-visible:ring-lav-500 peer-focus-visible:ring-offset-2 ${
                error ? 'border-red-400' : 'border-line'
              }`}
            >
              {o}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={`${id}-err`} message={error} />
    </fieldset>
  )
}

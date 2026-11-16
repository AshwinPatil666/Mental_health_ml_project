import { Info } from 'lucide-react'

export const DISCLAIMER_TEXT =
  'This is an educational machine learning project. Its output is not a clinical diagnosis and should not replace professional mental health assessment.'

export default function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`flex gap-3 rounded-2xl border border-lav-100 bg-lav-50/70 p-4 text-sm leading-relaxed text-ink ${className}`}
      aria-label="Disclaimer"
    >
      <Info size={18} className="mt-0.5 shrink-0 text-lav-600" aria-hidden />
      <p>{DISCLAIMER_TEXT}</p>
    </aside>
  )
}

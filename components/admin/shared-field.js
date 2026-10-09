'use client'

export default function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.28em] text-ink/60 mb-1">{label}</div>
      {children}
    </label>
  )
}

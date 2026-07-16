"use client"

import { useMemo, useState } from "react"
import { Check, X } from "lucide-react"
import type { ControlledOption } from "@/lib/kleio-form-options"

export function ControlledSelect({ label, value, onChange, options, locale = "en", required, helper }: { label: string; value: string; onChange: (value: string) => void; options: ControlledOption[]; locale?: "en" | "es"; required?: boolean; helper?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required ? " *" : ""}</span><select value={value} onChange={(event) => onChange(event.target.value)} required={required} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"><option value="">{locale === "es" ? "Selecciona una opción" : "Select an option"}</option>{options.map((option) => <option key={option.value} value={option.value}>{locale === "es" ? option.labelEs ?? option.label : option.label}</option>)}</select>{helper && <span className="mt-1 block text-[0.65rem] text-muted-foreground">{helper}</span>}</label>
}

export function ControlledMultiSelect({ label, values, onChange, options, locale = "en", required, helper, allowOther = true }: { label: string; values: string[]; onChange: (values: string[]) => void; options: ControlledOption[]; locale?: "en" | "es"; required?: boolean; helper?: string; allowOther?: boolean }) {
  const [query, setQuery] = useState("")
  const [other, setOther] = useState("")
  const filtered = useMemo(() => options.filter((option) => `${option.label} ${option.labelEs ?? ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12), [options, query])
  const toggle = (value: string) => onChange(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value])
  const addOther = () => {
    const clean = other.trim().replace(/\s+/g, " ")
    if (clean && !values.includes(clean)) onChange([...values, clean])
    setOther("")
  }
  return <fieldset className="block"><legend className="mb-1.5 text-xs font-medium text-muted-foreground">{label}{required ? " *" : ""}</legend><div className="rounded-xl border border-border bg-background p-2 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">{values.length > 0 && <div className="mb-2 flex flex-wrap gap-1.5">{values.map((value) => { const option = options.find((entry) => entry.value === value); const display = locale === "es" ? option?.labelEs ?? option?.label ?? value : option?.label ?? value; return <button type="button" key={value} onClick={() => toggle(value)} className="inline-flex items-center gap-1 rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-medium text-[#5B4B8A]">{display}<X className="size-3" aria-hidden /></button> })}</div>}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "es" ? "Buscar opciones…" : "Search options…"} className="h-9 w-full border-0 bg-transparent px-2 text-sm outline-none" /><div className="mt-1 max-h-48 overflow-auto rounded-lg border border-border">{filtered.map((option) => { const active = values.includes(option.value); return <button type="button" key={option.value} onClick={() => toggle(option.value)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent/50"><span>{locale === "es" ? option.labelEs ?? option.label : option.label}</span>{active && <Check className="size-4 text-primary" aria-hidden />}</button> })}{filtered.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">{locale === "es" ? "No hay opciones coincidentes." : "No matching options."}</p>}</div>{allowOther && <div className="mt-2 flex gap-2"><input value={other} onChange={(event) => setOther(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addOther() } }} placeholder={locale === "es" ? "Otra opción" : "Other option"} className="h-9 min-w-0 flex-1 rounded-lg border border-border px-2 text-sm outline-none" /><button type="button" onClick={addOther} className="rounded-lg border border-border px-3 text-xs font-semibold">{locale === "es" ? "Añadir" : "Add"}</button></div>}</div>{helper && <p className="mt-1 text-[0.65rem] text-muted-foreground">{helper}</p>}</fieldset>
}

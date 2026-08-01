"use client"

import type { ChangeEvent, ReactNode } from "react"
import { Check, ChevronLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type OnboardingOption = {
  value: string
  label: string
  description?: string
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabel,
  savedLabel,
}: {
  currentStep: number
  totalSteps: number
  stepLabel: string
  savedLabel?: string
}) {
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100)

  return (
    <div className="mb-7" aria-label={stepLabel}>
      <div className="mb-3 flex items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
        <span>{stepLabel}</span>
        {savedLabel ? <span role="status" aria-live="polite">{savedLabel}</span> : null}
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-border/80"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep + 1}
        aria-valuetext={stepLabel}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function OnboardingQuestion({
  title,
  description,
  optional,
  optionalLabel = "Optional",
  children,
}: {
  title: string
  description?: string
  optional?: boolean
  optionalLabel?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby="onboarding-question-title">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="onboarding-question-title" className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          {optional ? (
            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {optionalLabel}
            </span>
          ) : null}
        </div>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function OnboardingChoiceGroup({
  legend,
  options,
  value,
  values,
  onChange,
  onValuesChange,
  multiple = false,
  columns = 2,
}: {
  legend: string
  options: OnboardingOption[]
  value?: string
  values?: string[]
  onChange?: (value: string) => void
  onValuesChange?: (values: string[]) => void
  multiple?: boolean
  columns?: 1 | 2 | 3
}) {
  const selectedValues = values ?? []
  const gridClassName =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2"

  function toggle(optionValue: string) {
    if (!multiple) {
      onChange?.(optionValue)
      return
    }
    const next = selectedValues.includes(optionValue)
      ? selectedValues.filter((entry) => entry !== optionValue)
      : [...selectedValues, optionValue]
    onValuesChange?.(next)
  }

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={cn("grid gap-3", gridClassName)}>
        {options.map((option) => {
          const selected = multiple ? selectedValues.includes(option.value) : value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "group relative flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border bg-background p-4 text-left transition-[border-color,box-shadow,background-color,transform] duration-200",
                "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm motion-reduce:hover:translate-y-0",
                "focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10",
                selected && "border-primary/50 bg-primary/[0.055] shadow-[0_10px_30px_-24px_oklch(0.45_0.16_287)]",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={multiple ? undefined : legend}
                value={option.value}
                checked={selected}
                onChange={() => toggle(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center border transition-colors",
                  multiple ? "rounded-md" : "rounded-full",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-transparent",
                )}
              >
                <Check className="size-3.5" strokeWidth={2.5} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                {option.description ? (
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
                ) : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function OnboardingTextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  autoComplete,
  disabled,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email" | "url" | "password"
  placeholder?: string
  required?: boolean
  autoComplete?: string
  disabled?: boolean
  hint?: string
}) {
  return (
    <label htmlFor={id} className="grid gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground"
      />
      {hint ? <span className="text-[0.68rem] leading-5 text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export function OnboardingNavigation({
  onBack,
  onNext,
  onSkip,
  backLabel,
  nextLabel,
  skipLabel,
  submitting,
  disabled,
  showBack = true,
}: {
  onBack: () => void
  onNext: () => void
  onSkip?: () => void
  backLabel: string
  nextLabel: string
  skipLabel?: string
  submitting?: boolean
  disabled?: boolean
  showBack?: boolean
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
          >
            <ChevronLeft className="size-4" />
            {backLabel}
          </button>
        ) : null}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        {onSkip && skipLabel ? (
          <button
            type="button"
            onClick={onSkip}
            className="h-11 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
          >
            {skipLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNext}
          disabled={disabled || submitting}
          className="inline-flex h-11 min-w-36 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-[opacity,transform] hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:hover:translate-y-0"
        >
          {submitting ? <Loader2 className="mr-2 size-4 animate-spin motion-reduce:animate-none" /> : null}
          {nextLabel}
        </button>
      </div>
    </div>
  )
}

export function OnboardingReviewList({
  items,
  editLabel,
  onEdit,
}: {
  items: Array<{ label: string; value: string; step: number }>
  editLabel: string
  onEdit: (step: number) => void
}) {
  return (
    <dl className="overflow-hidden rounded-2xl border border-border bg-background">
      {items.map((item) => (
        <div key={`${item.label}-${item.step}`} className="flex flex-col gap-2 border-b border-border px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 break-words text-sm leading-6 text-foreground">{item.value || "—"}</dd>
          </div>
          <button
            type="button"
            onClick={() => onEdit(item.step)}
            className="shrink-0 self-start rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
          >
            {editLabel}
          </button>
        </div>
      ))}
    </dl>
  )
}

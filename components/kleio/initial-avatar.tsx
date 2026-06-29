import { cn } from "@/lib/utils"

const palette = [
  "bg-[oklch(0.92_0.05_287)] text-[oklch(0.42_0.16_287)]",
  "bg-[oklch(0.92_0.05_150)] text-[oklch(0.4_0.13_150)]",
  "bg-[oklch(0.93_0.05_70)] text-[oklch(0.45_0.13_55)]",
  "bg-[oklch(0.92_0.05_25)] text-[oklch(0.46_0.16_25)]",
  "bg-[oklch(0.92_0.05_220)] text-[oklch(0.42_0.13_235)]",
]

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function hashIndex(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h % palette.length
}

export function InitialAvatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium",
        palette[hashIndex(name)],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function normalizeMultilineText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+$/g, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "")
}

export function normalizeSingleLineText(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

export const REQUIREMENT_FILE_TYPE_ALIASES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  "application/pdf": ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  "image/jpeg": ["image/jpeg"],
  png: ["image/png"],
  "image/png": ["image/png"],
  webp: ["image/webp"],
  "image/webp": ["image/webp"],
  doc: ["application/msword"],
  "application/msword": ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel"],
  "application/vnd.ms-excel": ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ppt: ["application/vnd.ms-powerpoint"],
  "application/vnd.ms-powerpoint": ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  csv: ["text/csv", "application/csv", "text/plain"],
  "text/csv": ["text/csv"],
  txt: ["text/plain"],
  "text/plain": ["text/plain"],
  zip: ["application/zip", "application/x-zip-compressed"],
  "application/zip": ["application/zip"],
  mp4: ["video/mp4"],
  "video/mp4": ["video/mp4"],
  mov: ["video/quicktime"],
  "video/quicktime": ["video/quicktime"],
  wmv: ["video/x-ms-wmv", "video/x-ms-asf", "application/vnd.ms-asf"],
  "video/x-ms-wmv": ["video/x-ms-wmv"],
  mp3: ["audio/mpeg", "audio/mp3"],
  "audio/mpeg": ["audio/mpeg"],
  srt: ["application/x-subrip", "text/plain"],
  "application/x-subrip": ["application/x-subrip"],
  vtt: ["text/vtt", "text/plain"],
  "text/vtt": ["text/vtt"],
}

export const SUPPORTED_REQUIREMENT_MIME_TYPES = Array.from(new Set(Object.values(REQUIREMENT_FILE_TYPE_ALIASES).flat()))

function normalizedToken(value: string) {
  return value.trim().toLowerCase().replace(/^\./, "")
}

export function normalizeRequirementFileTypes(values: string[] | null | undefined) {
  const result = new Set<string>()
  for (const value of values ?? []) {
    const token = normalizedToken(value)
    if (!token) continue
    const mapped = REQUIREMENT_FILE_TYPE_ALIASES[token]
    if (mapped) mapped.forEach((mime) => result.add(mime))
    else if (token.includes("/")) result.add(token)
  }
  return Array.from(result)
}

export function requirementFileTypeMatches(actualMimeType: string, accepted: string[] | null | undefined) {
  const normalizedAccepted = normalizeRequirementFileTypes(accepted)
  if (!normalizedAccepted.length) return null
  const actual = actualMimeType.trim().toLowerCase()
  return normalizedAccepted.includes(actual)
}

export function requirementFileTypeLabel(values: string[] | null | undefined) {
  const clean = Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)))
  return clean.length ? clean.join(", ") : "Format not stated by source"
}

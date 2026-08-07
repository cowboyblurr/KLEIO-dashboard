import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const types = fs.readFileSync(path.join(root, "lib/kleio-requirement-file-types.ts"), "utf8")
const upload = fs.readFileSync(path.join(root, "lib/kleio-requirement-file-upload.ts"), "utf8")
const signatures = fs.readFileSync(path.join(root, "lib/kleio-media-file-types.ts"), "utf8")
const surface = fs.readFileSync(path.join(root, "components/kleio/application-requirement-media.tsx"), "utf8")
const picker = fs.readFileSync(path.join(root, "components/kleio/application-requirement-file-picker.tsx"), "utf8")
const failures = []

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message)
}

for (const [label, mimePattern] of [
  ["pdf", /pdf:[\s\S]*application\/pdf/],
  ["doc", /doc:[\s\S]*application\/msword/],
  ["docx", /docx:[\s\S]*wordprocessingml\.document/],
  ["xls", /xls:[\s\S]*application\/vnd\.ms-excel/],
  ["xlsx", /xlsx:[\s\S]*spreadsheetml\.sheet/],
  ["ppt", /ppt:[\s\S]*application\/vnd\.ms-powerpoint/],
  ["pptx", /pptx:[\s\S]*presentationml\.presentation/],
  ["csv", /csv:[\s\S]*text\/csv/],
  ["zip", /zip:[\s\S]*application\/zip/],
  ["mp4", /mp4:[\s\S]*video\/mp4/],
  ["mov", /mov:[\s\S]*video\/quicktime/],
  ["wmv", /wmv:[\s\S]*video\/x-ms-wmv/],
  ["mp3", /mp3:[\s\S]*audio\/mpeg/],
  ["srt", /srt:[\s\S]*application\/x-subrip/],
  ["vtt", /vtt:[\s\S]*text\/vtt/],
  ["txt", /txt:[\s\S]*text\/plain/],
]) requirePattern(types, mimePattern, `Missing normalized beta mapping for ${label}.`)

requirePattern(types, /requirementFileTypeMatches/, "Requirement validation needs a shared normalized source-rule matcher.")
requirePattern(types, /Format not stated by source/, "Missing source format must remain explicit instead of inventing PDF/image restrictions.")
requirePattern(surface, /SUPPORTED_REQUIREMENT_MIME_TYPES/, "Requirements without a source-stated format must use the supported private-file set rather than fake source constraints.")
requirePattern(surface, /sourceMimeTypes\.length \? sourceMimeTypes : SUPPORTED_REQUIREMENT_MIME_TYPES/, "Picker must use normalized source formats when present and supported beta formats only as a transparent fallback.")
requirePattern(surface, /Format not stated by source|source does not specify a file format/, "Artist-facing requirement row must disclose when source format is unknown.")
requirePattern(surface, /accepted_file_types: sourceMimeTypes/, "Requirement attachment validation must receive normalized MIME values instead of raw extensions.")
requirePattern(surface, /ApplicationRequirementFilePicker/, "Application requirements must use the dedicated broad beta file picker.")

// Signature/sniffing is intentionally centralized in kleio-media-file-types so every upload
// surface validates the same bytes rather than duplicating weaker checks in requirement upload.
requirePattern(upload, /fileSignatureMatchesKnownMime/, "Requirement uploads must delegate to the shared file-signature validator.")
requirePattern(signatures, /function isZip\(/, "Modern Office and ZIP files need signature validation.")
requirePattern(signatures, /function isOle\(/, "Legacy DOC/XLS/PPT files need compound-file signature validation.")
requirePattern(signatures, /ascii\(bytes, 4, 8\) === "ftyp"/, "MP4/MOV files need container signature validation.")
requirePattern(signatures, /audio\/mpeg/, "MP3 files need signature validation.")
requirePattern(signatures, /video\/x-ms-wmv/, "WMV files need signature validation.")
requirePattern(signatures, /textLooksSafe/, "CSV/TXT/VTT/SRT files need safe text sniffing rather than extension trust alone.")
requirePattern(upload, /requirementFileTypeMatches\(mimeType, input\.sourceAcceptedTypes\)/, "Uploaded files must be rechecked against normalized opportunity source rules.")
requirePattern(upload, /checksum/, "Requirement file uploads must preserve duplicate detection.")
requirePattern(upload, /artist_import_sources/, "Requirement files must enter the existing private source/library model rather than a parallel storage silo.")
requirePattern(picker, /loadRequirementFileLibrary/, "Requirement picker must reuse already-uploaded private files.")
requirePattern(picker, /uploadRequirementFile/, "Requirement picker must support same-page private device upload.")
requirePattern(picker, /does not submit it to the institution/, "Requirement picker must preserve truthful submission language.")

if (failures.length) {
  console.error("KLEIO requirement file compatibility audit failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO requirement file compatibility passed: extension-style source rules normalize to browser MIME types, shared byte-signature validation protects Office/archive/text/audio/video uploads, unspecified formats are disclosed rather than invented, existing private files can be reused, and requirement uploads remain separate from institution submission.")

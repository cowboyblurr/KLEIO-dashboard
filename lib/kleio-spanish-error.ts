export function kleioSpanishError(reason: unknown, fallback = "KLEIO no pudo completar esta acción. Inténtalo de nuevo.") {
  const message = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : ""

  if (/sign in|inicia sesi[oó]n/i.test(message)) return "Inicia sesión para continuar."
  if (/artist workspace|espacio de trabajo.*artista/i.test(message)) return "Esta acción solo está disponible en un espacio de trabajo de artista."
  if (/choose a pdf|selecciona un pdf/i.test(message)) return "Selecciona un documento PDF."
  if (/selected pdf is empty|selected file is empty/i.test(message)) return "El PDF seleccionado está vacío o no está disponible."
  if (/15 mb|file too large/i.test(message)) return "El PDF debe pesar 15 MB o menos."
  if (/valid pdf signature|invalid pdf signature/i.test(message)) return "El archivo seleccionado no parece ser un PDF válido."
  if (/password protected/i.test(message)) return "El PDF está protegido con contraseña. Sube una copia desbloqueada."
  if (/100 pages|too many pages/i.test(message)) return "Esta beta acepta documentos PDF de hasta 100 páginas."
  if (/corrupt|unsupported pdf/i.test(message)) return "El PDF parece estar dañado o usa un formato que KLEIO no puede leer."
  if (/store this document privately|store this document/i.test(message)) return "KLEIO no pudo guardar el documento de forma privada. Inténtalo de nuevo."
  if (/private source record could not be created|source record/i.test(message)) return "El archivo se cargó, pero KLEIO no pudo completar su registro privado. Inténtalo de nuevo."
  if (/source unavailable|original file could not be opened/i.test(message)) return "KLEIO no pudo abrir el archivo original. Comprueba que siga disponible en tu biblioteca privada."
  if (/analy[sz]e|analysis|extract/i.test(message)) return "KLEIO no pudo completar el análisis del documento. El archivo original permanece privado."
  if (/confirmed information cannot be empty/i.test(message)) return "La información confirmada no puede estar vacía."
  if (/duplicate key|already exists/i.test(message)) return "KLEIO encontró información que ya existe y evitó crear otra copia."

  return fallback
}

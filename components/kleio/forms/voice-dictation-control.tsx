"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, MicOff, RotateCcw } from "lucide-react"

type SpeechResultEvent = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0?: { transcript: string }
  }>
}

type SpeechErrorEvent = { error?: string }

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

type VoiceWindow = Window & typeof globalThis & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function joinTranscript(base: string, addition: string) {
  const cleanBase = base.trimEnd()
  const cleanAddition = addition.trim()
  if (!cleanAddition) return base
  return cleanBase ? `${cleanBase} ${cleanAddition}` : cleanAddition
}

export function VoiceDictationControl({
  value,
  onChange,
  locale = "en",
  fieldLabel,
}: {
  value: string
  onChange: (value: string) => void
  locale?: "en" | "es"
  fieldLabel: string
}) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const baseValueRef = useRef("")
  const finalTranscriptRef = useRef("")
  const [supported, setSupported] = useState<boolean | null>(null)
  const [listening, setListening] = useState(false)
  const [hasDictation, setHasDictation] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const voiceWindow = window as VoiceWindow
      setSupported(Boolean(voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition))
    }, 0)
    return () => {
      window.clearTimeout(timer)
      recognitionRef.current?.abort()
    }
  }, [])

  function start() {
    const voiceWindow = window as VoiceWindow
    const Recognition = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition
    if (!Recognition) {
      setSupported(false)
      return
    }

    recognitionRef.current?.abort()
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = locale === "es" ? "es-ES" : "en-US"
    baseValueRef.current = value
    finalTranscriptRef.current = ""
    setHasDictation(true)
    setError("")
    setStatus(locale === "es" ? "Escuchando. Habla con naturalidad." : "Listening. Speak naturally.")

    recognition.onresult = (event) => {
      let interim = ""
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result?.[0]?.transcript ?? ""
        if (result?.isFinal) finalTranscriptRef.current += ` ${transcript}`
        else interim += ` ${transcript}`
      }
      onChange(joinTranscript(baseValueRef.current, `${finalTranscriptRef.current} ${interim}`))
    }

    recognition.onerror = (event) => {
      const message = event.error === "not-allowed"
        ? (locale === "es" ? "Permite el acceso al micrófono para usar el dictado." : "Allow microphone access to use voice dictation.")
        : (locale === "es" ? "El dictado se detuvo. Puedes seguir escribiendo o intentarlo de nuevo." : "Dictation stopped. You can keep typing or try again.")
      setError(message)
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      setStatus(locale === "es" ? "Transcripción lista para revisar." : "Transcript ready for review.")
    }

    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  function stop() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function discardSession() {
    recognitionRef.current?.abort()
    onChange(baseValueRef.current)
    finalTranscriptRef.current = ""
    setHasDictation(false)
    setListening(false)
    setStatus(locale === "es" ? "Se descartó este dictado." : "This dictation was discarded.")
  }

  if (supported === false) {
    return <p className="text-xs leading-5 text-muted-foreground">{locale === "es" ? "El dictado no está disponible en este navegador. Puedes escribir o pegar tu respuesta." : "Voice dictation is not available in this browser. You can type or paste your answer instead."}</p>
  }

  return (
    <div className="rounded-xl border border-[#E7E1F7] bg-[#FBFAFE] p-3" aria-label={`${fieldLabel} voice dictation`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={listening ? stop : start}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 text-sm font-semibold text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
          aria-pressed={listening}
        >
          {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          {listening ? (locale === "es" ? "Detener y revisar" : "Stop and review") : (locale === "es" ? "Hablar en vez de escribir" : "Speak instead of typing")}
        </button>
        {(listening || hasDictation) && (
          <button type="button" onClick={discardSession} className="inline-flex min-h-10 items-center gap-2 px-2 text-xs font-semibold text-[#746E80] hover:text-[#292631]">
            <RotateCcw className="size-3.5" />{locale === "es" ? "Descartar este dictado" : "Discard this dictation"}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{locale === "es" ? "Tu navegador crea una transcripción editable. KLEIO no guarda una grabación de audio mediante este control." : "Your browser creates an editable transcript. KLEIO does not save an audio recording through this control."}</p>
      {status && <p role="status" aria-live="polite" className="mt-1 text-xs font-medium text-[#5B4B8A]">{status}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  )
}

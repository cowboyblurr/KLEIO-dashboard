"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, MicOff, RotateCcw } from "lucide-react"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

type SpeechResultEvent = {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0?: { transcript: string } }>
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

export function VoiceDictationControl({ value, onChange, locale = "en", fieldLabel }: { value: string; onChange: (value: string) => void; locale?: "en" | "es"; fieldLabel: string }) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const baseValueRef = useRef("")
  const finalSegmentsRef = useRef(new Map<number, string>())
  const completedRef = useRef(false)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [listening, setListening] = useState(false)
  const [hasDictation, setHasDictation] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const voiceWindow = window as VoiceWindow
    const available = Boolean(voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition)
    setSupported(available)
    void trackKleioProductEvent("voice_capability_detected", { surface: "creative_passport", metadata: { capability: available ? "native_browser" : "device_dictation" } })
    return () => recognitionRef.current?.abort()
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
    finalSegmentsRef.current.clear()
    completedRef.current = false
    setHasDictation(true)
    setError("")
    setStatus(locale === "es" ? "Escuchando. Habla con naturalidad." : "Listening. Speak naturally.")

    recognition.onresult = (event) => {
      let interim = ""
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result?.[0]?.transcript?.trim() ?? ""
        if (!transcript) continue
        if (result?.isFinal) finalSegmentsRef.current.set(index, transcript)
        else interim += ` ${transcript}`
      }
      const finalTranscript = Array.from(finalSegmentsRef.current.entries()).sort(([left], [right]) => left - right).map(([, transcript]) => transcript).join(" ")
      completedRef.current = Boolean(finalTranscript.trim())
      onChange(joinTranscript(baseValueRef.current, `${finalTranscript} ${interim}`))
    }

    recognition.onerror = (event) => {
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed"
      const interrupted = event.error === "aborted" || event.error === "audio-capture" || event.error === "network"
      setError(denied
        ? (locale === "es" ? "El navegador bloqueó el micrófono. Puedes habilitar el permiso o usar el dictado del teclado de tu dispositivo." : "The browser blocked microphone access. Enable permission or use your device keyboard’s dictation button.")
        : interrupted
          ? (locale === "es" ? "El dictado se interrumpió. La transcripción recibida sigue editable; puedes intentarlo de nuevo." : "Dictation was interrupted. Any received transcript remains editable; you can try again.")
          : (locale === "es" ? "El dictado se detuvo. Puedes seguir escribiendo o intentarlo de nuevo." : "Dictation stopped. You can keep typing or try again."))
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      setStatus(completedRef.current ? (locale === "es" ? "Transcripción lista para revisar." : "Transcript ready for review.") : (locale === "es" ? "No se recibió una transcripción. Puedes intentarlo de nuevo o escribir." : "No transcript was received. Try again or continue typing."))
      if (completedRef.current) void trackKleioProductEvent("voice_completed", { surface: "creative_passport", metadata: { capability: "native_browser" } })
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
      void trackKleioProductEvent("voice_started", { surface: "creative_passport", metadata: { capability: "native_browser" } })
    } catch {
      setListening(false)
      setError(locale === "es" ? "El dictado ya está activo o el navegador no pudo iniciarlo. Detén la sesión anterior e inténtalo de nuevo." : "Dictation is already active or could not start. Stop the previous session and try again.")
    }
  }

  function stop() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function discardSession() {
    recognitionRef.current?.abort()
    onChange(baseValueRef.current)
    finalSegmentsRef.current.clear()
    completedRef.current = false
    setHasDictation(false)
    setListening(false)
    setError("")
    setStatus(locale === "es" ? "Se descartó este dictado." : "This dictation was discarded.")
  }

  if (supported === false) {
    return (
      <div className="rounded-xl border border-[#E7E1F7] bg-[#FBFAFE] p-3 text-xs leading-5 text-muted-foreground">
        <p>{locale === "es" ? "Este navegador no ofrece dictado web. El campo de texto sigue disponible." : "This browser does not provide web dictation. The text field remains fully available."}</p>
        <p className="mt-1">{locale === "es" ? "También puedes usar el micrófono del teclado de tu teléfono, tableta o computadora para dictar directamente en el campo." : "You can also use the microphone button on your phone, tablet, or computer keyboard to dictate directly into the field."}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#E7E1F7] bg-[#FBFAFE] p-3" aria-label={`${fieldLabel} voice dictation`}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={listening ? stop : start} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 text-sm font-semibold text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20" aria-pressed={listening}>{listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}{listening ? (locale === "es" ? "Detener y revisar" : "Stop and review") : (locale === "es" ? "Hablar en vez de escribir" : "Speak instead of typing")}</button>
        {(listening || hasDictation) && <button type="button" onClick={discardSession} className="inline-flex min-h-10 items-center gap-2 px-2 text-xs font-semibold text-[#746E80] hover:text-[#292631]"><RotateCcw className="size-3.5" />{locale === "es" ? "Descartar este dictado" : "Discard this dictation"}</button>}
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{locale === "es" ? "Este control usa el reconocimiento de voz del navegador y produce texto editable. KLEIO no carga ni conserva una grabación de audio mediante este control." : "This control uses the browser’s speech recognition and produces editable text. KLEIO does not upload or retain an audio recording through this control."}</p>
      {status && <p role="status" aria-live="polite" className="mt-1 text-xs font-medium text-[#5B4B8A]">{status}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  )
}

import { validateRasterImageFile } from "@/lib/kleio-file-validation"
import { loadArtistProfilePresentation, saveArtistProfilePresentation, uploadArtistProfileImage } from "@/lib/kleio-profile-presentation"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

const DATABASE_NAME = "kleio-pending-uploads"
const DATABASE_VERSION = 1
const STORE_NAME = "artist-profile-images"
const RECORD_KEY = "pending"
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024

type PendingArtistProfileImageRecord = {
  key: typeof RECORD_KEY
  blob: Blob
  fileName: string
  mimeType: string
  email: string
  createdAt: number
}

export type PendingArtistProfileImage = {
  file: File
  email: string
  createdAt: number
}

export type PendingArtistProfileImageResult =
  | { status: "none" }
  | { status: "uploaded"; path: string }
  | { status: "email_mismatch" }
  | { status: "not_ready" }

let finalizePromise: Promise<PendingArtistProfileImageResult> | null = null

function isBrowser() {
  return typeof window !== "undefined" && "indexedDB" in window
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function openDatabase(): Promise<IDBDatabase> {
  if (!isBrowser()) return Promise.reject(new Error("Browser storage is unavailable."))

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "key" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("KLEIO could not open temporary browser storage."))
  })
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = action(transaction.objectStore(STORE_NAME))

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("KLEIO could not update temporary browser storage."))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error("KLEIO could not complete the browser-storage update."))
    }
  })
}

function recordToPending(record: PendingArtistProfileImageRecord): PendingArtistProfileImage {
  return {
    file: new File([record.blob], record.fileName, { type: record.mimeType }),
    email: normalizeEmail(record.email),
    createdAt: record.createdAt,
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export async function validatePendingArtistProfileImage(file: File) {
  await validateRasterImageFile(file, {
    maxBytes: PROFILE_IMAGE_MAX_BYTES,
    label: "Profile image",
  })
}

export async function savePendingArtistProfileImage(file: File, email = "") {
  await validatePendingArtistProfileImage(file)
  const record: PendingArtistProfileImageRecord = {
    key: RECORD_KEY,
    blob: file,
    fileName: file.name || "profile-image",
    mimeType: file.type,
    email: normalizeEmail(email),
    createdAt: Date.now(),
  }
  await withStore("readwrite", (store) => store.put(record))
  return recordToPending(record)
}

export async function updatePendingArtistProfileImageEmail(email: string) {
  const record = await withStore<PendingArtistProfileImageRecord | undefined>("readonly", (store) => store.get(RECORD_KEY))
  if (!record) return
  const normalized = normalizeEmail(email)
  if (record.email === normalized) return
  await withStore("readwrite", (store) => store.put({ ...record, email: normalized }))
}

export async function loadPendingArtistProfileImage(): Promise<PendingArtistProfileImage | null> {
  if (!isBrowser()) return null
  const record = await withStore<PendingArtistProfileImageRecord | undefined>("readonly", (store) => store.get(RECORD_KEY))
  if (!record) return null
  if (Date.now() - record.createdAt > MAX_AGE_MS) {
    await clearPendingArtistProfileImage()
    return null
  }
  return recordToPending(record)
}

export async function clearPendingArtistProfileImage() {
  if (!isBrowser()) return
  await withStore("readwrite", (store) => store.delete(RECORD_KEY))
}

async function finalizePendingArtistProfileImageAttempt(): Promise<PendingArtistProfileImageResult> {
  const pending = await loadPendingArtistProfileImage()
  if (!pending) return { status: "none" }

  const account = await loadKleioAccount()
  if (!account || account.profile.role !== "artist") return { status: "not_ready" }

  const accountEmail = normalizeEmail(account.user.email ?? account.profile.email ?? "")
  if (!pending.email || !accountEmail || pending.email !== accountEmail) return { status: "email_mismatch" }

  const presentation = await loadArtistProfilePresentation()
  const upload = await uploadArtistProfileImage(pending.file)
  try {
    await saveArtistProfilePresentation({
      ...presentation,
      profile_image_path: upload.path,
    })
  } catch (error) {
    await getSupabaseBrowserClient().storage.from("artist-assets").remove([upload.path]).catch(() => undefined)
    throw error
  }

  await clearPendingArtistProfileImage()
  return { status: "uploaded", path: upload.path }
}

export function finalizePendingArtistProfileImage(options: { retries?: number; delayMs?: number } = {}) {
  if (finalizePromise) return finalizePromise

  const retries = Math.max(0, options.retries ?? 0)
  const delayMs = Math.max(100, options.delayMs ?? 450)
  finalizePromise = (async () => {
    let result: PendingArtistProfileImageResult = { status: "not_ready" }
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        result = await finalizePendingArtistProfileImageAttempt()
      } catch (error) {
        if (attempt >= retries) throw error
        await wait(delayMs)
        continue
      }

      if (result.status !== "not_ready" || attempt >= retries) return result
      await wait(delayMs)
    }
    return result
  })().finally(() => {
    finalizePromise = null
  })

  return finalizePromise
}

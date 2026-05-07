// PostEverywhere API client.
//
// API base path is configurable via POSTEVERYWHERE_API_BASE (default
// https://app.posteverywhere.ai/api/v1). Auth is Bearer + API key.
//
// Important spec quirks (verified against developers.posteverywhere.ai):
// - Upload media is a TWO-STEP flow. First POST /media/upload with file
//   metadata (json), then upload the bytes via multipart to the returned
//   `upload_url` (separate domain — looks like a pre-signed bucket URL).
// - Create post uses `scheduled_for` (UTC ISO 8601 with Z), NOT scheduled_at.
// - There is NO `firstComment` field; hashtags must go in the post content.

const PE_BASE = process.env.POSTEVERYWHERE_API_BASE || 'https://app.posteverywhere.ai/api/v1'
const PE_KEY = process.env.POSTEVERYWHERE_API_KEY

export class PostEverywhereError extends Error {
  constructor(
    public status: number,
    public requestId: string | null,
    message: string
  ) {
    super(message)
  }
}

async function pe<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!PE_KEY) {
    throw new PostEverywhereError(0, null, 'POSTEVERYWHERE_API_KEY is missing')
  }

  const url = `${PE_BASE}${path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${PE_KEY}`,
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {})
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal })
    const requestId = res.headers.get('x-request-id')

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new PostEverywhereError(res.status, requestId, `[PE ${res.status}] ${text}`)
    }

    return (await res.json()) as T
  } catch (err) {
    if (err instanceof PostEverywhereError) throw err
    const msg = err instanceof Error ? err.message : String(err)
    throw new PostEverywhereError(0, null, `Network error: ${msg}`)
  } finally {
    clearTimeout(timeout)
  }
}

// ============================================================================
// Accounts
// ============================================================================

export interface PeAccount {
  id: number
  platform: string
  account_name: string
  avatar_url?: string
  is_active: boolean
  health?: { status: string; can_post: boolean; needs_reconnection: boolean }
}

export async function listAccounts(): Promise<PeAccount[]> {
  const res = await pe<{ data: { accounts: PeAccount[] } }>('/accounts')
  return res.data.accounts
}

// ============================================================================
// Media upload (2-step flow)
// ============================================================================

interface InitiateUploadResponse {
  data: {
    media_id: string
    upload_url: string
    upload_method: { method: string; content_type: string; field_name: string }
    expires_in: number
  }
}

/**
 * Three-step upload (verified against developers.posteverywhere.ai):
 *   1) POST /media/upload       — register the upload, get media_id + presigned upload_url
 *   2) POST upload_url multipart — upload the bytes (field name from upload_method)
 *   3) POST /media/{id}/complete — finalise. Without this, createPost rejects
 *      with media_not_ready (status: uploading).
 *
 * Returns the media_id ready to be referenced from create-post.
 */
export async function uploadMedia(
  buffer: Buffer,
  filename: string,
  mimeType = 'image/png'
): Promise<{ media_id: string }> {
  // Step 1: register the upload
  const initiate = await pe<InitiateUploadResponse>('/media/upload', {
    method: 'POST',
    body: JSON.stringify({
      filename,
      content_type: mimeType,
      size: buffer.byteLength
    })
  })

  const { media_id, upload_url, upload_method } = initiate.data

  // Step 2: upload the bytes to the presigned URL.
  // The upload_url is on a different domain (e.g. upload.posteverywhere.ai)
  // and does not need the API Bearer auth — it's pre-authenticated.
  // Bound the upload at 30s: without an AbortController, a hung PUT would
  // sit there until the whole Vercel function times out (60s on Hobby),
  // taking down all 10 parallel uploads with it.
  const fieldName = upload_method?.field_name || 'file'
  const formData = new FormData()
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
  formData.append(fieldName, blob, filename)

  const uploadController = new AbortController()
  const uploadTimeout = setTimeout(() => uploadController.abort(), 30000)
  let uploadRes: Response
  try {
    uploadRes = await fetch(upload_url, {
      method: upload_method?.method || 'POST',
      body: formData,
      signal: uploadController.signal
    })
  } finally {
    clearTimeout(uploadTimeout)
  }

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => '')
    throw new PostEverywhereError(
      uploadRes.status,
      null,
      `Pre-signed upload failed (${uploadRes.status}): ${text}`
    )
  }

  // Step 3: finalise. Doc doesn't spec a body — sending {} works.
  // Status field name in the response isn't documented; we don't read it,
  // we just rely on the 201 to signal success.
  await pe<{ data: { media_id: string; media_ids?: string[] } }>(
    `/media/${media_id}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({})
    }
  )

  return { media_id }
}

// ============================================================================
// Posts
// ============================================================================

export type IgContentType = 'Post' | 'Reels' | 'Story' | 'Trial Reel'

export interface PlatformContentInstagram {
  content?: string
  contentType?: IgContentType
  settings?: { altText?: string; coverPhotoTimestamp?: number }
}
export interface PlatformContentFacebook {
  content?: string
}
export interface PlatformContentMap {
  instagram?: PlatformContentInstagram
  facebook?: PlatformContentFacebook
  threads?: { content?: string }
  tiktok?: { content?: string }
  linkedin?: { content?: string }
  x?: { content?: string }
}

export interface CreatePostParams {
  content: string
  account_ids: number[]
  media_ids?: string[]
  /** UTC ISO 8601 with Z suffix, e.g. "2026-04-15T14:30:00Z". */
  scheduled_for?: string
  timezone?: string
  platform_content?: PlatformContentMap
}

export interface PeDestination {
  platform: string
  account_id: number
  account_name?: string
  status: string
  permalink?: string
  error?: string
}

export interface PeCreatedPost {
  post_id: string
  id?: string
  status: string
  scheduled_for?: string
  account_ids: number[]
  destinations: PeDestination[]
}

export async function createPost(params: CreatePostParams): Promise<PeCreatedPost> {
  const res = await pe<{ data: PeCreatedPost }>('/posts', {
    method: 'POST',
    body: JSON.stringify(params)
  })
  return res.data
}

export async function getPost(postId: string): Promise<PeCreatedPost> {
  const res = await pe<{ data: PeCreatedPost }>(`/posts/${postId}`)
  return res.data
}

export interface PilotPost {
  id: string
  caption: string
  hashtags: string[] | null
  content_type: 'carousel' | 'single_post' | 'story' | null
  slides_json: unknown
  slide_image_urls: string[] | null
  generated_at: string
  ig_angles?: { axis: string; hook: string } | null
}

export interface Toast {
  id: string
  message: string
  type: 'error' | 'success'
}

export interface Stats {
  approved: number
  rejected: number
  skipped: number
  processing: number
  failed: number
}

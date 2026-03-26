export type ContentType = 'text' | 'rich_text' | 'image' | 'gallery' | 'link' | 'background' | 'document' | 'section' | 'json'
export interface ContentBlock { id?: string; page_slug: string; section: string; block_id: string; content_type: ContentType; content_value: any; status?: 'draft' | 'published'; position?: number; created_at?: string; updated_at?: string }
export interface Page { id?: string; slug: string; title?: string; status?: 'draft' | 'published'; created_at?: string; updated_at?: string }

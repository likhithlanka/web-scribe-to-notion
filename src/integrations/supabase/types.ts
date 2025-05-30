export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          id: string
          title: string
          url: string
          main_tag_id: string | null
          type: 'article' | 'video' | 'podcast' | 'other'
          summarized_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          main_tag_id?: string | null
          type?: 'article' | 'video' | 'podcast' | 'other'
          summarized_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          main_tag_id?: string | null
          type?: 'article' | 'video' | 'podcast' | 'other'
          summarized_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookmark_tags: {
        Row: {
          bookmark_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          bookmark_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          bookmark_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      main_tags: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bookmark_type: 'article' | 'video' | 'podcast' | 'other'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const Constants = {
  public: {
    Enums: {
      bookmark_type: ['article', 'video', 'podcast', 'other'] as const
    }
  }
} as const
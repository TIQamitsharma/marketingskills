export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          updated_at?: string
        }
      }
      user_integrations: {
        Row: {
          id: string
          user_id: string
          integration_key: string
          api_key: string | null
          is_configured: boolean
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_key: string
          api_key?: string | null
          is_configured?: boolean
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          is_configured?: boolean
          config?: Json
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          product_context: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          product_context?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          product_context?: string | null
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          skill_used: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          skill_used?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          skill_used?: string | null
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: never
      }
    }
  }
}

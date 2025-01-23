export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          last_name: string
          id_number: string | null
          phone: string | null
          address: string | null
          birth_date: string | null
          role_id: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          last_name?: string
          id_number?: string | null
          phone?: string | null
          address?: string | null
          birth_date?: string | null
          role_id: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          last_name?: string
          id_number?: string | null
          phone?: string | null
          address?: string | null
          birth_date?: string | null
          role_id?: string
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
        }
      }
    }
  }
}
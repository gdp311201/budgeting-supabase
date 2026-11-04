/**
 * Database types — auto-generated style for type safety
 * These match the SQL schema in /supabase/*.sql
 *
 * To regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/types/database.ts
 */
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
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          app_name: string
          icon_name: string
          icon_url: string | null
          wallpaper_url: string | null
          palette: Json
          glass_settings: Json
          is_premium: boolean
          selected_theme_id: string | null
          selected_mascot_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          app_name?: string
          icon_name?: string
          icon_url?: string | null
          wallpaper_url?: string | null
          palette?: Json
          glass_settings?: Json
          is_premium?: boolean
          selected_theme_id?: string | null
          selected_mascot_id?: string | null
          created_at?: string
        }
        Update: {
          email?: string | null
          full_name?: string | null
          app_name?: string
          icon_name?: string
          icon_url?: string | null
          wallpaper_url?: string | null
          palette?: Json
          glass_settings?: Json
          is_premium?: boolean
          selected_theme_id?: string | null
          selected_mascot_id?: string | null
        }
      }

      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'bank' | 'ewallet' | 'cash' | 'investment'
          opening_balance: number
          sort_order: number
          is_active: boolean
          is_selected: boolean
          is_protected: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'bank' | 'ewallet' | 'cash' | 'investment'
          opening_balance?: number
          sort_order?: number
          is_active?: boolean
          is_selected?: boolean
          is_protected?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          type?: 'bank' | 'ewallet' | 'cash' | 'investment'
          opening_balance?: number
          sort_order?: number
          is_active?: boolean
          is_selected?: boolean
          is_protected?: boolean
        }
      }

      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense' | 'transfer' | 'investment' | 'debt' | 'other'
          icon: string | null
          sort_order: number
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'income' | 'expense' | 'transfer' | 'investment' | 'debt' | 'other'
          icon?: string | null
          sort_order?: number
          is_active?: boolean
        }
        Update: {
          name?: string
          type?: 'income' | 'expense' | 'transfer' | 'investment' | 'debt' | 'other'
          icon?: string | null
          sort_order?: number
          is_active?: boolean
        }
      }

      subcategories: {
        Row: {
          id: string
          user_id: string
          category_id: string
          name: string
          default_amount: number | null
          sort_order: number
          is_active: boolean
          is_custom: boolean
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          name: string
          default_amount?: number | null
          sort_order?: number
          is_active?: boolean
          is_custom?: boolean
        }
        Update: {
          name?: string
          default_amount?: number | null
          sort_order?: number
          is_active?: boolean
          is_custom?: boolean
        }
      }

      budgets: {
        Row: {
          id: string
          user_id: string
          subcategory_id: string
          month: number
          year: number
          amount: number
        }
        Insert: {
          id?: string
          user_id: string
          subcategory_id: string
          month: number
          year: number
          amount?: number
        }
        Update: {
          amount?: number
        }
      }

      transactions: {
        Row: {
          id: string
          user_id: string
          transaction_date: string
          category_id: string
          subcategory_id: string | null
          account_id: string
          to_account_id: string | null
          amount: number
          type: 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'investment'
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_date: string
          category_id: string
          subcategory_id?: string | null
          account_id: string
          to_account_id?: string | null
          amount: number
          type: 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'investment'
          note?: string | null
          created_at?: string
        }
        Update: {
          transaction_date?: string
          category_id?: string
          subcategory_id?: string | null
          account_id?: string
          to_account_id?: string | null
          amount?: number
          type?: 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'investment'
          note?: string | null
        }
      }

      daily_quotes: {
        Row: {
          id: number
          text: string
          is_active: boolean
        }
        Insert: {
          id?: number
          text: string
          is_active?: boolean
        }
        Update: {
          text?: string
          is_active?: boolean
        }
      }

      dashboard_emojis: {
        Row: {
          id: number
          category: string
          emoji: string
          message: string | null
        }
        Insert: {
          id?: number
          category: string
          emoji: string
          message?: string | null
        }
        Update: {
          category?: string
          emoji?: string
          message?: string | null
        }
      }

      // NEW: Whitelist table (admin-managed)
      allowed_emails: {
        Row: {
          email: string
          full_name: string | null
          is_premium: boolean
          assigned_theme: string | null
          assigned_mascot: string | null
          invited_by: string | null
          invited_at: string
          notes: string | null
          is_active: boolean
        }
        Insert: {
          email: string
          full_name?: string | null
          is_premium?: boolean
          assigned_theme?: string | null
          assigned_mascot?: string | null
          invited_by?: string | null
          invited_at?: string
          notes?: string | null
          is_active?: boolean
        }
        Update: {
          full_name?: string | null
          is_premium?: boolean
          assigned_theme?: string | null
          assigned_mascot?: string | null
          invited_by?: string | null
          notes?: string | null
          is_active?: boolean
        }
      }

      // NEW: Theme presets
      themes: {
        Row: {
          id: string
          name: string
          emoji: string
          description: string | null
          palette: Json
          wallpaper_url: string | null
          glass_settings: Json
          is_premium: boolean
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          emoji: string
          description?: string | null
          palette: Json
          wallpaper_url?: string | null
          glass_settings: Json
          is_premium?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          emoji?: string
          description?: string | null
          palette?: Json
          wallpaper_url?: string | null
          glass_settings?: Json
          is_premium?: boolean
          is_active?: boolean
          sort_order?: number
        }
      }

      // NEW: Mascot library
      mascots: {
        Row: {
          id: string
          name: string
          emoji: string
          description: string | null
          icon_url: string | null
          vibe: string
          is_premium: boolean
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          emoji: string
          description?: string | null
          icon_url?: string | null
          vibe: string
          is_premium?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          emoji?: string
          description?: string | null
          icon_url?: string | null
          vibe?: string
          is_premium?: boolean
          is_active?: boolean
          sort_order?: number
        }
      }

      // NEW: Mascot whitelist (private mascots)
      mascot_whitelist: {
        Row: {
          mascot_id: string
          email: string
          granted_at: string
          granted_by: string | null
        }
        Insert: {
          mascot_id: string
          email: string
          granted_by?: string | null
          granted_at?: string
        }
        Update: {
          granted_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_mutasi_bank: {
        Args: { p_account_id: string; p_month: number; p_year: number }
        Returns: Json
      }
      get_dashboard: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_ereceipt: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_search: {
        Args: {
          p_month: number | null
          p_year: number | null
          p_keyword: string | null
          p_sort: 'DESC' | 'ASC'
        }
        Returns: Json
      }
      get_setup_data: {
        Args: Record<string, never>
        Returns: Json
      }
      // NEW: Premium/restricted check helpers
      can_use_mascot: {
        Args: { p_mascot_id: string }
        Returns: Json
      }
      can_use_theme: {
        Args: { p_theme_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

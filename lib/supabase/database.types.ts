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
      patients: {
        Row: {
          id: string
          auth_user_id: string | null
          name: string
          email: string
          date_of_birth: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          name: string
          email: string
          date_of_birth: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          name?: string
          email?: string
          date_of_birth?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      records: {
        Row: {
          id: string
          patient_id: string
          hospital: string
          category: string
          data: Json
          record_date: string | null
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          hospital: string
          category: string
          data: Json
          record_date?: string | null
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          hospital?: string
          category?: string
          data?: Json
          record_date?: string | null
          source?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'records_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
      summaries: {
        Row: {
          id: string
          patient_id: string
          clinician_summary: string | null
          patient_summary: string | null
          anomalies: Json | null
          model_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          clinician_summary?: string | null
          patient_summary?: string | null
          anomalies?: Json | null
          model_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          clinician_summary?: string | null
          patient_summary?: string | null
          anomalies?: Json | null
          model_used?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'summaries_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
      patient_providers: {
        Row: {
          id: string
          patient_id: string
          employee_id: string | null
          provider_name: string
          provider_org: string | null
          provider_email: string | null
          scope: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          employee_id?: string | null
          provider_name: string
          provider_org?: string | null
          provider_email?: string | null
          scope?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          employee_id?: string | null
          provider_name?: string
          provider_org?: string | null
          provider_email?: string | null
          scope?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'patient_providers_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'patient_providers_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      share_tokens: {
        Row: {
          id: string
          patient_id: string
          token: string
          scope: string[]
          expires_at: string
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          token: string
          scope: string[]
          expires_at: string
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          token?: string
          scope?: string[]
          expires_at?: string
          revoked_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'share_tokens_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
      access_logs: {
        Row: {
          id: string
          token_id: string | null
          patient_id: string
          provider_name: string | null
          provider_org: string | null
          ip_address: string | null
          user_agent: string | null
          access_method: string | null
          scope: string[] | null
          accessed_at: string
        }
        Insert: {
          id?: string
          token_id?: string | null
          patient_id: string
          provider_name?: string | null
          provider_org?: string | null
          ip_address?: string | null
          user_agent?: string | null
          access_method?: string | null
          scope?: string[] | null
          accessed_at?: string
        }
        Update: {
          id?: string
          token_id?: string | null
          patient_id?: string
          provider_name?: string | null
          provider_org?: string | null
          ip_address?: string | null
          user_agent?: string | null
          access_method?: string | null
          scope?: string[] | null
          accessed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'access_logs_token_id_fkey'
            columns: ['token_id']
            isOneToOne: false
            referencedRelation: 'share_tokens'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'access_logs_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
      employees: {
        Row: {
          id: string
          employee_id: string
          name: string
          organization: string
          email: string | null
          department: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          name: string
          organization: string
          email?: string | null
          department?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          name?: string
          organization?: string
          email?: string | null
          department?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Patient = Database['public']['Tables']['patients']['Row']
export type NewPatient = Database['public']['Tables']['patients']['Insert']
export type UpdatePatient = Database['public']['Tables']['patients']['Update']

export type Record = Database['public']['Tables']['records']['Row']
export type NewRecord = Database['public']['Tables']['records']['Insert']
export type UpdateRecord = Database['public']['Tables']['records']['Update']

export type Summary = Database['public']['Tables']['summaries']['Row']
export type NewSummary = Database['public']['Tables']['summaries']['Insert']
export type UpdateSummary = Database['public']['Tables']['summaries']['Update']

export type PatientProvider =
  Database['public']['Tables']['patient_providers']['Row']
export type NewPatientProvider =
  Database['public']['Tables']['patient_providers']['Insert']
export type UpdatePatientProvider =
  Database['public']['Tables']['patient_providers']['Update']

export type ShareToken = Database['public']['Tables']['share_tokens']['Row']
export type NewShareToken =
  Database['public']['Tables']['share_tokens']['Insert']
export type UpdateShareToken =
  Database['public']['Tables']['share_tokens']['Update']

export type AccessLog = Database['public']['Tables']['access_logs']['Row']
export type NewAccessLog = Database['public']['Tables']['access_logs']['Insert']
export type UpdateAccessLog =
  Database['public']['Tables']['access_logs']['Update']

export type Employee = Database['public']['Tables']['employees']['Row']
export type NewEmployee = Database['public']['Tables']['employees']['Insert']
export type UpdateEmployee = Database['public']['Tables']['employees']['Update']

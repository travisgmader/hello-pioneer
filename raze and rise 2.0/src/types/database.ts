export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string
          created_by: string | null
          equipment: string | null
          exercisedb_video_id: string | null
          id: string
          is_custom: boolean
          muscle_group: string | null
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          equipment?: string | null
          exercisedb_video_id?: string | null
          id?: string
          is_custom?: boolean
          muscle_group?: string | null
          name: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          equipment?: string | null
          exercisedb_video_id?: string | null
          id?: string
          is_custom?: boolean
          muscle_group?: string | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      gsd_state: {
        Row: {
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      measurements: {
        Row: {
          arms_cm: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          hips_cm: number | null
          id: string
          measured_at: string
          notes: string | null
          thighs_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arms_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          hips_cm?: number | null
          id?: string
          measured_at?: string
          notes?: string | null
          thighs_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arms_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          hips_cm?: number | null
          id?: string
          measured_at?: string
          notes?: string | null
          thighs_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          meal_reminders_enabled: boolean
          pr_alerts_enabled: boolean
          updated_at: string
          user_id: string
          weekly_summary_enabled: boolean
          workout_reminder_enabled: boolean
          workout_reminder_time: string | null
        }
        Insert: {
          meal_reminders_enabled?: boolean
          pr_alerts_enabled?: boolean
          updated_at?: string
          user_id: string
          weekly_summary_enabled?: boolean
          workout_reminder_enabled?: boolean
          workout_reminder_time?: string | null
        }
        Update: {
          meal_reminders_enabled?: boolean
          pr_alerts_enabled?: boolean
          updated_at?: string
          user_id?: string
          weekly_summary_enabled?: boolean
          workout_reminder_enabled?: boolean
          workout_reminder_time?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          display_name: string | null
          height_cm: number | null
          migration_status: string
          onboarded: boolean
          primary_goal: string | null
          sex: string | null
          units: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          migration_status?: string
          onboarded?: boolean
          primary_goal?: string | null
          sex?: string | null
          units?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          migration_status?: string
          onboarded?: boolean
          primary_goal?: string | null
          sex?: string | null
          units?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles_v1: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      session_sets: {
        Row: {
          exercise_id: string
          exercise_name: string | null
          id: string
          is_warmup: boolean
          logged_at: string
          notes: string | null
          reps_target: number | null
          result: string | null
          rpe: number | null
          session_id: string
          set_number: number
          weight_kg: number | null
        }
        Insert: {
          exercise_id: string
          exercise_name?: string | null
          id: string
          is_warmup?: boolean
          logged_at?: string
          notes?: string | null
          reps_target?: number | null
          result?: string | null
          rpe?: number | null
          session_id: string
          set_number: number
          weight_kg?: number | null
        }
        Update: {
          exercise_id?: string
          exercise_name?: string | null
          id?: string
          is_warmup?: boolean
          logged_at?: string
          notes?: string | null
          reps_target?: number | null
          result?: string | null
          rpe?: number | null
          session_id?: string
          set_number?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          day_label: string | null
          id: string
          is_deleted: boolean
          notes: string | null
          started_at: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          day_label?: string | null
          id: string
          is_deleted?: boolean
          notes?: string | null
          started_at?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          day_label?: string | null
          id?: string
          is_deleted?: boolean
          notes?: string | null
          started_at?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      split_settings: {
        Row: {
          deload_active: boolean
          global_rest_seconds: number
          phase: number
          phase_started_at: string | null
          rotation_pointer: number
          split_type: string
          updated_at: string
          user_id: string
          weeks_in_phase: number
          weight_method: string
        }
        Insert: {
          deload_active?: boolean
          global_rest_seconds?: number
          phase?: number
          phase_started_at?: string | null
          rotation_pointer?: number
          split_type: string
          updated_at?: string
          user_id: string
          weeks_in_phase?: number
          weight_method?: string
        }
        Update: {
          deload_active?: boolean
          global_rest_seconds?: number
          phase?: number
          phase_started_at?: string | null
          rotation_pointer?: number
          split_type?: string
          updated_at?: string
          user_id?: string
          weeks_in_phase?: number
          weight_method?: string
        }
        Relationships: []
      }
      template_exercises: {
        Row: {
          created_at: string
          default_rest_seconds: number | null
          exercise_id: string
          id: string
          position: number
          rep_high: number | null
          rep_low: number | null
          sets: number
          superset_group: number | null
          template_id: string
        }
        Insert: {
          created_at?: string
          default_rest_seconds?: number | null
          exercise_id: string
          id?: string
          position: number
          rep_high?: number | null
          rep_low?: number | null
          sets: number
          superset_group?: number | null
          template_id: string
        }
        Update: {
          created_at?: string
          default_rest_seconds?: number | null
          exercise_id?: string
          id?: string
          position?: number
          rep_high?: number | null
          rep_low?: number | null
          sets?: number
          superset_group?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          day_label: string
          id: string
          is_deleted: boolean
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_label: string
          id?: string
          is_deleted?: boolean
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_label?: string
          id?: string
          is_deleted?: boolean
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_state: {
        Row: {
          state: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          state?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          state?: Json
          updated_at?: string | null
          user_id?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          family_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          family_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          family_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowed_emails_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      chore_completions: {
        Row: {
          approved_by: string | null
          chore_id: string
          completed_at: string
          family_id: string
          id: string
          member_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_by?: string | null
          chore_id: string
          completed_at?: string
          family_id: string
          id?: string
          member_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_by?: string | null
          chore_id?: string
          completed_at?: string
          family_id?: string
          id?: string
          member_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chore_completions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_completions_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_completions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_completions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      chores: {
        Row: {
          assigned_member_id: string | null
          created_at: string
          due_at: string | null
          family_id: string
          frequency: string
          id: string
          requires_approval: boolean
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_member_id?: string | null
          created_at?: string
          due_at?: string | null
          family_id: string
          frequency: string
          id?: string
          requires_approval?: boolean
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_member_id?: string | null
          created_at?: string
          due_at?: string | null
          family_id?: string
          frequency?: string
          id?: string
          requires_approval?: boolean
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chores_assigned_member_id_fkey"
            columns: ["assigned_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          assigned_member_id: string | null
          created_at: string
          dropoff_parent_id: string | null
          ends_at: string | null
          family_id: string
          id: string
          pickup_parent_id: string | null
          rrule: string | null
          starts_at: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_member_id?: string | null
          created_at?: string
          dropoff_parent_id?: string | null
          ends_at?: string | null
          family_id: string
          id?: string
          pickup_parent_id?: string | null
          rrule?: string | null
          starts_at: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_member_id?: string | null
          created_at?: string
          dropoff_parent_id?: string | null
          ends_at?: string | null
          family_id?: string
          id?: string
          pickup_parent_id?: string | null
          rrule?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_assigned_member_id_fkey"
            columns: ["assigned_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_dropoff_parent_id_fkey"
            columns: ["dropoff_parent_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_pickup_parent_id_fkey"
            columns: ["pickup_parent_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          created_by: string | null
          emoji: string
          id: string
          name: string
          stripe_customer_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          name: string
          stripe_customer_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          name?: string
          stripe_customer_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      family_links: {
        Row: {
          created_at: string
          family_a_id: string
          family_b_id: string
          id: string
        }
        Insert: {
          created_at?: string
          family_a_id: string
          family_b_id: string
          id?: string
        }
        Update: {
          created_at?: string
          family_a_id?: string
          family_b_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_links_family_a_id_fkey"
            columns: ["family_a_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_links_family_b_id_fkey"
            columns: ["family_b_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_settings: {
        Row: {
          family_id: string
          stripe_subscription_status: string | null
          theme: string
          timezone: string
          trial_ends_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          family_id: string
          stripe_subscription_status?: string | null
          theme?: string
          timezone: string
          trial_ends_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          family_id?: string
          stripe_subscription_status?: string | null
          theme?: string
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_settings_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      groceries: {
        Row: {
          added_by_member_id: string | null
          category: string | null
          checked: boolean
          created_at: string
          family_id: string
          id: string
          name: string
          qty: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          added_by_member_id?: string | null
          category?: string | null
          checked?: boolean
          created_at?: string
          family_id: string
          id?: string
          name: string
          qty?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          added_by_member_id?: string | null
          category?: string | null
          checked?: boolean
          created_at?: string
          family_id?: string
          id?: string
          name?: string
          qty?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groceries_added_by_member_id_fkey"
            columns: ["added_by_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groceries_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          date: string
          family_id: string
          id: string
          slot: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          date: string
          family_id: string
          id?: string
          slot: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          date?: string
          family_id?: string
          id?: string
          slot?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          auth_user_id: string | null
          color: string
          created_at: string
          email: string | null
          emoji: string
          family_id: string
          id: string
          name: string
          role: string
          updated_at: string
          updated_by: string | null
          visible_sections: Json
        }
        Insert: {
          auth_user_id?: string | null
          color?: string
          created_at?: string
          email?: string | null
          emoji?: string
          family_id: string
          id?: string
          name: string
          role?: string
          updated_at?: string
          updated_by?: string | null
          visible_sections?: Json
        }
        Update: {
          auth_user_id?: string | null
          color?: string
          created_at?: string
          email?: string | null
          emoji?: string
          family_id?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
          updated_by?: string | null
          visible_sections?: Json
        }
        Relationships: [
          {
            foreignKeyName: "members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          created_at: string
          family_id: string
          id: string
          posted_by_member_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          family_id: string
          id?: string
          posted_by_member_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          family_id?: string
          id?: string
          posted_by_member_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_posted_by_member_id_fkey"
            columns: ["posted_by_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_queue: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          family_id: string
          id: string
          kind: string
          member_id: string | null
          payload: Json
          scheduled_for: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          family_id: string
          id?: string
          kind: string
          member_id?: string | null
          payload: Json
          scheduled_for: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          family_id?: string
          id?: string
          kind?: string
          member_id?: string | null
          payload?: Json
          scheduled_for?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_queue_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_queue_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          family_id: string
          member_id: string
          p256dh: string
          updated_at: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          family_id: string
          member_id: string
          p256dh: string
          updated_at?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          family_id?: string
          member_id?: string
          p256dh?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      v1_chores: {
        Row: {
          assigned_to: string | null
          completed: boolean
          created_at: string
          due_date: string | null
          frequency: string
          id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          frequency?: string
          id: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          frequency?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      v1_custody: {
        Row: {
          date: string
          parent: string
        }
        Insert: {
          date: string
          parent: string
        }
        Update: {
          date?: string
          parent?: string
        }
        Relationships: []
      }
      v1_events: {
        Row: {
          color: string
          created_at: string
          date: string
          dropoff_parent: string | null
          end_time: string | null
          id: string
          member_id: string | null
          pickup_parent: string | null
          time: string | null
          title: string
        }
        Insert: {
          color?: string
          created_at?: string
          date: string
          dropoff_parent?: string | null
          end_time?: string | null
          id: string
          member_id?: string | null
          pickup_parent?: string | null
          time?: string | null
          title: string
        }
        Update: {
          color?: string
          created_at?: string
          date?: string
          dropoff_parent?: string | null
          end_time?: string | null
          id?: string
          member_id?: string | null
          pickup_parent?: string | null
          time?: string | null
          title?: string
        }
        Relationships: []
      }
      v1_groceries: {
        Row: {
          added_by: string | null
          category: string
          checked: boolean
          created_at: string
          id: string
          name: string
          qty: string | null
        }
        Insert: {
          added_by?: string | null
          category?: string
          checked?: boolean
          created_at?: string
          id: string
          name: string
          qty?: string | null
        }
        Update: {
          added_by?: string | null
          category?: string
          checked?: boolean
          created_at?: string
          id?: string
          name?: string
          qty?: string | null
        }
        Relationships: []
      }
      v1_grocery_requests: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          requested_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          notes?: string | null
          requested_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          requested_by?: string | null
          status?: string
        }
        Relationships: []
      }
      v1_meal_plan: {
        Row: {
          date: string
          meal: string
          slot: string
        }
        Insert: {
          date: string
          meal: string
          slot: string
        }
        Update: {
          date?: string
          meal?: string
          slot?: string
        }
        Relationships: []
      }
      v1_meal_recommendations: {
        Row: {
          category: string
          created_at: string
          id: string
          suggested_by: string | null
          title: string
          votes: Json
        }
        Insert: {
          category?: string
          created_at?: string
          id: string
          suggested_by?: string | null
          title: string
          votes?: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          suggested_by?: string | null
          title?: string
          votes?: Json
        }
        Relationships: []
      }
      v1_notes: {
        Row: {
          body: string
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          title?: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

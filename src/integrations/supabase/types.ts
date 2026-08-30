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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          module: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          module: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          context_window: number | null
          cost_input_per_1k: number | null
          cost_output_per_1k: number | null
          created_at: string
          display_name: string
          enabled: boolean
          id: string
          max_output: number | null
          model_id: string
          provider_slug: string
          task_tags: string[]
          updated_at: string
        }
        Insert: {
          context_window?: number | null
          cost_input_per_1k?: number | null
          cost_output_per_1k?: number | null
          created_at?: string
          display_name: string
          enabled?: boolean
          id?: string
          max_output?: number | null
          model_id: string
          provider_slug: string
          task_tags?: string[]
          updated_at?: string
        }
        Update: {
          context_window?: number | null
          cost_input_per_1k?: number | null
          cost_output_per_1k?: number | null
          created_at?: string
          display_name?: string
          enabled?: boolean
          id?: string
          max_output?: number | null
          model_id?: string
          provider_slug?: string
          task_tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_provider_slug_fkey"
            columns: ["provider_slug"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["slug"]
          },
        ]
      }
      ai_providers: {
        Row: {
          base_url: string | null
          consecutive_failures: number
          cooldown_until: string | null
          created_at: string
          enabled: boolean
          env_var: string
          health_status: string
          last_failure_at: string | null
          name: string
          priority: number
          slug: string
          updated_at: string
          weight: number
        }
        Insert: {
          base_url?: string | null
          consecutive_failures?: number
          cooldown_until?: string | null
          created_at?: string
          enabled?: boolean
          env_var: string
          health_status?: string
          last_failure_at?: string | null
          name: string
          priority?: number
          slug: string
          updated_at?: string
          weight?: number
        }
        Update: {
          base_url?: string | null
          consecutive_failures?: number
          cooldown_until?: string | null
          created_at?: string
          enabled?: boolean
          env_var?: string
          health_status?: string
          last_failure_at?: string | null
          name?: string
          priority?: number
          slug?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      ai_request_logs: {
        Row: {
          attempt: number
          completion_tokens: number | null
          created_at: string
          error: string | null
          estimated_cost_usd: number | null
          feature: string | null
          id: string
          latency_ms: number | null
          model_id: string | null
          prompt_tokens: number | null
          provider_slug: string | null
          success: boolean
          task_profile: string | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          attempt?: number
          completion_tokens?: number | null
          created_at?: string
          error?: string | null
          estimated_cost_usd?: number | null
          feature?: string | null
          id?: string
          latency_ms?: number | null
          model_id?: string | null
          prompt_tokens?: number | null
          provider_slug?: string | null
          success?: boolean
          task_profile?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          attempt?: number
          completion_tokens?: number | null
          created_at?: string
          error?: string | null
          estimated_cost_usd?: number | null
          feature?: string | null
          id?: string
          latency_ms?: number | null
          model_id?: string | null
          prompt_tokens?: number | null
          provider_slug?: string | null
          success?: boolean
          task_profile?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_routing_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          action: string
          created_at: string
          decided_at: string | null
          id: string
          item_id: string | null
          module: string
          note: string | null
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          decided_at?: string | null
          id?: string
          item_id?: string | null
          module: string
          note?: string | null
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          item_id?: string | null
          module?: string
          note?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
        ]
      }
      build_sessions: {
        Row: {
          category: string
          coins_spent: number
          created_at: string
          id: string
          metadata: Json
          payment_status: string
          preview: Json
          prompt: string
          result: Json
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          coins_spent?: number
          created_at?: string
          id?: string
          metadata?: Json
          payment_status?: string
          preview?: Json
          prompt: string
          result?: Json
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          coins_spent?: number
          created_at?: string
          id?: string
          metadata?: Json
          payment_status?: string
          preview?: Json
          prompt?: string
          result?: Json
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          build_session_id: string | null
          created_at: string
          id: string
          metadata: Json
          reason: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          build_session_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          build_session_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          metadata: Json
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          metadata?: Json
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          metadata?: Json
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      preview_claims: {
        Row: {
          category: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          content: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json
          project_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json
          project_id: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          created_at: string
          description: string | null
          estimated_credits: number
          id: string
          plan: Json
          project_id: string
          result: Json
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_credits?: number
          id?: string
          plan?: Json
          project_id: string
          result?: Json
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_credits?: number
          id?: string
          plan?: Json
          project_id?: string
          result?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          category: string | null
          challenges: string | null
          cloud_provider: string | null
          created_at: string
          database_type: string | null
          description: string | null
          framework: string | null
          github_url: string | null
          gitlab_url: string | null
          goals: string | null
          id: string
          language: string | null
          metadata: Json
          name: string
          project_url: string | null
          stage: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          category?: string | null
          challenges?: string | null
          cloud_provider?: string | null
          created_at?: string
          database_type?: string | null
          description?: string | null
          framework?: string | null
          github_url?: string | null
          gitlab_url?: string | null
          goals?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          name: string
          project_url?: string | null
          stage?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          category?: string | null
          challenges?: string | null
          cloud_provider?: string | null
          created_at?: string
          database_type?: string | null
          description?: string | null
          framework?: string | null
          github_url?: string | null
          gitlab_url?: string | null
          goals?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          name?: string
          project_url?: string | null
          stage?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_items: {
        Row: {
          content: Json
          created_at: string
          id: string
          metadata: Json
          module: string
          profile_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          metadata?: Json
          module: string
          profile_id?: string | null
          status?: string
          title?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          metadata?: Json
          module?: string
          profile_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_profiles: {
        Row: {
          config: Json
          created_at: string
          id: string
          module: string
          platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          module: string
          platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          module?: string
          platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          currency: string
          features: Json
          id: string
          is_active: boolean
          monthly_credits: number
          name: string
          paystack_plan_code: string | null
          price_cents: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          monthly_credits?: number
          name: string
          paystack_plan_code?: string | null
          price_cents: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          monthly_credits?: number
          name?: string
          paystack_plan_code?: string | null
          price_cents?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          coins_granted: number
          created_at: string
          expires_at: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          coins_granted?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          coins_granted?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_cents: number
          coins_added: number
          created_at: string
          currency: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          provider: Database["public"]["Enums"]["payment_provider"]
          reference: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Insert: {
          amount_cents?: number
          coins_added?: number
          created_at?: string
          currency?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          provider: Database["public"]["Enums"]["payment_provider"]
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Update: {
          amount_cents?: number
          coins_added?: number
          created_at?: string
          currency?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          daily_free_remaining: number
          daily_reset_at: string
          id: string
          lifetime_unlimited: boolean
          paid_balance: number
          total_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_free_remaining?: number
          daily_reset_at?: string
          id?: string
          lifetime_unlimited?: boolean
          paid_balance?: number
          total_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_free_remaining?: number
          daily_reset_at?: string
          id?: string
          lifetime_unlimited?: boolean
          paid_balance?: number
          total_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_plan: {
        Args: {
          _amount_cents: number
          _currency: string
          _cycle?: Database["public"]["Enums"]["billing_cycle"]
          _plan: Database["public"]["Enums"]["subscription_plan"]
          _provider: Database["public"]["Enums"]["payment_provider"]
          _reference: string
          _user_id: string
        }
        Returns: Json
      }
      admin_adjust_credits: {
        Args: { _delta: number; _reason: string; _target_user: string }
        Returns: Json
      }
      claim_preview: {
        Args: { _category?: string; _user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      spend_credit: {
        Args: {
          _amount?: number
          _build_session_id?: string
          _reason?: string
          _user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      billing_cycle: "monthly" | "yearly"
      payment_provider: "paystack" | "stripe" | "flutterwave" | "demo"
      subscription_plan:
        | "pro"
        | "enterprise"
        | "forever"
        | "starter"
        | "professional"
        | "business"
        | "premium"
        | "enterprise_1200"
        | "enterprise_2000"
      subscription_status: "active" | "cancelled" | "expired"
      transaction_status: "pending" | "success" | "failed"
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
    Enums: {
      app_role: ["admin", "user"],
      billing_cycle: ["monthly", "yearly"],
      payment_provider: ["paystack", "stripe", "flutterwave", "demo"],
      subscription_plan: [
        "pro",
        "enterprise",
        "forever",
        "starter",
        "professional",
        "business",
        "premium",
        "enterprise_1200",
        "enterprise_2000",
      ],
      subscription_status: ["active", "cancelled", "expired"],
      transaction_status: ["pending", "success", "failed"],
    },
  },
} as const

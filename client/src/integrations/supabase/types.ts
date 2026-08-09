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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          aadhaar: string | null
          age: number | null
          camp_id: string | null
          created_at: string
          disability: boolean
          district: string | null
          family_id: string | null
          full_name: string
          gender: string | null
          id: string
          medical_condition: string | null
          phone: string | null
          photo_url: string | null
          pregnancy: boolean
          priority: Database["public"]["Enums"]["priority_level"]
          qr_code: string
          updated_at: string
          user_id: string | null
          village: string | null
        }
        Insert: {
          aadhaar?: string | null
          age?: number | null
          camp_id?: string | null
          created_at?: string
          disability?: boolean
          district?: string | null
          family_id?: string | null
          full_name: string
          gender?: string | null
          id?: string
          medical_condition?: string | null
          phone?: string | null
          photo_url?: string | null
          pregnancy?: boolean
          priority?: Database["public"]["Enums"]["priority_level"]
          qr_code?: string
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Update: {
          aadhaar?: string | null
          age?: number | null
          camp_id?: string | null
          created_at?: string
          disability?: boolean
          district?: string | null
          family_id?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          medical_condition?: string | null
          phone?: string | null
          photo_url?: string | null
          pregnancy?: boolean
          priority?: Database["public"]["Enums"]["priority_level"]
          qr_code?: string
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaries_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaries_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      camps: {
        Row: {
          address: string | null
          capacity: number
          contact_number: string | null
          created_at: string
          current_occupancy: number
          district: string
          id: string
          latitude: number | null
          longitude: number | null
          medical_facility: boolean
          name: string
          officer_id: string | null
          status: Database["public"]["Enums"]["camp_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number
          contact_number?: string | null
          created_at?: string
          current_occupancy?: number
          district: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          medical_facility?: boolean
          name: string
          officer_id?: string | null
          status?: Database["public"]["Enums"]["camp_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number
          contact_number?: string | null
          created_at?: string
          current_occupancy?: number
          district?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          medical_facility?: boolean
          name?: string
          officer_id?: string | null
          status?: Database["public"]["Enums"]["camp_status"]
          updated_at?: string
        }
        Relationships: []
      }
      distribution_items: {
        Row: {
          distribution_id: string
          id: string
          quantity: number
          resource_id: string
        }
        Insert: {
          distribution_id: string
          id?: string
          quantity: number
          resource_id: string
        }
        Update: {
          distribution_id?: string
          id?: string
          quantity?: number
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_items_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_items_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          beneficiary_id: string
          camp_id: string | null
          created_at: string
          id: string
          notes: string | null
          volunteer_id: string | null
        }
        Insert: {
          beneficiary_id: string
          camp_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          volunteer_id?: string | null
        }
        Update: {
          beneficiary_id?: string
          camp_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distributions_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          approved_by: string | null
          camp_id: string | null
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          donor_contact: string | null
          donor_name: string
          id: string
          notes: string | null
          quantity: number
          resource_name: string
          status: Database["public"]["Enums"]["donation_status"]
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          camp_id?: string | null
          category: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          donor_contact?: string | null
          donor_name: string
          id?: string
          notes?: string | null
          quantity: number
          resource_name: string
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          camp_id?: string | null
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          donor_contact?: string | null
          donor_name?: string
          id?: string
          notes?: string | null
          quantity?: number
          resource_name?: string
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          camp_id: string | null
          contact_number: string | null
          created_at: string
          family_head_name: string
          id: string
          total_members: number
          updated_at: string
          village: string | null
        }
        Insert: {
          camp_id?: string | null
          contact_number?: string | null
          created_at?: string
          family_head_name: string
          id?: string
          total_members?: number
          updated_at?: string
          village?: string | null
        }
        Update: {
          camp_id?: string | null
          contact_number?: string | null
          created_at?: string
          family_head_name?: string
          id?: string
          total_members?: number
          updated_at?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string | null
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
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resource_requests: {
        Row: {
          camp_id: string
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          quantity: number
          reason: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          camp_id: string
          category: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          quantity: number
          reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          camp_id?: string
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          quantity?: number
          reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_requests_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          available_stock: number
          camp_id: string | null
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          distributed_stock: number
          expiry_date: string | null
          id: string
          low_stock_threshold: number
          name: string
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          available_stock?: number
          camp_id?: string | null
          category: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          distributed_stock?: number
          expiry_date?: string | null
          id?: string
          low_stock_threshold?: number
          name: string
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          available_stock?: number
          camp_id?: string | null
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          distributed_stock?: number
          expiry_date?: string | null
          id?: string
          low_stock_threshold?: number
          name?: string
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "camp_officer" | "volunteer" | "beneficiary"
      camp_status: "active" | "full" | "closed" | "planned"
      donation_status: "pending" | "approved" | "rejected"
      priority_level: "low" | "medium" | "high" | "critical"
      request_status: "pending" | "approved" | "rejected" | "fulfilled"
      resource_category:
        | "food"
        | "water"
        | "clothes"
        | "medicine"
        | "blankets"
        | "hygiene"
        | "baby_supplies"
        | "other"
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
      app_role: ["super_admin", "camp_officer", "volunteer", "beneficiary"],
      camp_status: ["active", "full", "closed", "planned"],
      donation_status: ["pending", "approved", "rejected"],
      priority_level: ["low", "medium", "high", "critical"],
      request_status: ["pending", "approved", "rejected", "fulfilled"],
      resource_category: [
        "food",
        "water",
        "clothes",
        "medicine",
        "blankets",
        "hygiene",
        "baby_supplies",
        "other",
      ],
    },
  },
} as const

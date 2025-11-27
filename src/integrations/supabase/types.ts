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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          assigned_salesperson_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          nip: string | null
          postal_code: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_salesperson_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          nip?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_salesperson_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          nip?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_salesperson_id_fkey"
            columns: ["assigned_salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_robots: {
        Row: {
          contract_id: string | null
          created_at: string | null
          id: string
          robot_id: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          id?: string
          robot_id?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          id?: string
          robot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_robots_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_robots_robot_id_fkey"
            columns: ["robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          billing_schedule: string | null
          client_id: string
          contract_number: string
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          monthly_payment: number | null
          payment_model: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"] | null
          terms: string | null
          updated_at: string | null
        }
        Insert: {
          billing_schedule?: string | null
          client_id: string
          contract_number: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          monthly_payment?: number | null
          payment_model?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          terms?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_schedule?: string | null
          client_id?: string
          contract_number?: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          monthly_payment?: number | null
          payment_model?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          terms?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_items: {
        Row: {
          created_at: string | null
          id: string
          offer_id: string | null
          quantity: number
          robot_model: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          offer_id?: string | null
          quantity?: number
          robot_model: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          offer_id?: string | null
          quantity?: number
          robot_model?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          offer_number: string
          status: Database["public"]["Enums"]["offer_status"] | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          offer_number: string
          status?: Database["public"]["Enums"]["offer_status"] | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          offer_number?: string
          status?: Database["public"]["Enums"]["offer_status"] | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      robots: {
        Row: {
          client_id: string | null
          created_at: string | null
          delivery_date: string | null
          id: string
          model: string
          purchase_date: string | null
          serial_number: string
          status: Database["public"]["Enums"]["robot_status"] | null
          type: string
          updated_at: string | null
          warehouse_intake_date: string | null
          warranty_end_date: string | null
          working_hours: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          model: string
          purchase_date?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["robot_status"] | null
          type: string
          updated_at?: string | null
          warehouse_intake_date?: string | null
          warranty_end_date?: string | null
          working_hours?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          model?: string
          purchase_date?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["robot_status"] | null
          type?: string
          updated_at?: string | null
          warehouse_intake_date?: string | null
          warranty_end_date?: string | null
          working_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "robots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tickets: {
        Row: {
          assigned_to: string | null
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          robot_id: string
          status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_number: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          robot_id: string
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_number: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          robot_id?: string
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_number?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_robot_id_fkey"
            columns: ["robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
        ]
      }
      task_robots: {
        Row: {
          created_at: string | null
          id: string
          robot_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          robot_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          robot_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_robots_robot_id_fkey"
            columns: ["robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_robots_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_title_dictionary: {
        Row: {
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          call_attempted: boolean | null
          call_successful: boolean | null
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          offer_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          call_attempted?: boolean | null
          call_successful?: boolean | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          call_attempted?: boolean | null
          call_successful?: boolean | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "manager" | "salesperson" | "technician"
      contract_status:
        | "draft"
        | "pending_signature"
        | "active"
        | "expired"
        | "cancelled"
      offer_status: "draft" | "sent" | "modified" | "accepted" | "rejected"
      robot_status: "in_warehouse" | "delivered" | "in_service" | "maintenance"
      task_status: "pending" | "in_progress" | "completed" | "overdue"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["admin", "manager", "salesperson", "technician"],
      contract_status: [
        "draft",
        "pending_signature",
        "active",
        "expired",
        "cancelled",
      ],
      offer_status: ["draft", "sent", "modified", "accepted", "rejected"],
      robot_status: ["in_warehouse", "delivered", "in_service", "maintenance"],
      task_status: ["pending", "in_progress", "completed", "overdue"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const

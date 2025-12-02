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
      client_assigned_tags: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          tag_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          tag_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assigned_tags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assigned_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "client_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      client_categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean | null
          notes: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tags: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "client_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          assigned_salesperson_id: string | null
          balance: number | null
          billing_person_email: string | null
          billing_person_name: string | null
          billing_person_phone: string | null
          city: string | null
          country: string | null
          created_at: string | null
          general_email: string | null
          general_phone: string | null
          id: string
          name: string
          nip: string | null
          postal_code: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          reseller_id: string | null
          status: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          assigned_salesperson_id?: string | null
          balance?: number | null
          billing_person_email?: string | null
          billing_person_name?: string | null
          billing_person_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          general_email?: string | null
          general_phone?: string | null
          id?: string
          name: string
          nip?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          reseller_id?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          assigned_salesperson_id?: string | null
          balance?: number | null
          billing_person_email?: string | null
          billing_person_name?: string | null
          billing_person_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          general_email?: string | null
          general_phone?: string | null
          id?: string
          name?: string
          nip?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          reseller_id?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_salesperson_id_fkey"
            columns: ["assigned_salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_email_history: {
        Row: {
          contract_version_id: string
          created_at: string
          id: string
          notes: string | null
          sent_at: string
          sent_by: string | null
          sent_to: string
          status: string
        }
        Insert: {
          contract_version_id: string
          created_at?: string
          id?: string
          notes?: string | null
          sent_at?: string
          sent_by?: string | null
          sent_to: string
          status?: string
        }
        Update: {
          contract_version_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          sent_at?: string
          sent_by?: string | null
          sent_to?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_email_history_contract_version_id_fkey"
            columns: ["contract_version_id"]
            isOneToOne: false
            referencedRelation: "contract_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_email_history_sent_by_fkey"
            columns: ["sent_by"]
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
      contract_templates: {
        Row: {
          contract_type: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          template_content: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          contract_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          template_content: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          contract_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          template_content?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_versions: {
        Row: {
          contract_id: string
          file_path: string
          generated_at: string
          generated_by: string | null
          id: string
          notes: string | null
          version_number: number
        }
        Insert: {
          contract_id: string
          file_path: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          notes?: string | null
          version_number: number
        }
        Update: {
          contract_id?: string
          file_path?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          notes?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_versions_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          implementation_cost: number | null
          monthly_payment: number | null
          other_services_cost: number | null
          other_services_description: string | null
          payment_model: string | null
          reseller_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"] | null
          terms: string | null
          total_monthly_contracted: number | null
          total_purchase_value: number | null
          updated_at: string | null
          warranty_cost: number | null
        }
        Insert: {
          billing_schedule?: string | null
          client_id: string
          contract_number: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          implementation_cost?: number | null
          monthly_payment?: number | null
          other_services_cost?: number | null
          other_services_description?: string | null
          payment_model?: string | null
          reseller_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          terms?: string | null
          total_monthly_contracted?: number | null
          total_purchase_value?: number | null
          updated_at?: string | null
          warranty_cost?: number | null
        }
        Update: {
          billing_schedule?: string | null
          client_id?: string
          contract_number?: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          implementation_cost?: number | null
          monthly_payment?: number | null
          other_services_cost?: number | null
          other_services_description?: string | null
          payment_model?: string | null
          reseller_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          terms?: string | null
          total_monthly_contracted?: number | null
          total_purchase_value?: number | null
          updated_at?: string | null
          warranty_cost?: number | null
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
          {
            foreignKeyName: "contracts_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_gross: number
          amount_net: number
          client_id: string
          created_at: string | null
          currency: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount_gross: number
          amount_net: number
          client_id: string
          created_at?: string | null
          currency?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          notes?: string | null
          paid_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_gross?: number
          amount_net?: number
          client_id?: string
          created_at?: string | null
          currency?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          item_type: string
          name: string
          price_net: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          item_type: string
          name: string
          price_net?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          item_type?: string
          name?: string
          price_net?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: []
      }
      lease_month_dictionary: {
        Row: {
          created_at: string | null
          id: string
          months: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          months: number
        }
        Update: {
          created_at?: string | null
          id?: string
          months?: number
        }
        Relationships: []
      }
      lease_pricing: {
        Row: {
          created_at: string | null
          evidence_price_eur_net: number | null
          evidence_price_pln_net: number | null
          evidence_price_usd_net: number | null
          id: string
          months: number
          price_eur_net: number
          price_pln_net: number
          price_usd_net: number
          robot_pricing_id: string
        }
        Insert: {
          created_at?: string | null
          evidence_price_eur_net?: number | null
          evidence_price_pln_net?: number | null
          evidence_price_usd_net?: number | null
          id?: string
          months: number
          price_eur_net: number
          price_pln_net: number
          price_usd_net: number
          robot_pricing_id: string
        }
        Update: {
          created_at?: string | null
          evidence_price_eur_net?: number | null
          evidence_price_pln_net?: number | null
          evidence_price_usd_net?: number | null
          id?: string
          months?: number
          price_eur_net?: number
          price_pln_net?: number
          price_usd_net?: number
          robot_pricing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_pricing_robot_pricing_id_fkey"
            columns: ["robot_pricing_id"]
            isOneToOne: false
            referencedRelation: "robot_pricing"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturer_dictionary: {
        Row: {
          created_at: string | null
          id: string
          manufacturer_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manufacturer_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manufacturer_name?: string
        }
        Relationships: []
      }
      meeting_type_dictionary: {
        Row: {
          created_at: string | null
          id: string
          type_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          type_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          type_name?: string
        }
        Relationships: []
      }
      monthly_revenue: {
        Row: {
          actual_amount: number
          created_at: string
          created_by: string | null
          currency: string
          forecast_amount: number
          id: string
          month: number
          notes: string | null
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          actual_amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          forecast_amount?: number
          id?: string
          month: number
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          actual_amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          forecast_amount?: number
          id?: string
          month?: number
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_revenue_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_revenue_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_robots_delivered: {
        Row: {
          actual_units: number
          created_at: string
          created_by: string | null
          forecast_units: number
          id: string
          month: number
          notes: string | null
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          actual_units?: number
          created_at?: string
          created_by?: string | null
          forecast_units?: number
          id?: string
          month: number
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          actual_units?: number
          created_at?: string
          created_by?: string | null
          forecast_units?: number
          id?: string
          month?: number
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_robots_delivered_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_robots_delivered_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_sales_funnel: {
        Row: {
          actual_count: number
          actual_value: number
          created_at: string
          created_by: string | null
          currency: string
          forecast_count: number
          forecast_value: number
          id: string
          month: number
          notes: string | null
          stage: string
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          actual_count?: number
          actual_value?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          forecast_count?: number
          forecast_value?: number
          id?: string
          month: number
          notes?: string | null
          stage: string
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          actual_count?: number
          actual_value?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          forecast_count?: number
          forecast_value?: number
          id?: string
          month?: number
          notes?: string | null
          stage?: string
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_sales_funnel_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_sales_funnel_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_items: {
        Row: {
          contract_type: string | null
          created_at: string | null
          id: string
          lease_months: number | null
          offer_id: string | null
          quantity: number
          robot_model: string
          unit_price: number
          warranty_months: number | null
          warranty_price: number | null
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          id?: string
          lease_months?: number | null
          offer_id?: string | null
          quantity?: number
          robot_model: string
          unit_price: number
          warranty_months?: number | null
          warranty_price?: number | null
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          id?: string
          lease_months?: number | null
          offer_id?: string | null
          quantity?: number
          robot_model?: string
          unit_price?: number
          warranty_months?: number | null
          warranty_price?: number | null
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
      offer_versions: {
        Row: {
          file_path: string
          generated_at: string
          generated_by: string | null
          id: string
          notes: string | null
          offer_id: string
          version_number: number
        }
        Insert: {
          file_path: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          notes?: string | null
          offer_id: string
          version_number: number
        }
        Update: {
          file_path?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          notes?: string | null
          offer_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_generated_by"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_offer"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_versions_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          delivery_date: string | null
          deployment_location: string | null
          follow_up_notes: string | null
          id: string
          initial_payment: number | null
          last_contact_date: string | null
          lead_source: string | null
          lead_status: string | null
          next_action_date: string | null
          notes: string | null
          offer_number: string
          person_contact: string | null
          prepayment_amount: number | null
          prepayment_percent: number | null
          reseller_id: string | null
          stage: string
          total_price: number | null
          updated_at: string | null
          warranty_period: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_date?: string | null
          deployment_location?: string | null
          follow_up_notes?: string | null
          id?: string
          initial_payment?: number | null
          last_contact_date?: string | null
          lead_source?: string | null
          lead_status?: string | null
          next_action_date?: string | null
          notes?: string | null
          offer_number: string
          person_contact?: string | null
          prepayment_amount?: number | null
          prepayment_percent?: number | null
          reseller_id?: string | null
          stage?: string
          total_price?: number | null
          updated_at?: string | null
          warranty_period?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_date?: string | null
          deployment_location?: string | null
          follow_up_notes?: string | null
          id?: string
          initial_payment?: number | null
          last_contact_date?: string | null
          lead_source?: string | null
          lead_status?: string | null
          next_action_date?: string | null
          notes?: string | null
          offer_number?: string
          person_contact?: string | null
          prepayment_amount?: number | null
          prepayment_percent?: number | null
          reseller_id?: string | null
          stage?: string
          total_price?: number | null
          updated_at?: string | null
          warranty_period?: number | null
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
          {
            foreignKeyName: "offers_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          currency: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_number: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          payment_number: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_goals: {
        Row: {
          assigned_user_id: string | null
          created_at: string | null
          created_by: string | null
          current_value: number | null
          description: string | null
          end_date: string
          goal_type: string
          id: string
          is_team_goal: boolean | null
          period_type: string
          start_date: string
          status: string | null
          target_value: number
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          end_date: string
          goal_type: string
          id?: string
          is_team_goal?: boolean | null
          period_type: string
          start_date: string
          status?: string | null
          target_value: number
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string
          goal_type?: string
          id?: string
          is_team_goal?: boolean | null
          period_type?: string
          start_date?: string
          status?: string | null
          target_value?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_goals_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_created_by_fkey"
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
      report_subscriptions: {
        Row: {
          created_at: string | null
          created_by: string | null
          enabled: boolean
          frequency: string
          id: string
          last_sent_at: string | null
          recipient_email: string
          recipient_name: string
          report_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean
          frequency: string
          id?: string
          last_sent_at?: string | null
          recipient_email: string
          recipient_name: string
          report_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean
          frequency?: string
          id?: string
          last_sent_at?: string | null
          recipient_email?: string
          recipient_name?: string
          report_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_subscriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          address: string | null
          assigned_salesperson_id: string | null
          balance: number | null
          billing_person_email: string | null
          billing_person_name: string | null
          billing_person_phone: string | null
          city: string | null
          country: string | null
          created_at: string
          general_email: string | null
          general_phone: string | null
          id: string
          name: string
          nip: string | null
          postal_code: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          status: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          assigned_salesperson_id?: string | null
          balance?: number | null
          billing_person_email?: string | null
          billing_person_name?: string | null
          billing_person_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          general_email?: string | null
          general_phone?: string | null
          id?: string
          name: string
          nip?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          status?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          assigned_salesperson_id?: string | null
          balance?: number | null
          billing_person_email?: string | null
          billing_person_name?: string | null
          billing_person_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          general_email?: string | null
          general_phone?: string | null
          id?: string
          name?: string
          nip?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          status?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      robot_pricing: {
        Row: {
          created_at: string | null
          evidence_price_eur_net: number | null
          evidence_price_pln_net: number | null
          evidence_price_usd_net: number | null
          id: string
          lowest_price_eur_net: number | null
          lowest_price_pln_net: number | null
          lowest_price_usd_net: number | null
          promo_price_eur_net: number | null
          promo_price_pln_net: number | null
          promo_price_usd_net: number | null
          robot_model: string
          sale_price_eur_net: number
          sale_price_pln_net: number
          sale_price_usd_net: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evidence_price_eur_net?: number | null
          evidence_price_pln_net?: number | null
          evidence_price_usd_net?: number | null
          id?: string
          lowest_price_eur_net?: number | null
          lowest_price_pln_net?: number | null
          lowest_price_usd_net?: number | null
          promo_price_eur_net?: number | null
          promo_price_pln_net?: number | null
          promo_price_usd_net?: number | null
          robot_model: string
          sale_price_eur_net: number
          sale_price_pln_net: number
          sale_price_usd_net: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evidence_price_eur_net?: number | null
          evidence_price_pln_net?: number | null
          evidence_price_usd_net?: number | null
          id?: string
          lowest_price_eur_net?: number | null
          lowest_price_pln_net?: number | null
          lowest_price_usd_net?: number | null
          promo_price_eur_net?: number | null
          promo_price_pln_net?: number | null
          promo_price_usd_net?: number | null
          robot_model?: string
          sale_price_eur_net?: number
          sale_price_pln_net?: number
          sale_price_usd_net?: number
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
          manufacturer: string | null
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
          manufacturer?: string | null
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
          manufacturer?: string | null
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
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
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
          meeting_date_time: string | null
          meeting_type: string | null
          notes: string | null
          offer_id: string | null
          person_to_meet: string | null
          place: string | null
          reminder_date_time: string | null
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
          meeting_date_time?: string | null
          meeting_type?: string | null
          notes?: string | null
          offer_id?: string | null
          person_to_meet?: string | null
          place?: string | null
          reminder_date_time?: string | null
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
          meeting_date_time?: string | null
          meeting_type?: string | null
          notes?: string | null
          offer_id?: string | null
          person_to_meet?: string | null
          place?: string | null
          reminder_date_time?: string | null
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

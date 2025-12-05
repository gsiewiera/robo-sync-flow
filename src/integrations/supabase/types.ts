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
      campaign_clients: {
        Row: {
          campaign_id: string
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          campaign_id: string
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          campaign_id?: string
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_clients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_mailing_logs: {
        Row: {
          client_id: string
          email: string
          error: string | null
          id: string
          mailing_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          client_id: string
          email: string
          error?: string | null
          id?: string
          mailing_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          client_id?: string
          email?: string
          error?: string | null
          id?: string
          mailing_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_mailing_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_mailing_logs_mailing_id_fkey"
            columns: ["mailing_id"]
            isOneToOne: false
            referencedRelation: "campaign_mailings"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_mailings: {
        Row: {
          campaign_id: string
          created_at: string
          failed_count: number
          id: string
          name: string
          sent_at: string | null
          sent_by: string | null
          sent_count: number
          status: string
          template_id: string
          total_count: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          failed_count?: number
          id?: string
          name: string
          sent_at?: string | null
          sent_by?: string | null
          sent_count?: number
          status?: string
          template_id: string
          total_count?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          failed_count?: number
          id?: string
          name?: string
          sent_at?: string | null
          sent_by?: string | null
          sent_count?: number
          status?: string
          template_id?: string
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_mailings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_mailings_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_mailings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          client_count: number
          created_at: string
          created_by: string | null
          filters: Json
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          client_count?: number
          created_at?: string
          created_by?: string | null
          filters?: Json
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          client_count?: number
          created_at?: string
          created_by?: string | null
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_addresses: {
        Row: {
          address: string
          address_type: string
          city: string | null
          client_id: string
          country: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          label: string | null
          notes: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address: string
          address_type?: string
          city?: string | null
          client_id: string
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          notes?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          address_type?: string
          city?: string | null
          client_id?: string
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          notes?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_addresses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
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
      client_client_types: {
        Row: {
          client_id: string
          client_type_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          client_id: string
          client_type_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          client_id?: string
          client_type_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_client_types_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_client_types_client_type_id_fkey"
            columns: ["client_type_id"]
            isOneToOne: false
            referencedRelation: "client_type_dictionary"
            referencedColumns: ["id"]
          },
        ]
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
      client_documents: {
        Row: {
          category: string | null
          client_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_markets: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          market_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          market_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          market_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_markets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_markets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market_dictionary"
            referencedColumns: ["id"]
          },
        ]
      }
      client_segments: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          segment_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          segment_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_segments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segment_dictionary"
            referencedColumns: ["id"]
          },
        ]
      }
      client_size_dictionary: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      client_sizes: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          size_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          size_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          size_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_sizes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_sizes_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "client_size_dictionary"
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
      client_type_dictionary: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          assigned_salesperson_id: string | null
          assigned_sdm_id: string | null
          balance: number | null
          billing_person_email: string | null
          billing_person_name: string | null
          billing_person_phone: string | null
          city: string | null
          client_type: string | null
          country: string | null
          created_at: string | null
          general_email: string | null
          general_phone: string | null
          id: string
          market: string | null
          name: string
          nip: string | null
          postal_code: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          reseller_id: string | null
          segment: string | null
          status: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          assigned_salesperson_id?: string | null
          assigned_sdm_id?: string | null
          balance?: number | null
          billing_person_email?: string | null
          billing_person_name?: string | null
          billing_person_phone?: string | null
          city?: string | null
          client_type?: string | null
          country?: string | null
          created_at?: string | null
          general_email?: string | null
          general_phone?: string | null
          id?: string
          market?: string | null
          name: string
          nip?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          reseller_id?: string | null
          segment?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          assigned_salesperson_id?: string | null
          assigned_sdm_id?: string | null
          balance?: number | null
          billing_person_email?: string | null
          billing_person_name?: string | null
          billing_person_phone?: string | null
          city?: string | null
          client_type?: string | null
          country?: string | null
          created_at?: string | null
          general_email?: string | null
          general_phone?: string | null
          id?: string
          market?: string | null
          name?: string
          nip?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          reseller_id?: string | null
          segment?: string | null
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
      company_addresses: {
        Row: {
          address: string
          address_type: string
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          label: string | null
          notes: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address: string
          address_type?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          notes?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          address_type?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          notes?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_info: {
        Row: {
          bank_account_eur: string | null
          bank_account_pln: string | null
          bank_account_usd: string | null
          bank_iban_eur: string | null
          bank_iban_pln: string | null
          bank_iban_usd: string | null
          bank_name_eur: string | null
          bank_name_pln: string | null
          bank_name_usd: string | null
          bank_swift_eur: string | null
          bank_swift_pln: string | null
          bank_swift_usd: string | null
          company_name: string | null
          created_at: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          krs: string | null
          linkedin_url: string | null
          logo_path: string | null
          main_email: string | null
          main_phone: string | null
          nip: string | null
          regon: string | null
          twitter_url: string | null
          updated_at: string
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          bank_account_eur?: string | null
          bank_account_pln?: string | null
          bank_account_usd?: string | null
          bank_iban_eur?: string | null
          bank_iban_pln?: string | null
          bank_iban_usd?: string | null
          bank_name_eur?: string | null
          bank_name_pln?: string | null
          bank_name_usd?: string | null
          bank_swift_eur?: string | null
          bank_swift_pln?: string | null
          bank_swift_usd?: string | null
          company_name?: string | null
          created_at?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          krs?: string | null
          linkedin_url?: string | null
          logo_path?: string | null
          main_email?: string | null
          main_phone?: string | null
          nip?: string | null
          regon?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          bank_account_eur?: string | null
          bank_account_pln?: string | null
          bank_account_usd?: string | null
          bank_iban_eur?: string | null
          bank_iban_pln?: string | null
          bank_iban_usd?: string | null
          bank_name_eur?: string | null
          bank_name_pln?: string | null
          bank_name_usd?: string | null
          bank_swift_eur?: string | null
          bank_swift_pln?: string | null
          bank_swift_usd?: string | null
          company_name?: string | null
          created_at?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          krs?: string | null
          linkedin_url?: string | null
          logo_path?: string | null
          main_email?: string | null
          main_phone?: string | null
          nip?: string | null
          regon?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
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
      contract_line_items: {
        Row: {
          contract_id: string
          contract_type: string | null
          created_at: string
          id: string
          lease_months: number | null
          monthly_price: number | null
          quantity: number
          robot_model: string
          unit_price: number
        }
        Insert: {
          contract_id: string
          contract_type?: string | null
          created_at?: string
          id?: string
          lease_months?: number | null
          monthly_price?: number | null
          quantity?: number
          robot_model: string
          unit_price: number
        }
        Update: {
          contract_id?: string
          contract_type?: string | null
          created_at?: string
          id?: string
          lease_months?: number | null
          monthly_price?: number | null
          quantity?: number
          robot_model?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_line_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
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
      contract_status_dictionary: {
        Row: {
          color: string | null
          created_at: string | null
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
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
      document_category_dictionary: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      market_dictionary: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
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
      notes: {
        Row: {
          client_id: string | null
          commitments_client: string | null
          commitments_us: string | null
          contact_person: string | null
          contact_type: string
          created_at: string
          id: string
          key_points: string | null
          needs: string | null
          next_step: string | null
          note: string | null
          note_date: string
          offer_id: string | null
          priority: string
          risks: string | null
          salesperson_id: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          commitments_client?: string | null
          commitments_us?: string | null
          contact_person?: string | null
          contact_type?: string
          created_at?: string
          id?: string
          key_points?: string | null
          needs?: string | null
          next_step?: string | null
          note?: string | null
          note_date?: string
          offer_id?: string | null
          priority?: string
          risks?: string | null
          salesperson_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          commitments_client?: string | null
          commitments_us?: string | null
          contact_person?: string | null
          contact_type?: string
          created_at?: string
          id?: string
          key_points?: string | null
          needs?: string | null
          next_step?: string | null
          note?: string | null
          note_date?: string
          offer_id?: string | null
          priority?: string
          risks?: string | null
          salesperson_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_salesperson_id_fkey"
            columns: ["salesperson_id"]
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
          assigned_salesperson_id: string | null
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
          assigned_salesperson_id?: string | null
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
          assigned_salesperson_id?: string | null
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
            foreignKeyName: "offers_assigned_salesperson_id_fkey"
            columns: ["assigned_salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          address: string | null
          assigned_company_address_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_company_address_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_company_address_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_company_address_id_fkey"
            columns: ["assigned_company_address_id"]
            isOneToOne: false
            referencedRelation: "company_addresses"
            referencedColumns: ["id"]
          },
        ]
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
      robot_documents: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          notes: string | null
          robot_id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          robot_id: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          robot_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "robot_documents_robot_id_fkey"
            columns: ["robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "robot_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      robot_model_dictionary: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean | null
          manufacturer: string | null
          model_name: string
          stock: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          model_name: string
          stock?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          model_name?: string
          stock?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      robot_model_documents: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          notes: string | null
          robot_model_id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          robot_model_id: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          robot_model_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "robot_model_documents_robot_model_id_fkey"
            columns: ["robot_model_id"]
            isOneToOne: false
            referencedRelation: "robot_model_dictionary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "robot_model_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          try_buy_price_eur_net: number | null
          try_buy_price_pln_net: number | null
          try_buy_price_usd_net: number | null
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
          try_buy_price_eur_net?: number | null
          try_buy_price_pln_net?: number | null
          try_buy_price_usd_net?: number | null
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
          try_buy_price_eur_net?: number | null
          try_buy_price_pln_net?: number | null
          try_buy_price_usd_net?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      robot_status_dictionary: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      robot_type_dictionary: {
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
      segment_dictionary: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      service_ticket_documents: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          notes: string | null
          ticket_id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          ticket_id: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          ticket_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_documents_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          due_date: string | null
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
          due_date?: string | null
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
          due_date?: string | null
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
      system_numeric_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
        }
        Relationships: []
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
      system_text_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
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
          note_id: string | null
          notes: string | null
          offer_id: string | null
          person_to_meet: string | null
          place: string | null
          priority: string | null
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
          note_id?: string | null
          notes?: string | null
          offer_id?: string | null
          person_to_meet?: string | null
          place?: string | null
          priority?: string | null
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
          note_id?: string | null
          notes?: string | null
          offer_id?: string | null
          person_to_meet?: string | null
          place?: string | null
          priority?: string | null
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
            foreignKeyName: "tasks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
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
      app_role:
        | "admin"
        | "manager"
        | "salesperson"
        | "technician"
        | "service_delivery_manager"
      contract_status:
        | "draft"
        | "pending_signature"
        | "active"
        | "expired"
        | "cancelled"
      offer_status: "draft" | "sent" | "modified" | "accepted" | "rejected"
      robot_status:
        | "delivered"
        | "in_service"
        | "active"
        | "decommissioned"
        | "try_and_buy"
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
      app_role: [
        "admin",
        "manager",
        "salesperson",
        "technician",
        "service_delivery_manager",
      ],
      contract_status: [
        "draft",
        "pending_signature",
        "active",
        "expired",
        "cancelled",
      ],
      offer_status: ["draft", "sent", "modified", "accepted", "rejected"],
      robot_status: [
        "delivered",
        "in_service",
        "active",
        "decommissioned",
        "try_and_buy",
      ],
      task_status: ["pending", "in_progress", "completed", "overdue"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const

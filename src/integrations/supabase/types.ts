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
          details: Json
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          message: string | null
          percent: number
          user_id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          message?: string | null
          percent: number
          user_id: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          message?: string | null
          percent?: number
          user_id?: string
        }
        Relationships: []
      }
      customer_photos: {
        Row: {
          approved: boolean
          caption: string | null
          consent: boolean
          created_at: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          caption?: string | null
          consent?: boolean
          created_at?: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          approved?: boolean
          caption?: string | null
          consent?: boolean
          created_at?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: []
      }
      input_presets: {
        Row: {
          id: string
          updated_at: string
          values: Json
        }
        Insert: {
          id: string
          updated_at?: string
          values?: Json
        }
        Update: {
          id?: string
          updated_at?: string
          values?: Json
        }
        Relationships: []
      }
      merchants: {
        Row: {
          active: boolean
          created_at: string
          id: string
          location: string | null
          logo_url: string | null
          owner_id: string
          shop_name: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          location?: string | null
          logo_url?: string | null
          owner_id: string
          shop_name: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          location?: string | null
          logo_url?: string | null
          owner_id?: string
          shop_name?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          customer_address: string | null
          customer_id: string
          customer_name: string | null
          customer_phone: string | null
          delivery_agent_id: string | null
          discount: number
          id: string
          items: Json
          status: Database["public"]["Enums"]["order_status"]
          total: number
          tracking_note: string | null
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_address?: string | null
          customer_id: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_agent_id?: string | null
          discount?: number
          id?: string
          items?: Json
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          tracking_note?: string | null
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_address?: string | null
          customer_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_agent_id?: string | null
          discount?: number
          id?: string
          items?: Json
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          tracking_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_offers: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string
          id: string
          percent: number
          product_id: string | null
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at: string
          id?: string
          percent: number
          product_id?: string | null
          title?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          percent?: number
          product_id?: string | null
          title?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category: string
          colors: string[]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          merchant_id: string | null
          name: string
          price: number
          sizes: string[]
          stock: number
          updated_at: string
          variants: Json
          vendor_id: string
        }
        Insert: {
          active?: boolean
          category?: string
          colors?: string[]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          merchant_id?: string | null
          name: string
          price: number
          sizes?: string[]
          stock?: number
          updated_at?: string
          variants?: Json
          vendor_id: string
        }
        Update: {
          active?: boolean
          category?: string
          colors?: string[]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          merchant_id?: string | null
          name?: string
          price?: number
          sizes?: string[]
          stock?: number
          updated_at?: string
          variants?: Json
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean
          phone: string | null
          plain_password: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_banned?: boolean
          phone?: string | null
          plain_password?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean
          phone?: string | null
          plain_password?: string | null
          username?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          email: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          quick_links: Json
          tiktok_url: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string | null
          email?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          quick_links?: Json
          tiktok_url?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          address?: string | null
          email?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          quick_links?: Json
          tiktok_url?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
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
    }
    Enums: {
      app_role: "admin" | "vendor" | "customer" | "delivery"
      order_status:
        | "pending"
        | "approved"
        | "assigned"
        | "in_transit"
        | "delivered"
        | "cancelled"
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
      app_role: ["admin", "vendor", "customer", "delivery"],
      order_status: [
        "pending",
        "approved",
        "assigned",
        "in_transit",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const

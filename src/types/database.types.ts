export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      addresses: {
        Row: {
          calle: string
          ciudad: string
          codigo_postal: string
          created_at: string
          es_predeterminada: boolean
          id: string
          numero: string | null
          pais: string
          piso_depto: string | null
          provincia: string
          telefono_contacto: string | null
          user_id: string
        }
        Insert: {
          calle: string
          ciudad: string
          codigo_postal: string
          created_at?: string
          es_predeterminada?: boolean
          id?: string
          numero?: string | null
          pais?: string
          piso_depto?: string | null
          provincia: string
          telefono_contacto?: string | null
          user_id: string
        }
        Update: {
          calle?: string
          ciudad?: string
          codigo_postal?: string
          created_at?: string
          es_predeterminada?: boolean
          id?: string
          numero?: string | null
          pais?: string
          piso_depto?: string | null
          provincia?: string
          telefono_contacto?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          accion: string
          admin_id: string | null
          created_at: string
          entidad: string
          entidad_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          accion: string
          admin_id?: string | null
          created_at?: string
          entidad: string
          entidad_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          accion?: string
          admin_id?: string | null
          created_at?: string
          entidad?: string
          entidad_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          monto_minimo_compra: number
          tipo: string
          usos_actuales: number
          usos_maximos: number | null
          valor: number
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          monto_minimo_compra?: number
          tipo: string
          usos_actuales?: number
          usos_maximos?: number | null
          valor: number
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          monto_minimo_compra?: number
          tipo?: string
          usos_actuales?: number
          usos_maximos?: number | null
          valor?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          nombre_estampado: string | null
          numero_estampado: string | null
          order_id: string
          precio_unitario: number
          product_nombre_snapshot: string
          product_variant_id: string
          subtotal_item: number
          talle_snapshot: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          nombre_estampado?: string | null
          numero_estampado?: string | null
          order_id: string
          precio_unitario: number
          product_nombre_snapshot: string
          product_variant_id: string
          subtotal_item: number
          talle_snapshot: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          nombre_estampado?: string | null
          numero_estampado?: string | null
          order_id?: string
          precio_unitario?: number
          product_nombre_snapshot?: string
          product_variant_id?: string
          subtotal_item?: number
          talle_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          confirmation_token: string
          costo_envio: number
          coupon_id: string | null
          created_at: string
          descuento: number
          direccion_envio: Json | null
          estado: string
          guest_email: string | null
          guest_phone: string | null
          id: string
          metodo_entrega: string
          moneda: string
          mp_preference_id: string | null
          notas: string | null
          order_number: string
          reserva_expira_at: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          confirmation_token?: string
          costo_envio?: number
          coupon_id?: string | null
          created_at?: string
          descuento?: number
          direccion_envio?: Json | null
          estado?: string
          guest_email?: string | null
          guest_phone?: string | null
          id?: string
          metodo_entrega: string
          moneda?: string
          mp_preference_id?: string | null
          notas?: string | null
          order_number: string
          reserva_expira_at?: string | null
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confirmation_token?: string
          costo_envio?: number
          coupon_id?: string | null
          created_at?: string
          descuento?: number
          direccion_envio?: Json | null
          estado?: string
          guest_email?: string | null
          guest_phone?: string | null
          id?: string
          metodo_entrega?: string
          moneda?: string
          mp_preference_id?: string | null
          notas?: string | null
          order_number?: string
          reserva_expira_at?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          estado: string
          id: string
          moneda: string
          monto: number
          monto_reembolsado: number
          mp_merchant_order_id: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          order_id: string
          proveedor: string
          raw_webhook_payload: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado: string
          id?: string
          moneda?: string
          monto: number
          monto_reembolsado?: number
          mp_merchant_order_id?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_id: string
          proveedor?: string
          raw_webhook_payload?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          moneda?: string
          monto?: number
          monto_reembolsado?: number
          mp_merchant_order_id?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_id?: string
          proveedor?: string
          raw_webhook_payload?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          orden: number
          product_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          orden?: number
          product_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          orden?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          aprobado: boolean
          calificacion: number
          comentario: string | null
          created_at: string
          id: string
          nombre_autor: string
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aprobado?: boolean
          calificacion: number
          comentario?: string | null
          created_at?: string
          id?: string
          nombre_autor?: string
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aprobado?: boolean
          calificacion?: number
          comentario?: string | null
          created_at?: string
          id?: string
          nombre_autor?: string
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          product_id: string
          sku: string
          stock: number
          stock_minimo: number
          talle: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          sku: string
          stock?: number
          stock_minimo?: number
          talle: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          sku?: string
          stock?: number
          stock_minimo?: number
          talle?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          activo: boolean
          club: string | null
          created_at: string
          descripcion: string | null
          destacado: boolean
          id: string
          liga: string | null
          nombre: string
          permite_personalizacion: boolean
          precio: number
          search_vector: unknown
          slug: string
          temporada: string | null
          tipo: Database["public"]["Enums"]["product_tipo"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          club?: string | null
          created_at?: string
          descripcion?: string | null
          destacado?: boolean
          id?: string
          liga?: string | null
          nombre: string
          permite_personalizacion?: boolean
          precio: number
          search_vector?: unknown
          slug: string
          temporada?: string | null
          tipo: Database["public"]["Enums"]["product_tipo"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          club?: string | null
          created_at?: string
          descripcion?: string | null
          destacado?: boolean
          id?: string
          liga?: string | null
          nombre?: string
          permite_personalizacion?: boolean
          precio?: number
          search_vector?: unknown
          slug?: string
          temporada?: string | null
          tipo?: Database["public"]["Enums"]["product_tipo"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string | null
          created_at: string
          id: string
          nombre: string | null
          role: Database["public"]["Enums"]["user_role"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellido?: string | null
          created_at?: string
          id: string
          nombre?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string | null
          created_at?: string
          id?: string
          nombre?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          clave: string
          intentos: number
          ventana_inicio: string
        }
        Insert: {
          clave: string
          intentos?: number
          ventana_inicio?: string
        }
        Update: {
          clave?: string
          intentos?: number
          ventana_inicio?: string
        }
        Relationships: []
      }
      wishlists: {
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
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
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
      check_rate_limit: {
        Args: {
          p_clave: string
          p_max_intentos: number
          p_ventana_segundos: number
        }
        Returns: boolean
      }
      create_order_and_reserve_stock: {
        Args: {
          p_costo_envio: number
          p_coupon_codigo?: string
          p_direccion_envio: Json
          p_guest_email: string
          p_guest_phone: string
          p_items: Json
          p_metodo_entrega: string
          p_user_id: string
        }
        Returns: {
          confirmation_token: string
          costo_envio: number
          coupon_id: string | null
          created_at: string
          descuento: number
          direccion_envio: Json | null
          estado: string
          guest_email: string | null
          guest_phone: string | null
          id: string
          metodo_entrega: string
          moneda: string
          mp_preference_id: string | null
          notas: string | null
          order_number: string
          reserva_expira_at: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      next_order_number: { Args: never; Returns: string }
      release_order_reservation: {
        Args: { p_nuevo_estado?: string; p_order_id: string }
        Returns: undefined
      }
      validate_coupon: {
        Args: { p_codigo: string; p_subtotal: number }
        Returns: {
          coupon_id: string
          descuento: number
          motivo: string
          valido: boolean
        }[]
      }
    }
    Enums: {
      product_tipo: "camiseta" | "short" | "conjunto"
      user_role: "admin" | "customer"
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
    Enums: {
      product_tipo: ["camiseta", "short", "conjunto"],
      user_role: ["admin", "customer"],
    },
  },
} as const


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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ativos_passivos: {
        Row: {
          a_pagar: number | null
          a_receber: number | null
          aporte: number | null
          balanco: number | null
          created_at: string
          data_referencia: string
          estoque: number | null
          id: string
          investimento: number | null
          joia: number | null
          observacoes: string | null
          saldo_do_dia: number | null
          updated_at: string
          user_id: string | null
          vencida: number | null
        }
        Insert: {
          a_pagar?: number | null
          a_receber?: number | null
          aporte?: number | null
          balanco?: number | null
          created_at?: string
          data_referencia: string
          estoque?: number | null
          id?: string
          investimento?: number | null
          joia?: number | null
          observacoes?: string | null
          saldo_do_dia?: number | null
          updated_at?: string
          user_id?: string | null
          vencida?: number | null
        }
        Update: {
          a_pagar?: number | null
          a_receber?: number | null
          aporte?: number | null
          balanco?: number | null
          created_at?: string
          data_referencia?: string
          estoque?: number | null
          id?: string
          investimento?: number | null
          joia?: number | null
          observacoes?: string | null
          saldo_do_dia?: number | null
          updated_at?: string
          user_id?: string | null
          vencida?: number | null
        }
        Relationships: []
      }
      balancos_estoque: {
        Row: {
          created_at: string
          id: string
          itens_negativos: number | null
          itens_neutros: number | null
          itens_positivos: number | null
          nome: string
          periodo: string
          resultado_monetario: number | null
          status: string
          tipo_balanco: string
          total_itens: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          itens_negativos?: number | null
          itens_neutros?: number | null
          itens_positivos?: number | null
          nome: string
          periodo: string
          resultado_monetario?: number | null
          status?: string
          tipo_balanco?: string
          total_itens?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          itens_negativos?: number | null
          itens_neutros?: number | null
          itens_positivos?: number | null
          nome?: string
          periodo?: string
          resultado_monetario?: number | null
          status?: string
          tipo_balanco?: string
          total_itens?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      dashboards_personalizados: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documentos_financeiros: {
        Row: {
          arquivo_original: string
          banco: string | null
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          periodo: string
          quantidade_documentos: number | null
          status: string
          tipo_documento: string
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          arquivo_original: string
          banco?: string | null
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          periodo: string
          quantidade_documentos?: number | null
          status?: string
          tipo_documento: string
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          arquivo_original?: string
          banco?: string | null
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          periodo?: string
          quantidade_documentos?: number | null
          status?: string
          tipo_documento?: string
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      entradas_personalizadas: {
        Row: {
          ano: number
          categoria: string
          created_at: string
          dashboard_id: string
          descricao: string | null
          id: string
          mes: number
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          ano: number
          categoria: string
          created_at?: string
          dashboard_id: string
          descricao?: string | null
          id?: string
          mes: number
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          ano?: number
          categoria?: string
          created_at?: string
          dashboard_id?: string
          descricao?: string | null
          id?: string
          mes?: number
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "entradas_personalizadas_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards_personalizados"
            referencedColumns: ["id"]
          },
        ]
      }
      extratos: {
        Row: {
          account_type: string
          bank: string
          created_at: string
          file_type: string
          id: string
          name: string
          notes: string | null
          period: string
          size: string
          status: string
          transactions_count: number | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          bank: string
          created_at?: string
          file_type?: string
          id?: string
          name: string
          notes?: string | null
          period: string
          size: string
          status?: string
          transactions_count?: number | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          bank?: string
          created_at?: string
          file_type?: string
          id?: string
          name?: string
          notes?: string | null
          period?: string
          size?: string
          status?: string
          transactions_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_report_assignees: {
        Row: {
          created_at: string | null
          fiscal_report_id: string
          fiscal_user_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          fiscal_report_id: string
          fiscal_user_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          fiscal_report_id?: string
          fiscal_user_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_report_assignees_fiscal_report_id_fkey"
            columns: ["fiscal_report_id"]
            isOneToOne: false
            referencedRelation: "fiscal_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_report_signatures: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          report_id: string
          signature_data: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          report_id: string
          signature_data: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          report_id?: string
          signature_data?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_report_signatures_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "fiscal_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_reports: {
        Row: {
          account_type: string
          approved_count: number | null
          competencia: string
          created_at: string | null
          extrato_id: string | null
          flagged_count: number | null
          id: string
          pdf_url: string | null
          pending_count: number | null
          sent_at: string | null
          sent_by: string | null
          status: string
          title: string
          total_entries: number | null
          updated_at: string | null
        }
        Insert: {
          account_type: string
          approved_count?: number | null
          competencia: string
          created_at?: string | null
          extrato_id?: string | null
          flagged_count?: number | null
          id?: string
          pdf_url?: string | null
          pending_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          title: string
          total_entries?: number | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          approved_count?: number | null
          competencia?: string
          created_at?: string | null
          extrato_id?: string | null
          flagged_count?: number | null
          id?: string
          pdf_url?: string | null
          pending_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          title?: string
          total_entries?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_reports_extrato_id_fkey"
            columns: ["extrato_id"]
            isOneToOne: false
            referencedRelation: "extratos"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_reviews: {
        Row: {
          created_at: string | null
          entry_index: number
          fiscal_report_id: string
          id: string
          observation: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entry_index: number
          fiscal_report_id: string
          id?: string
          observation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entry_index?: number
          fiscal_report_id?: string
          id?: string
          observation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_reviews_fiscal_report_id_fkey"
            columns: ["fiscal_report_id"]
            isOneToOne: false
            referencedRelation: "fiscal_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_balanco: {
        Row: {
          balanco_id: string
          codigo: string | null
          created_at: string
          descricao: string | null
          diferenca_monetaria: number | null
          diferenca_quantidade: number | null
          id: string
          quantidade_real: number | null
          quantidade_sistema: number | null
          unitario: number | null
          valor_real: number | null
          valor_sistema: number | null
        }
        Insert: {
          balanco_id: string
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          diferenca_monetaria?: number | null
          diferenca_quantidade?: number | null
          id?: string
          quantidade_real?: number | null
          quantidade_sistema?: number | null
          unitario?: number | null
          valor_real?: number | null
          valor_sistema?: number | null
        }
        Update: {
          balanco_id?: string
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          diferenca_monetaria?: number | null
          diferenca_quantidade?: number | null
          id?: string
          quantidade_real?: number | null
          quantidade_sistema?: number | null
          unitario?: number | null
          valor_real?: number | null
          valor_sistema?: number | null
        }
        Relationships: []
      }
      itens_financeiros: {
        Row: {
          categoria: string | null
          created_at: string
          data_emissao: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string
          documento_id: string
          id: string
          juros: number | null
          multa: number | null
          numero_documento: string | null
          observacao: string | null
          status: string
          updated_at: string
          valor: number
          valor_pago: number | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao: string
          documento_id: string
          id?: string
          juros?: number | null
          multa?: number | null
          numero_documento?: string | null
          observacao?: string | null
          status?: string
          updated_at?: string
          valor: number
          valor_pago?: number | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string
          documento_id?: string
          id?: string
          juros?: number | null
          multa?: number | null
          numero_documento?: string | null
          observacao?: string | null
          status?: string
          updated_at?: string
          valor?: number
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_financeiros_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_financeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      mapeamentos_colunas_balanco: {
        Row: {
          created_at: string
          id: string
          mapeamento: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mapeamento: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mapeamento?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_reports: {
        Row: {
          config: Json
          created_at: string
          dashboard_id: string | null
          data: Json
          expires_at: string | null
          id: string
          is_active: boolean
          sent_to_cooperado: boolean | null
          share_id: string
          title: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          dashboard_id?: string | null
          data: Json
          expires_at?: string | null
          id?: string
          is_active?: boolean
          sent_to_cooperado?: boolean | null
          share_id: string
          title: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          dashboard_id?: string | null
          data?: Json
          expires_at?: string | null
          id?: string
          is_active?: boolean
          sent_to_cooperado?: boolean | null
          share_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reports_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards_personalizados"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string
          description_raw: string | null
          entry_index: number | null
          extrato_id: string | null
          id: string
          juros: number | null
          observacao: string | null
          status: string
          suggested: boolean | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date: string
          description: string
          description_raw?: string | null
          entry_index?: number | null
          extrato_id?: string | null
          id?: string
          juros?: number | null
          observacao?: string | null
          status?: string
          suggested?: boolean | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          description_raw?: string | null
          entry_index?: number | null
          extrato_id?: string | null
          id?: string
          juros?: number | null
          observacao?: string | null
          status?: string
          suggested?: boolean | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_extrato_id_fkey"
            columns: ["extrato_id"]
            isOneToOne: false
            referencedRelation: "extratos"
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
      soft_delete_shared_report: {
        Args: { report_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "fiscal"
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
      app_role: ["admin", "fiscal"],
    },
  },
} as const

// Supabase 생성 타입 — prod(naelum) 스키마에서 생성(2026-10-20, Supabase MCP generate_typescript_types).
// 수기 수정 금지: 스키마가 바뀌면 다시 생성한다. dev 전용 배달 테이블은 prod 에 없어 포함되지 않는다.

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id: string
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string
          target_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_code: string
          category: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          requirement_type: string | null
          requirement_value: number | null
          tier: string | null
        }
        Insert: {
          badge_code: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          requirement_type?: string | null
          requirement_value?: number | null
          tier?: string | null
        }
        Update: {
          badge_code?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          requirement_type?: string | null
          requirement_value?: number | null
          tier?: string | null
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          ban_type: string
          banned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          ban_type?: string
          banned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          ban_type?: string
          banned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banned_users_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banned_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          channel_id: string
          channel_name: string
          channel_url: string | null
          chef_name: string | null
          content_type: string
          created_at: string
          id: string
          initial_lookback_days: number
          is_active: boolean
          last_checked_at: string | null
          updated_at: string
          uploads_playlist_id: string | null
        }
        Insert: {
          channel_id: string
          channel_name: string
          channel_url?: string | null
          chef_name?: string | null
          content_type?: string
          created_at?: string
          id?: string
          initial_lookback_days?: number
          is_active?: boolean
          last_checked_at?: string | null
          updated_at?: string
          uploads_playlist_id?: string | null
        }
        Update: {
          channel_id?: string
          channel_name?: string
          channel_url?: string | null
          chef_name?: string | null
          content_type?: string
          created_at?: string
          id?: string
          initial_lookback_days?: number
          is_active?: boolean
          last_checked_at?: string | null
          updated_at?: string
          uploads_playlist_id?: string | null
        }
        Relationships: []
      }
      collection_logs: {
        Row: {
          channels_checked: number | null
          duration_ms: number | null
          error_details: Json | null
          errors: number | null
          function_name: string
          id: string
          queries_checked: number | null
          run_at: string
          skip_details: Json | null
          status: string
          videos_found: number | null
          videos_inserted: number | null
          videos_skipped: number | null
        }
        Insert: {
          channels_checked?: number | null
          duration_ms?: number | null
          error_details?: Json | null
          errors?: number | null
          function_name: string
          id?: string
          queries_checked?: number | null
          run_at?: string
          skip_details?: Json | null
          status: string
          videos_found?: number | null
          videos_inserted?: number | null
          videos_skipped?: number | null
        }
        Update: {
          channels_checked?: number | null
          duration_ms?: number | null
          error_details?: Json | null
          errors?: number | null
          function_name?: string
          id?: string
          queries_checked?: number | null
          run_at?: string
          skip_details?: Json | null
          status?: string
          videos_found?: number | null
          videos_inserted?: number | null
          videos_skipped?: number | null
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          category: string
          content: string
          created_at: string | null
          email: string | null
          id: string
          screenshot_url: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string | null
          email?: string | null
          id?: string
          screenshot_url?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          email?: string | null
          id?: string
          screenshot_url?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cooking_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          difficulty_felt: number | null
          difficulty_rating: number | null
          id: string
          modifications: Json | null
          notes: string | null
          photo_url: string | null
          recipe_id: string
          started_at: string
          taste_rating: number | null
          total_time_minutes: number | null
          user_id: string
          would_cook_again: boolean | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          difficulty_felt?: number | null
          difficulty_rating?: number | null
          id?: string
          modifications?: Json | null
          notes?: string | null
          photo_url?: string | null
          recipe_id: string
          started_at: string
          taste_rating?: number | null
          total_time_minutes?: number | null
          user_id: string
          would_cook_again?: boolean | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          difficulty_felt?: number | null
          difficulty_rating?: number | null
          id?: string
          modifications?: Json | null
          notes?: string | null
          photo_url?: string | null
          recipe_id?: string
          started_at?: string
          taste_rating?: number | null
          total_time_minutes?: number | null
          user_id?: string
          would_cook_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cooking_sessions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cooking_tools: {
        Row: {
          aliases: string[] | null
          alternatives: string[] | null
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          created_by: string | null
          data_source: string | null
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          name: string
          name_en: string | null
          status: string
          usage_tips: string | null
        }
        Insert: {
          aliases?: string[] | null
          alternatives?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          data_source?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name: string
          name_en?: string | null
          status?: string
          usage_tips?: string | null
        }
        Update: {
          aliases?: string[] | null
          alternatives?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          data_source?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name?: string
          name_en?: string | null
          status?: string
          usage_tips?: string | null
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          active_users: number | null
          created_at: string | null
          id: string
          new_recipes: number | null
          new_users: number | null
          stat_date: string
          total_comments: number | null
          total_likes: number | null
          total_recipes: number | null
          total_saves: number | null
          total_users: number | null
          total_views: number | null
        }
        Insert: {
          active_users?: number | null
          created_at?: string | null
          id?: string
          new_recipes?: number | null
          new_users?: number | null
          stat_date: string
          total_comments?: number | null
          total_likes?: number | null
          total_recipes?: number | null
          total_saves?: number | null
          total_users?: number | null
          total_views?: number | null
        }
        Update: {
          active_users?: number | null
          created_at?: string | null
          id?: string
          new_recipes?: number | null
          new_users?: number | null
          stat_date?: string
          total_comments?: number | null
          total_likes?: number | null
          total_recipes?: number | null
          total_saves?: number | null
          total_users?: number | null
          total_views?: number | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          page: string | null
          payload: Json | null
          session_id: string
          ua: string | null
          user_id: string | null
          viewport_h: number | null
          viewport_w: number | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          page?: string | null
          payload?: Json | null
          session_id: string
          ua?: string | null
          user_id?: string | null
          viewport_h?: number | null
          viewport_w?: number | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          page?: string | null
          payload?: Json | null
          session_id?: string
          ua?: string | null
          user_id?: string | null
          viewport_h?: number | null
          viewport_w?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_logs: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          points_earned: number
          related_entity_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          points_earned: number
          related_entity_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          points_earned?: number
          related_entity_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      golden_steps: {
        Row: {
          action_category: string
          approved_at: string | null
          created_at: string | null
          golden_instruction: string
          id: string
          notes: string | null
          recipe_step_id: string | null
          source_text: string | null
        }
        Insert: {
          action_category: string
          approved_at?: string | null
          created_at?: string | null
          golden_instruction: string
          id?: string
          notes?: string | null
          recipe_step_id?: string | null
          source_text?: string | null
        }
        Update: {
          action_category?: string
          approved_at?: string | null
          created_at?: string | null
          golden_instruction?: string
          id?: string
          notes?: string | null
          recipe_step_id?: string | null
          source_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "golden_steps_recipe_step_id_fkey"
            columns: ["recipe_step_id"]
            isOneToOne: false
            referencedRelation: "recipe_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_price_reports: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string | null
          price: number
          price_per_unit: number | null
          purchase_date: string | null
          quantity: number | null
          source: string
          store_id: string | null
          unit: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          price: number
          price_per_unit?: number | null
          purchase_date?: string | null
          quantity?: number | null
          source?: string
          store_id?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          price?: number
          price_per_unit?: number | null
          purchase_date?: string | null
          quantity?: number | null
          source?: string
          store_id?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_price_reports_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_price_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_relations: {
        Row: {
          approved_at: string
          approved_by: string | null
          created_at: string
          from_id: string
          id: string
          kind: string
          notes: string | null
          ratio: number | null
          source: string
          suggestion_count: number
          to_id: string
        }
        Insert: {
          approved_at?: string
          approved_by?: string | null
          created_at?: string
          from_id: string
          id?: string
          kind: string
          notes?: string | null
          ratio?: number | null
          source?: string
          suggestion_count?: number
          to_id: string
        }
        Update: {
          approved_at?: string
          approved_by?: string | null
          created_at?: string
          from_id?: string
          id?: string
          kind?: string
          notes?: string | null
          ratio?: number | null
          source?: string
          suggestion_count?: number
          to_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_relations_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "ingredients_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_relations_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "ingredients_master"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_training_data: {
        Row: {
          admin_notes: string | null
          consent_given: boolean
          created_at: string | null
          id: string
          image_hash: string
          image_height: number | null
          image_url: string
          image_width: number | null
          lighting_condition: string | null
          photo_context: string | null
          quality_score: number | null
          training_status: string
          updated_at: string | null
          user_id: string
          user_labels: Json
        }
        Insert: {
          admin_notes?: string | null
          consent_given?: boolean
          created_at?: string | null
          id?: string
          image_hash: string
          image_height?: number | null
          image_url: string
          image_width?: number | null
          lighting_condition?: string | null
          photo_context?: string | null
          quality_score?: number | null
          training_status?: string
          updated_at?: string | null
          user_id: string
          user_labels: Json
        }
        Update: {
          admin_notes?: string | null
          consent_given?: boolean
          created_at?: string | null
          id?: string
          image_hash?: string
          image_height?: number | null
          image_url?: string
          image_width?: number | null
          lighting_condition?: string | null
          photo_context?: string | null
          quality_score?: number | null
          training_status?: string
          updated_at?: string | null
          user_id?: string
          user_labels?: Json
        }
        Relationships: []
      }
      ingredients_master: {
        Row: {
          aliases: string[] | null
          allergens: string[] | null
          approved_at: string | null
          approved_by: string | null
          attribution: string | null
          base_ingredient_id: string | null
          calories_per_100g: number | null
          carbs_per_100g: number | null
          category: string | null
          common_units: Json | null
          countries_used: string[] | null
          created_at: string | null
          created_by: string | null
          data_source: string | null
          default_tier: number | null
          description: string | null
          emoji: string | null
          exclude_from_fingerprint: boolean | null
          external_id: string | null
          fat_per_100g: number | null
          grams_per_count: Json | null
          grams_per_ml: number | null
          id: string
          image_url: string | null
          is_processed: boolean
          name: string
          name_en: string | null
          name_ko: string | null
          nutrition: Json | null
          nutrition_detail: Json | null
          pairs_well_with: string[] | null
          protein_per_100g: number | null
          search_count: number | null
          seasons: string[] | null
          shelf_life_days: Json | null
          status: string | null
          storage_tips: string | null
          subcategory: string | null
          substitutes: Json | null
          tastes: Json | null
          typical_max: number | null
          typical_min: number | null
          typical_unit: string | null
          updated_at: string | null
        }
        Insert: {
          aliases?: string[] | null
          allergens?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          attribution?: string | null
          base_ingredient_id?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          category?: string | null
          common_units?: Json | null
          countries_used?: string[] | null
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          default_tier?: number | null
          description?: string | null
          emoji?: string | null
          exclude_from_fingerprint?: boolean | null
          external_id?: string | null
          fat_per_100g?: number | null
          grams_per_count?: Json | null
          grams_per_ml?: number | null
          id?: string
          image_url?: string | null
          is_processed?: boolean
          name: string
          name_en?: string | null
          name_ko?: string | null
          nutrition?: Json | null
          nutrition_detail?: Json | null
          pairs_well_with?: string[] | null
          protein_per_100g?: number | null
          search_count?: number | null
          seasons?: string[] | null
          shelf_life_days?: Json | null
          status?: string | null
          storage_tips?: string | null
          subcategory?: string | null
          substitutes?: Json | null
          tastes?: Json | null
          typical_max?: number | null
          typical_min?: number | null
          typical_unit?: string | null
          updated_at?: string | null
        }
        Update: {
          aliases?: string[] | null
          allergens?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          attribution?: string | null
          base_ingredient_id?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          category?: string | null
          common_units?: Json | null
          countries_used?: string[] | null
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          default_tier?: number | null
          description?: string | null
          emoji?: string | null
          exclude_from_fingerprint?: boolean | null
          external_id?: string | null
          fat_per_100g?: number | null
          grams_per_count?: Json | null
          grams_per_ml?: number | null
          id?: string
          image_url?: string | null
          is_processed?: boolean
          name?: string
          name_en?: string | null
          name_ko?: string | null
          nutrition?: Json | null
          nutrition_detail?: Json | null
          pairs_well_with?: string[] | null
          protein_per_100g?: number | null
          search_count?: number | null
          seasons?: string[] | null
          shelf_life_days?: Json | null
          status?: string | null
          storage_tips?: string | null
          subcategory?: string | null
          substitutes?: Json | null
          tastes?: Json | null
          typical_max?: number | null
          typical_min?: number | null
          typical_unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_master_base_ingredient_id_fkey"
            columns: ["base_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_master"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_items: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          meal_plan_id: string
          meal_type: string
          notes: string | null
          planned_date: string
          recipe_id: string | null
          servings: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meal_plan_id: string
          meal_type: string
          notes?: string | null
          planned_date: string
          recipe_id?: string | null
          servings?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meal_plan_id?: string
          meal_type?: string
          notes?: string | null
          planned_date?: string
          recipe_id?: string | null
          servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          plan_name: string | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          plan_name?: string | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          plan_name?: string | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          read_at: string | null
          related_comment_id: string | null
          related_recipe_id: string | null
          related_user_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          read_at?: string | null
          related_comment_id?: string | null
          related_recipe_id?: string | null
          related_user_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          read_at?: string | null
          related_comment_id?: string | null
          related_recipe_id?: string | null
          related_user_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_recipe_id_fkey"
            columns: ["related_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "recipe_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_provider: string
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          cookie_consent_analytics: boolean | null
          cookie_consent_at: string | null
          cookie_consent_marketing: boolean | null
          cookie_consent_version: number | null
          copyright_agreed_at: string | null
          country: string | null
          created_at: string | null
          email: string
          email_notifications: boolean | null
          experience_points: number | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          gender: string | null
          id: string
          last_login_at: string | null
          level: number | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          meal_time_notifications: boolean | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          privacy_agreed_at: string | null
          push_notifications: boolean | null
          recipes_count: number | null
          role: string | null
          search_vector: unknown
          show_cooked_to_public: boolean
          show_saved_to_public: boolean
          terms_agreed_at: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          auth_provider?: string
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cookie_consent_analytics?: boolean | null
          cookie_consent_at?: string | null
          cookie_consent_marketing?: boolean | null
          cookie_consent_version?: number | null
          copyright_agreed_at?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          email_notifications?: boolean | null
          experience_points?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_login_at?: string | null
          level?: number | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          meal_time_notifications?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          privacy_agreed_at?: string | null
          push_notifications?: boolean | null
          recipes_count?: number | null
          role?: string | null
          search_vector?: unknown
          show_cooked_to_public?: boolean
          show_saved_to_public?: boolean
          terms_agreed_at?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          auth_provider?: string
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cookie_consent_analytics?: boolean | null
          cookie_consent_at?: string | null
          cookie_consent_marketing?: boolean | null
          cookie_consent_version?: number | null
          copyright_agreed_at?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          email_notifications?: boolean | null
          experience_points?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_login_at?: string | null
          level?: number | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          meal_time_notifications?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          privacy_agreed_at?: string | null
          push_notifications?: boolean | null
          recipes_count?: number | null
          role?: string | null
          search_vector?: unknown
          show_cooked_to_public?: boolean
          show_saved_to_public?: boolean
          terms_agreed_at?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          identifier: string
          reset_at: string
          updated_at: string
        }
        Insert: {
          count?: number
          identifier: string
          reset_at: string
          updated_at?: string
        }
        Update: {
          count?: number
          identifier?: string
          reset_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipe_folders: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          folder_name: string
          icon: string | null
          id: string
          is_default: boolean | null
          recipes_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          folder_name: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          recipes_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          folder_name?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          recipes_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          ingredient_category: string | null
          ingredient_id: string | null
          ingredient_name: string
          is_optional: boolean | null
          normalized_name: string | null
          notes: string | null
          quantity: number | null
          recipe_id: string
          substitutes: Json | null
          tier: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          display_order: number
          id?: string
          ingredient_category?: string | null
          ingredient_id?: string | null
          ingredient_name: string
          is_optional?: boolean | null
          normalized_name?: string | null
          notes?: string | null
          quantity?: number | null
          recipe_id: string
          substitutes?: Json | null
          tier?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          ingredient_category?: string | null
          ingredient_id?: string | null
          ingredient_name?: string
          is_optional?: boolean | null
          normalized_name?: string | null
          notes?: string | null
          quantity?: number | null
          recipe_id?: string
          substitutes?: Json | null
          tier?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_likes: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_likes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_notes: {
        Row: {
          content: string
          created_at: string | null
          display_order: number | null
          id: string
          note_type: string
          recipe_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          note_type: string
          recipe_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          note_type?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_notes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_deleted: boolean
          is_edited: boolean
          likes_count: number
          parent_id: string | null
          photo_url: string | null
          rating: number | null
          recipe_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          likes_count?: number
          parent_id?: string | null
          photo_url?: string | null
          rating?: number | null
          recipe_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          likes_count?: number
          parent_id?: string | null
          photo_url?: string | null
          rating?: number | null
          recipe_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "recipe_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_posts_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_queue: {
        Row: {
          category: string | null
          channel_id: string | null
          classification_confidence: number | null
          collected_at: string
          description: string | null
          has_description_recipe: boolean | null
          id: string
          is_multi_recipe: boolean
          notes: string | null
          processed_at: string | null
          published_at: string | null
          recipe_count: number
          search_query_id: string | null
          skip_reason: string | null
          status: string
          thumbnail_url: string | null
          title: string
          transcript: string | null
          transcript_quality: string | null
          video_duration_seconds: number | null
          video_id: string
          video_url: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          channel_id?: string | null
          classification_confidence?: number | null
          collected_at?: string
          description?: string | null
          has_description_recipe?: boolean | null
          id?: string
          is_multi_recipe?: boolean
          notes?: string | null
          processed_at?: string | null
          published_at?: string | null
          recipe_count?: number
          search_query_id?: string | null
          skip_reason?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          transcript?: string | null
          transcript_quality?: string | null
          video_duration_seconds?: number | null
          video_id: string
          video_url: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          channel_id?: string | null
          classification_confidence?: number | null
          collected_at?: string
          description?: string | null
          has_description_recipe?: boolean | null
          id?: string
          is_multi_recipe?: boolean
          notes?: string | null
          processed_at?: string | null
          published_at?: string | null
          recipe_count?: number
          search_query_id?: string | null
          skip_reason?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          transcript?: string | null
          transcript_quality?: string | null
          video_duration_seconds?: number | null
          video_id?: string
          video_url?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_queue_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_queue_search_query_id_fkey"
            columns: ["search_query_id"]
            isOneToOne: false
            referencedRelation: "search_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_saves: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          notes: string | null
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          notes?: string | null
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          notes?: string | null
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_saves_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "recipe_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_saves_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          instruction: string
          recipe_id: string
          step_number: number
          temperature_celsius: number | null
          timer_minutes: number | null
          tip: string | null
          title: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          instruction: string
          recipe_id: string
          step_number: number
          temperature_celsius?: number | null
          timer_minutes?: number | null
          tip?: string | null
          title?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          instruction?: string
          recipe_id?: string
          step_number?: number
          temperature_celsius?: number | null
          timer_minutes?: number | null
          tip?: string | null
          title?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tags: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id: string
          tag_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tags_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          recipe_id: string
          referrer: string | null
          session_id: string | null
          source: string | null
          user_agent: string | null
          user_id: string | null
          view_duration_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          recipe_id: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          recipe_id?: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_views_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          allergen_note: string | null
          allergens: string[] | null
          amount_warnings: string[] | null
          attributed_chef: string | null
          author_id: string
          auto_inferred_fields: string[] | null
          average_rating: number | null
          calories: number | null
          carbs: number | null
          carbs_grams: number | null
          comments_count: number | null
          cook_time_minutes: number | null
          cooking_method: string | null
          cost_note: string | null
          cost_per_serving: number | null
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          difficulty_level: string | null
          dish_name: string | null
          dish_type: string | null
          display_image: string | null
          equipment: string[] | null
          estimated_cost: number | null
          fat: number | null
          fat_grams: number | null
          fiber_grams: number | null
          fingerprint_core: string | null
          fingerprint_signature: string | null
          has_unverified_ingredient: boolean | null
          id: string
          image_failure_reason: string | null
          image_generation_attempts: number | null
          image_prompt_used: string | null
          image_requested_at: string | null
          image_status: string | null
          ingredients_core: string[] | null
          ingredients_image_url: string | null
          ingredients_signature: string[] | null
          is_ai_image: boolean | null
          is_dairy_free: boolean | null
          is_featured: boolean | null
          is_gluten_free: boolean | null
          is_low_carb: boolean | null
          is_remix: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          likes_count: number | null
          meal_type: string | null
          multi_recipe_index: number | null
          occasion: string | null
          optional_equipment: string[] | null
          original_recipe_id: string | null
          pairings: Json | null
          prep_time_minutes: number | null
          prompt_version: string | null
          protein: number | null
          protein_grams: number | null
          published_at: string | null
          queue_id: string | null
          ratings_count: number | null
          report_count: number | null
          review_status: string | null
          saves_count: number | null
          search_vector: unknown
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          servings: number | null
          shares_count: number | null
          show_source: boolean | null
          slug: string | null
          sodium: number | null
          sodium_mg: number | null
          source_channel: string | null
          source_url: string | null
          source_video_id: string | null
          status: string
          storage: Json | null
          substitutions: Json | null
          thumbnail_url: string | null
          title: string
          total_time_minutes: number | null
          updated_at: string | null
          video_uploader: string | null
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          allergen_note?: string | null
          allergens?: string[] | null
          amount_warnings?: string[] | null
          attributed_chef?: string | null
          author_id: string
          auto_inferred_fields?: string[] | null
          average_rating?: number | null
          calories?: number | null
          carbs?: number | null
          carbs_grams?: number | null
          comments_count?: number | null
          cook_time_minutes?: number | null
          cooking_method?: string | null
          cost_note?: string | null
          cost_per_serving?: number | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          difficulty_level?: string | null
          dish_name?: string | null
          dish_type?: string | null
          display_image?: string | null
          equipment?: string[] | null
          estimated_cost?: number | null
          fat?: number | null
          fat_grams?: number | null
          fiber_grams?: number | null
          fingerprint_core?: string | null
          fingerprint_signature?: string | null
          has_unverified_ingredient?: boolean | null
          id?: string
          image_failure_reason?: string | null
          image_generation_attempts?: number | null
          image_prompt_used?: string | null
          image_requested_at?: string | null
          image_status?: string | null
          ingredients_core?: string[] | null
          ingredients_image_url?: string | null
          ingredients_signature?: string[] | null
          is_ai_image?: boolean | null
          is_dairy_free?: boolean | null
          is_featured?: boolean | null
          is_gluten_free?: boolean | null
          is_low_carb?: boolean | null
          is_remix?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          likes_count?: number | null
          meal_type?: string | null
          multi_recipe_index?: number | null
          occasion?: string | null
          optional_equipment?: string[] | null
          original_recipe_id?: string | null
          pairings?: Json | null
          prep_time_minutes?: number | null
          prompt_version?: string | null
          protein?: number | null
          protein_grams?: number | null
          published_at?: string | null
          queue_id?: string | null
          ratings_count?: number | null
          report_count?: number | null
          review_status?: string | null
          saves_count?: number | null
          search_vector?: unknown
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          servings?: number | null
          shares_count?: number | null
          show_source?: boolean | null
          slug?: string | null
          sodium?: number | null
          sodium_mg?: number | null
          source_channel?: string | null
          source_url?: string | null
          source_video_id?: string | null
          status?: string
          storage?: Json | null
          substitutions?: Json | null
          thumbnail_url?: string | null
          title: string
          total_time_minutes?: number | null
          updated_at?: string | null
          video_uploader?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          allergen_note?: string | null
          allergens?: string[] | null
          amount_warnings?: string[] | null
          attributed_chef?: string | null
          author_id?: string
          auto_inferred_fields?: string[] | null
          average_rating?: number | null
          calories?: number | null
          carbs?: number | null
          carbs_grams?: number | null
          comments_count?: number | null
          cook_time_minutes?: number | null
          cooking_method?: string | null
          cost_note?: string | null
          cost_per_serving?: number | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          difficulty_level?: string | null
          dish_name?: string | null
          dish_type?: string | null
          display_image?: string | null
          equipment?: string[] | null
          estimated_cost?: number | null
          fat?: number | null
          fat_grams?: number | null
          fiber_grams?: number | null
          fingerprint_core?: string | null
          fingerprint_signature?: string | null
          has_unverified_ingredient?: boolean | null
          id?: string
          image_failure_reason?: string | null
          image_generation_attempts?: number | null
          image_prompt_used?: string | null
          image_requested_at?: string | null
          image_status?: string | null
          ingredients_core?: string[] | null
          ingredients_image_url?: string | null
          ingredients_signature?: string[] | null
          is_ai_image?: boolean | null
          is_dairy_free?: boolean | null
          is_featured?: boolean | null
          is_gluten_free?: boolean | null
          is_low_carb?: boolean | null
          is_remix?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          likes_count?: number | null
          meal_type?: string | null
          multi_recipe_index?: number | null
          occasion?: string | null
          optional_equipment?: string[] | null
          original_recipe_id?: string | null
          pairings?: Json | null
          prep_time_minutes?: number | null
          prompt_version?: string | null
          protein?: number | null
          protein_grams?: number | null
          published_at?: string | null
          queue_id?: string | null
          ratings_count?: number | null
          report_count?: number | null
          review_status?: string | null
          saves_count?: number | null
          search_vector?: unknown
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          servings?: number | null
          shares_count?: number | null
          show_source?: boolean | null
          slug?: string | null
          sodium?: number | null
          sodium_mg?: number | null
          source_channel?: string | null
          source_url?: string | null
          source_video_id?: string | null
          status?: string
          storage?: Json | null
          substitutions?: Json | null
          thumbnail_url?: string | null
          title?: string
          total_time_minutes?: number | null
          updated_at?: string | null
          video_uploader?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_recipes_queue_id"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "recipe_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_original_recipe_id_fkey"
            columns: ["original_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_history: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string
          recommendation_score: number | null
          recommendation_type: string | null
          user_id: string
          was_clicked: boolean | null
          was_cooked: boolean | null
          was_saved: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id: string
          recommendation_score?: number | null
          recommendation_type?: string | null
          user_id: string
          was_clicked?: boolean | null
          was_cooked?: boolean | null
          was_saved?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string
          recommendation_score?: number | null
          recommendation_type?: string | null
          user_id?: string
          was_clicked?: boolean | null
          was_cooked?: boolean | null
          was_saved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_history_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id: string | null
          resolution_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id?: string | null
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reported_type?: string
          reporter_id?: string | null
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          clicked_result_id: string | null
          created_at: string | null
          id: string
          result_count: number | null
          search_query: string
          search_type: string | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          created_at?: string | null
          id?: string
          result_count?: number | null
          search_query: string
          search_type?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          created_at?: string | null
          id?: string
          result_count?: number | null
          search_query?: string
          search_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          max_results: number
          min_view_count: number
          published_after_days: number
          query: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          max_results?: number
          min_view_count?: number
          published_after_days?: number
          query: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          max_results?: number
          min_view_count?: number
          published_after_days?: number
          query?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          category: string | null
          checked_at: string | null
          created_at: string | null
          estimated_price: number | null
          id: string
          ingredient_id: string | null
          ingredient_name: string
          is_checked: boolean | null
          is_owned: boolean | null
          note: string | null
          notes: string | null
          quantity: number | null
          recipe_id: string | null
          recipe_title: string | null
          shopping_list_id: string
          unit: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          checked_at?: string | null
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          ingredient_id?: string | null
          ingredient_name: string
          is_checked?: boolean | null
          is_owned?: boolean | null
          note?: string | null
          notes?: string | null
          quantity?: number | null
          recipe_id?: string | null
          recipe_title?: string | null
          shopping_list_id: string
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          checked_at?: string | null
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          ingredient_id?: string | null
          ingredient_name?: string
          is_checked?: boolean | null
          is_owned?: boolean | null
          note?: string | null
          notes?: string | null
          quantity?: number | null
          recipe_id?: string | null
          recipe_title?: string | null
          shopping_list_id?: string
          unit?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          last_viewed_at: string | null
          owner_user_id: string
          revoked_at: string | null
          token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          last_viewed_at?: string | null
          owner_user_id: string
          revoked_at?: string | null
          token: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          last_viewed_at?: string | null
          owner_user_id?: string
          revoked_at?: string | null
          token?: string
          view_count?: number
        }
        Relationships: []
      }
      shopping_lists: {
        Row: {
          completed_items: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          list_name: string
          total_items: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_items?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          list_name: string
          total_items?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_items?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          list_name?: string
          total_items?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          brand: string | null
          created_at: string
          id: string
          kakao_place_id: string | null
          lat: number | null
          lng: number | null
          name: string
          store_type: string | null
        }
        Insert: {
          address?: string | null
          brand?: string | null
          created_at?: string
          id?: string
          kakao_place_id?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          store_type?: string | null
        }
        Update: {
          address?: string | null
          brand?: string | null
          created_at?: string
          id?: string
          kakao_place_id?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          store_type?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      tip: {
        Row: {
          attributed_chef: string | null
          author_id: string
          auto_inferred_fields: string[] | null
          category: string | null
          content: Json | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          has_unverified_ingredient: boolean | null
          id: string
          image_failure_reason: string | null
          image_generation_attempts: number | null
          image_prompt_used: string | null
          image_requested_at: string | null
          image_status: string | null
          is_ai_image: boolean | null
          is_draft: boolean
          is_public: boolean
          prompt_version: string | null
          queue_id: string | null
          related_dishes: string[] | null
          related_ingredients: string[] | null
          report_count: number | null
          seo_description: string | null
          seo_title: string | null
          show_source: boolean | null
          slug: string | null
          source_channel: string | null
          source_url: string | null
          source_video_id: string | null
          status: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          attributed_chef?: string | null
          author_id: string
          auto_inferred_fields?: string[] | null
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          has_unverified_ingredient?: boolean | null
          id?: string
          image_failure_reason?: string | null
          image_generation_attempts?: number | null
          image_prompt_used?: string | null
          image_requested_at?: string | null
          image_status?: string | null
          is_ai_image?: boolean | null
          is_draft?: boolean
          is_public?: boolean
          prompt_version?: string | null
          queue_id?: string | null
          related_dishes?: string[] | null
          related_ingredients?: string[] | null
          report_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          show_source?: boolean | null
          slug?: string | null
          source_channel?: string | null
          source_url?: string | null
          source_video_id?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          attributed_chef?: string | null
          author_id?: string
          auto_inferred_fields?: string[] | null
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          has_unverified_ingredient?: boolean | null
          id?: string
          image_failure_reason?: string | null
          image_generation_attempts?: number | null
          image_prompt_used?: string | null
          image_requested_at?: string | null
          image_status?: string | null
          is_ai_image?: boolean | null
          is_draft?: boolean
          is_public?: boolean
          prompt_version?: string | null
          queue_id?: string | null
          related_dishes?: string[] | null
          related_ingredients?: string[] | null
          report_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          show_source?: boolean | null
          slug?: string | null
          source_channel?: string | null
          source_url?: string | null
          source_video_id?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tip_queue_id"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "recipe_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tip_steps: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          instruction: string
          step_number: number
          tip: string | null
          tip_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          instruction: string
          step_number: number
          tip?: string | null
          tip_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          instruction?: string
          step_number?: number
          tip?: string | null
          tip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowhow_steps_knowhow_id_fkey"
            columns: ["tip_id"]
            isOneToOne: false
            referencedRelation: "tip"
            referencedColumns: ["id"]
          },
        ]
      }
      tip_tags: {
        Row: {
          id: string
          tag: string
          tip_id: string
        }
        Insert: {
          id?: string
          tag: string
          tip_id: string
        }
        Update: {
          id?: string
          tag?: string
          tip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowhow_tags_knowhow_id_fkey"
            columns: ["tip_id"]
            isOneToOne: false
            referencedRelation: "tip"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string
          field_name: string
          id: string
          language_code: string
          translated_text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          field_name: string
          id?: string
          language_code: string
          translated_text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          field_name?: string
          id?: string
          language_code?: string
          translated_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trending_searches: {
        Row: {
          id: string
          last_searched_at: string | null
          month_count: number | null
          search_count: number | null
          search_query: string
          week_count: number | null
        }
        Insert: {
          id?: string
          last_searched_at?: string | null
          month_count?: number | null
          search_count?: number | null
          search_query: string
          week_count?: number | null
        }
        Update: {
          id?: string
          last_searched_at?: string | null
          month_count?: number | null
          search_count?: number | null
          search_query?: string
          week_count?: number | null
        }
        Relationships: []
      }
      user_allergies: {
        Row: {
          created_at: string | null
          id: string
          ingredient_name: string
          severity: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_name: string
          severity?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_name?: string
          severity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_allergies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dietary_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          preference_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          preference_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          preference_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dietary_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites_ingredients: {
        Row: {
          add_count: number
          category: string | null
          created_at: string
          ingredient_name: string
          is_starred: boolean
          last_added_at: string
          user_id: string
        }
        Insert: {
          add_count?: number
          category?: string | null
          created_at?: string
          ingredient_name: string
          is_starred?: boolean
          last_added_at?: string
          user_id: string
        }
        Update: {
          add_count?: number
          category?: string | null
          created_at?: string
          ingredient_name?: string
          is_starred?: boolean
          last_added_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ingredients: {
        Row: {
          category: string | null
          created_at: string | null
          expiry_alert: boolean | null
          expiry_date: string | null
          id: string
          ingredient_id: string | null
          ingredient_name: string
          low_stock_alert: boolean | null
          notes: string | null
          purchase_date: string | null
          quantity: number | null
          storage_location: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          expiry_alert?: boolean | null
          expiry_date?: string | null
          id?: string
          ingredient_id?: string | null
          ingredient_name: string
          low_stock_alert?: boolean | null
          notes?: string | null
          purchase_date?: string | null
          quantity?: number | null
          storage_location?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          expiry_alert?: boolean | null
          expiry_date?: string | null
          id?: string
          ingredient_id?: string | null
          ingredient_name?: string
          low_stock_alert?: boolean | null
          notes?: string | null
          purchase_date?: string | null
          quantity?: number | null
          storage_location?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ingredients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string | null
          id: string
          interest_type: string
          interest_value: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_type: string
          interest_value: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_type?: string
          interest_value?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_terms_acceptance: {
        Row: {
          accepted_at: string | null
          id: string
          ip_address: string | null
          terms_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_terms_acceptance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          banned_users_count: number | null
          comments_week: number | null
          new_recipes_week: number | null
          new_users_month: number | null
          new_users_week: number | null
          pending_reports: number | null
          total_recipes: number | null
          total_users: number | null
          views_today: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_unresolved_ingredients: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          ingredient_name: string
          match_count: number
          row_count: number
          suggested_category: string
          suggested_id: string
        }[]
      }
      admin_unresolved_ingredients_summary: {
        Args: never
        Returns: {
          distinct_names: number
          total_rows: number
        }[]
      }
      approve_ingredient: {
        Args: {
          p_allergens: string[]
          p_canonical_name: string
          p_tier: number
          p_typical_max: number
          p_typical_min: number
          p_typical_unit: string
        }
        Returns: {
          affected_recipes: number
          ingredient_id: string
        }[]
      }
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_max_requests: number
          p_window_ms: number
        }
        Returns: {
          allowed: boolean
          current_count: number
          reset_at: string
        }[]
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      decrement_saves_count: { Args: { recipe_id: string }; Returns: undefined }
      delete_user: { Args: never; Returns: undefined }
      increment_recipe_views: { Args: { recipe_id: string }; Returns: number }
      increment_saves_count: { Args: { recipe_id: string }; Returns: undefined }
      is_user_banned: { Args: { check_user_id: string }; Returns: boolean }
      recipe_cooked_count: { Args: { p_recipe_id: string }; Returns: number }
      refresh_recipe_post_counts: {
        Args: { p_recipe_id: string }
        Returns: undefined
      }
      remove_oauth_identity: {
        Args: { p_provider: string; p_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_post_like: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: boolean
      }
      toggle_recipe_like: {
        Args: { p_recipe_id: string; p_user_id: string }
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

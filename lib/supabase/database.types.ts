export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ================================================
      // 1. USERS & AUTHENTICATION
      // ================================================
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          gender: string | null
          role: 'user' | 'admin'
          onboarding_completed: boolean
          onboarding_step: number
          followers_count: number
          following_count: number
          recipes_count: number
          level: number
          experience_points: number
          email_notifications: boolean
          push_notifications: boolean
          meal_time_notifications: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          username: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          gender?: string | null
          role?: 'user' | 'admin'
          onboarding_completed?: boolean
          onboarding_step?: number
          followers_count?: number
          following_count?: number
          recipes_count?: number
          level?: number
          experience_points?: number
          email_notifications?: boolean
          push_notifications?: boolean
          meal_time_notifications?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          gender?: string | null
          role?: 'user' | 'admin'
          onboarding_completed?: boolean
          onboarding_step?: number
          followers_count?: number
          following_count?: number
          recipes_count?: number
          level?: number
          experience_points?: number
          email_notifications?: boolean
          push_notifications?: boolean
          meal_time_notifications?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }

      // ================================================
      // 2. USER PREFERENCES & ONBOARDING
      // ================================================
      user_interests: {
        Row: {
          id: string
          user_id: string
          interest_type: string
          interest_value: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          interest_type: string
          interest_value: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          interest_type?: string
          interest_value?: string
          created_at?: string
        }
      }

      user_dietary_preferences: {
        Row: {
          id: string
          user_id: string
          preference_type: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preference_type: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preference_type?: string
          is_active?: boolean
          created_at?: string
        }
      }

      user_allergies: {
        Row: {
          id: string
          user_id: string
          ingredient_name: string
          severity: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ingredient_name: string
          severity?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ingredient_name?: string
          severity?: string
          created_at?: string
        }
      }

      // ================================================
      // 3. RECIPES
      // ================================================
      recipes: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          video_url: string | null
          servings: number
          prep_time_minutes: number | null
          cook_time_minutes: number | null
          total_time_minutes: number | null
          difficulty_level: string
          cuisine_type: string | null
          dish_type: string | null
          meal_type: string | null
          calories: number | null
          protein_grams: number | null
          carbs_grams: number | null
          fat_grams: number | null
          fiber_grams: number | null
          is_vegetarian: boolean
          is_vegan: boolean
          is_gluten_free: boolean
          is_dairy_free: boolean
          is_low_carb: boolean
          views_count: number
          likes_count: number
          saves_count: number
          comments_count: number
          shares_count: number
          average_rating: number
          ratings_count: number
          original_recipe_id: string | null
          is_remix: boolean
          is_published: boolean
          is_featured: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          video_url?: string | null
          servings?: number
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          difficulty_level?: string
          cuisine_type?: string | null
          dish_type?: string | null
          meal_type?: string | null
          calories?: number | null
          protein_grams?: number | null
          carbs_grams?: number | null
          fat_grams?: number | null
          fiber_grams?: number | null
          is_vegetarian?: boolean
          is_vegan?: boolean
          is_gluten_free?: boolean
          is_dairy_free?: boolean
          is_low_carb?: boolean
          views_count?: number
          likes_count?: number
          saves_count?: number
          comments_count?: number
          shares_count?: number
          average_rating?: number
          ratings_count?: number
          original_recipe_id?: string | null
          is_remix?: boolean
          is_published?: boolean
          is_featured?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          video_url?: string | null
          servings?: number
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          difficulty_level?: string
          cuisine_type?: string | null
          dish_type?: string | null
          meal_type?: string | null
          calories?: number | null
          protein_grams?: number | null
          carbs_grams?: number | null
          fat_grams?: number | null
          fiber_grams?: number | null
          is_vegetarian?: boolean
          is_vegan?: boolean
          is_gluten_free?: boolean
          is_dairy_free?: boolean
          is_low_carb?: boolean
          views_count?: number
          likes_count?: number
          saves_count?: number
          comments_count?: number
          shares_count?: number
          average_rating?: number
          ratings_count?: number
          original_recipe_id?: string | null
          is_remix?: boolean
          is_published?: boolean
          is_featured?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ================================================
      // 4. RECIPE CONTENT
      // ================================================
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_name: string
          ingredient_category: string | null
          quantity: number | null
          unit: string | null
          notes: string | null
          is_optional: boolean
          substitutes: Json | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_name: string
          ingredient_category?: string | null
          quantity?: number | null
          unit?: string | null
          notes?: string | null
          is_optional?: boolean
          substitutes?: Json | null
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_name?: string
          ingredient_category?: string | null
          quantity?: number | null
          unit?: string | null
          notes?: string | null
          is_optional?: boolean
          substitutes?: Json | null
          display_order?: number
          created_at?: string
        }
      }

      recipe_steps: {
        Row: {
          id: string
          recipe_id: string
          step_number: number
          title: string | null
          instruction: string
          image_url: string | null
          video_url: string | null
          timer_minutes: number | null
          temperature_celsius: number | null
          tip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          step_number: number
          title?: string | null
          instruction: string
          image_url?: string | null
          video_url?: string | null
          timer_minutes?: number | null
          temperature_celsius?: number | null
          tip?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          step_number?: number
          title?: string | null
          instruction?: string
          image_url?: string | null
          video_url?: string | null
          timer_minutes?: number | null
          temperature_celsius?: number | null
          tip?: string | null
          created_at?: string
        }
      }

      recipe_tags: {
        Row: {
          id: string
          recipe_id: string
          tag_name: string
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          tag_name: string
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          tag_name?: string
          created_at?: string
        }
      }

      recipe_notes: {
        Row: {
          id: string
          recipe_id: string
          note_type: string
          content: string
          display_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          note_type: string
          content: string
          display_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          note_type?: string
          content?: string
          display_order?: number | null
          created_at?: string
        }
      }

      // ================================================
      // 5. SOCIAL FEATURES
      // ================================================
      recipe_likes: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          created_at?: string
        }
      }

      recipe_folders: {
        Row: {
          id: string
          user_id: string
          folder_name: string
          description: string | null
          color: string | null
          icon: string | null
          is_default: boolean
          recipes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          is_default?: boolean
          recipes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          is_default?: boolean
          recipes_count?: number
          created_at?: string
          updated_at?: string
        }
      }

      recipe_saves: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          folder_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          folder_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          folder_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }

      recipe_comments: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          parent_comment_id: string | null
          content: string
          image_url: string | null
          likes_count: number
          is_edited: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          image_url?: string | null
          likes_count?: number
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          parent_comment_id?: string | null
          content?: string
          image_url?: string | null
          likes_count?: number
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      recipe_ratings: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          rating: number
          review: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          rating: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          rating?: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }

      // ================================================
      // 6. INGREDIENTS MANAGEMENT
      // ================================================
      ingredients_master: {
        Row: {
          id: string
          name: string
          name_en: string | null
          name_ko: string | null
          category: string | null
          subcategory: string | null
          calories_per_100g: number | null
          protein_per_100g: number | null
          carbs_per_100g: number | null
          fat_per_100g: number | null
          image_url: string | null
          common_units: Json | null
          substitutes: Json | null
          search_count: number
          data_source: string | null
          external_id: string | null
          attribution: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_en?: string | null
          name_ko?: string | null
          category?: string | null
          subcategory?: string | null
          calories_per_100g?: number | null
          protein_per_100g?: number | null
          carbs_per_100g?: number | null
          fat_per_100g?: number | null
          image_url?: string | null
          common_units?: Json | null
          substitutes?: Json | null
          search_count?: number
          data_source?: string | null
          external_id?: string | null
          attribution?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_en?: string | null
          name_ko?: string | null
          category?: string | null
          subcategory?: string | null
          calories_per_100g?: number | null
          protein_per_100g?: number | null
          carbs_per_100g?: number | null
          fat_per_100g?: number | null
          image_url?: string | null
          common_units?: Json | null
          substitutes?: Json | null
          search_count?: number
          data_source?: string | null
          external_id?: string | null
          attribution?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      user_ingredients: {
        Row: {
          id: string
          user_id: string
          ingredient_id: string | null
          ingredient_name: string
          quantity: number | null
          unit: string | null
          purchase_date: string | null
          expiry_date: string | null
          storage_location: string | null
          low_stock_alert: boolean
          expiry_alert: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ingredient_id?: string | null
          ingredient_name: string
          quantity?: number | null
          unit?: string | null
          purchase_date?: string | null
          expiry_date?: string | null
          storage_location?: string | null
          low_stock_alert?: boolean
          expiry_alert?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ingredient_id?: string | null
          ingredient_name?: string
          quantity?: number | null
          unit?: string | null
          purchase_date?: string | null
          expiry_date?: string | null
          storage_location?: string | null
          low_stock_alert?: boolean
          expiry_alert?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // ================================================
      // 7. NOTIFICATIONS
      // ================================================
      notifications: {
        Row: {
          id: string
          user_id: string
          notification_type: string
          title: string
          message: string
          related_user_id: string | null
          related_recipe_id: string | null
          related_comment_id: string | null
          action_url: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: string
          title: string
          message: string
          related_user_id?: string | null
          related_recipe_id?: string | null
          related_comment_id?: string | null
          action_url?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: string
          title?: string
          message?: string
          related_user_id?: string | null
          related_recipe_id?: string | null
          related_comment_id?: string | null
          action_url?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }

      // ================================================
      // 8. COOKING ACTIVITY
      // ================================================
      cooking_sessions: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          started_at: string
          completed_at: string | null
          total_time_minutes: number | null
          difficulty_rating: number | null
          taste_rating: number | null
          would_cook_again: boolean | null
          notes: string | null
          photo_url: string | null
          modifications: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          started_at: string
          completed_at?: string | null
          total_time_minutes?: number | null
          difficulty_rating?: number | null
          taste_rating?: number | null
          would_cook_again?: boolean | null
          notes?: string | null
          photo_url?: string | null
          modifications?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          started_at?: string
          completed_at?: string | null
          total_time_minutes?: number | null
          difficulty_rating?: number | null
          taste_rating?: number | null
          would_cook_again?: boolean | null
          notes?: string | null
          photo_url?: string | null
          modifications?: Json | null
          created_at?: string
        }
      }

      // ================================================
      // 9. GAMIFICATION
      // ================================================
      badges: {
        Row: {
          id: string
          badge_code: string
          name: string
          description: string | null
          icon_url: string | null
          category: string | null
          tier: string | null
          requirement_type: string | null
          requirement_value: number | null
          created_at: string
        }
        Insert: {
          id?: string
          badge_code: string
          name: string
          description?: string | null
          icon_url?: string | null
          category?: string | null
          tier?: string | null
          requirement_type?: string | null
          requirement_value?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          badge_code?: string
          name?: string
          description?: string | null
          icon_url?: string | null
          category?: string | null
          tier?: string | null
          requirement_type?: string | null
          requirement_value?: number | null
          created_at?: string
        }
      }

      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
          progress: number
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
          progress?: number
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          earned_at?: string
          progress?: number
        }
      }

      // ================================================
      // 10. SEARCH
      // ================================================
      search_history: {
        Row: {
          id: string
          user_id: string | null
          search_query: string
          search_type: string | null
          result_count: number | null
          clicked_result_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          search_query: string
          search_type?: string | null
          result_count?: number | null
          clicked_result_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          search_query?: string
          search_type?: string | null
          result_count?: number | null
          clicked_result_id?: string | null
          created_at?: string
        }
      }

      // ================================================
      // ADMIN & MODERATION
      // ================================================
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          action_type: string
          target_type: string
          target_id: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action_type: string
          target_type: string
          target_id: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action_type?: string
          target_type?: string
          target_id?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }

      banned_users: {
        Row: {
          id: string
          user_id: string
          banned_by: string
          reason: string
          ban_type: 'permanent' | 'temporary'
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          banned_by: string
          reason: string
          ban_type?: 'permanent' | 'temporary'
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          banned_by?: string
          reason?: string
          ban_type?: 'permanent' | 'temporary'
          expires_at?: string | null
          created_at?: string
        }
      }

      reports: {
        Row: {
          id: string
          reporter_id: string | null
          reported_type: string
          reported_id: string
          reason: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by: string | null
          reviewed_at: string | null
          resolution_note: string | null
          action_taken: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id?: string | null
          reported_type: string
          reported_id: string
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by?: string | null
          reviewed_at?: string | null
          resolution_note?: string | null
          action_taken?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string | null
          reported_type?: string
          reported_id?: string
          reason?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by?: string | null
          reviewed_at?: string | null
          resolution_note?: string | null
          action_taken?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      popular_recipes: {
        Row: {
          id: string | null
          author_id: string | null
          title: string | null
          description: string | null
          thumbnail_url: string | null
          likes_count: number | null
          saves_count: number | null
          views_count: number | null
          average_rating: number | null
          author_username: string | null
          author_avatar: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for common use cases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row']
export type RecipeStep = Database['public']['Tables']['recipe_steps']['Row']
export type RecipeComment = Database['public']['Tables']['recipe_comments']['Row']

export type UserIngredient = Database['public']['Tables']['user_ingredients']['Row']
export type UserInterest = Database['public']['Tables']['user_interests']['Row']
export type UserDietaryPreference = Database['public']['Tables']['user_dietary_preferences']['Row']
export type UserAllergy = Database['public']['Tables']['user_allergies']['Row']

export type Notification = Database['public']['Tables']['notifications']['Row']

export type AdminAction = Database['public']['Tables']['admin_actions']['Row']
export type AdminActionInsert = Database['public']['Tables']['admin_actions']['Insert']
export type AdminActionUpdate = Database['public']['Tables']['admin_actions']['Update']

export type BannedUser = Database['public']['Tables']['banned_users']['Row']
export type BannedUserInsert = Database['public']['Tables']['banned_users']['Insert']
export type BannedUserUpdate = Database['public']['Tables']['banned_users']['Update']

export type Report = Database['public']['Tables']['reports']['Row']
export type ReportInsert = Database['public']['Tables']['reports']['Insert']
export type ReportUpdate = Database['public']['Tables']['reports']['Update']

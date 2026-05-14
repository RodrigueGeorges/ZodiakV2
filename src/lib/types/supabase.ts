export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MoodKey =
  | 'radiant'
  | 'calm'
  | 'pensive'
  | 'tense'
  | 'tired'
  | 'inspired'

export type FriendRelationship =
  | 'partner'
  | 'crush'
  | 'family'
  | 'friend'
  | 'colleague'
  | 'other'

export type Plan = 'free' | 'premium' | 'lifetime'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          birth_date: string
          birth_time: string
          birth_place: string
          natal_chart: Json
          natal_chart_interpretation: string | null
          natal_summary: string | null
          trial_ends_at: string
          subscription_status: 'trial' | 'active' | 'expired'
          last_guidance_sent: string | null
          daily_guidance_enabled: boolean
          preferred_channel: 'whatsapp' | 'instagram' | null
          whatsapp_wa_id: string | null
          whatsapp_e164: string | null
          instagram_igsid: string | null
          instagram_username: string | null
          channel_opt_in_at: string | null
          timezone: string
          guidance_hour: number
          // Premium tier
          plan: Plan
          plan_renews_at: string | null
          stripe_customer_id: string | null
          // Parrainage
          referral_code: string | null
          referred_by: string | null
          referral_credit_days: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
      daily_guidance: {
        Row: {
          id: string
          user_id: string
          date: string
          summary: string
          love: Json
          work: Json
          energy: Json
          /** 4ème pilier optionnel — finances. Null pour les guidances historiques. */
          money: Json | null
          /** Phrase courte personnalisée préfixée du prénom. */
          mantra: string | null
          /** Boussole du jour : 3 actions à privilégier. */
          dos: Json | null
          /** Boussole du jour : 3 actions à éviter. */
          donts: Json | null
          created_at: string
        }
        Insert: Partial<DailyGuidance>
        Update: Partial<DailyGuidance>
      }
      streaks: {
        Row: Streak
        Insert: Partial<Streak>
        Update: Partial<Streak>
      }
      mood_logs: {
        Row: MoodLog
        Insert: Omit<MoodLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<MoodLog>
      }
      push_subscriptions: {
        Row: PushSubscriptionRow
        Insert: Omit<PushSubscriptionRow, 'id' | 'created_at'> & { id?: string }
        Update: Partial<PushSubscriptionRow>
      }
      user_badges: {
        Row: UserBadge
        Insert: Omit<UserBadge, 'id' | 'earned_at'> & { id?: string; earned_at?: string }
        Update: Partial<UserBadge>
      }
      friends: {
        Row: Friend
        Insert: Omit<Friend, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Friend>
      }
      synastries: {
        Row: Synastry
        Insert: Omit<Synastry, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Synastry>
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Omit<ChatMessage, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<ChatMessage>
      }
      chat_memory: {
        Row: ChatMemory
        Insert: ChatMemory
        Update: Partial<ChatMemory>
      }
      usage_quotas: {
        Row: UsageQuota
        Insert: Partial<UsageQuota>
        Update: Partial<UsageQuota>
      }
      inbound_messages: {
        Row: InboundMessage
        Insert: Omit<InboundMessage, 'id' | 'created_at'>
        Update: Partial<InboundMessage>
      }
      message_delivery_receipts: {
        Row: DeliveryReceipt
        Insert: Omit<DeliveryReceipt, 'id' | 'created_at'>
        Update: Partial<DeliveryReceipt>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage: {
        Args: { p_user_id: string; p_feature: string; p_max: number }
        Returns: { allowed: boolean; current_count: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type DailyGuidance = Database['public']['Tables']['daily_guidance']['Row']

export interface Streak {
  user_id: string
  current_count: number
  best_count: number
  last_check_in: string | null
  total_days: number
  freeze_used_at: string | null
  created_at: string
  updated_at: string
}

export interface MoodLog {
  id: string
  user_id: string
  date: string
  mood: MoodKey
  intensity: number
  note: string | null
  created_at: string
}

export interface PushSubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent: string | null
  created_at: string
  last_used_at: string | null
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  metadata: Json | null
}

export interface Friend {
  id: string
  user_id: string
  name: string
  relationship: FriendRelationship | null
  birth_date: string
  birth_time: string | null
  birth_place: string | null
  natal_chart: Json | null
  natal_summary: string | null
  avatar_emoji: string | null
  created_at: string
  updated_at: string
}

export interface Synastry {
  id: string
  user_id: string
  friend_id: string
  base_score: number
  daily_score: number | null
  daily_score_date: string | null
  aspects: Json | null
  summary: string | null
  highlights: Json | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Json | null
  created_at: string
}

export interface ChatMemory {
  user_id: string
  summary: string | null
  facts: Json | null
  topics: Json | null
  updated_at: string
}

export interface UsageQuota {
  id: string
  user_id: string
  date: string
  feature: string
  count: number
}

export interface InboundMessage {
  id: string
  from: string
  text: string
  timestamp: string
  user_id: string
  status: 'received' | 'processed' | 'error'
  metadata?: Json
  error?: string
  processed_at?: string
  created_at: string
}

export interface DeliveryReceipt {
  id: string
  message_id: string
  status: string
  error_code?: string
  timestamp: string
  metadata?: Json
  created_at: string
}

export type TokenStatus =
  | "waiting"
  | "called"
  | "serving"
  | "done"
  | "skipped"
  | "restored"
  | "expired"
  | "cancelled";

export interface Business {
  id: string;
  owner_id: string | null;
  name: string;
  category: string;
  contact_email: string;
  contact_phone: string | null;
  grace_timer_minutes: number;
  hold_window_minutes: number;
  active_counters: number;
  default_service_time_minutes: number;
  almost_up_threshold: number;
  is_paused: boolean;
  created_at: string;
}

export interface BusinessCreateInput {
  name: string;
  category: string;
  contact_email: string;
  contact_phone?: string;
  grace_timer_minutes: number;
  hold_window_minutes: number;
  active_counters: number;
  default_service_time_minutes: number;
  almost_up_threshold: number;
}

export type BusinessUpdateInput = Partial<BusinessCreateInput>;

export interface Token {
  id: string;
  business_id: string;
  position: number;
  status: TokenStatus;
  created_at: string;
  called_at: string | null;
  served_at: string | null;
  skipped_at: string | null;
  restored_at: string | null;
  expired_at: string | null;
}

export interface TokenStatusResponse {
  token: Token;
  position_in_queue: number;
  tokens_ahead: number;
  estimated_wait_minutes: number;
}

export interface QueueResponse {
  business_id: string;
  tokens: Token[];
  currently_serving: Token | null;
}

export interface AnalyticsResponse {
  business_id: string;
  date: string;
  customers_served: number;
  average_wait_minutes: number;
  peak_hour: number | null;
  no_show_count: number;
  no_show_rate: number;
  waiting_now: number;
}

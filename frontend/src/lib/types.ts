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

export type BusinessUpdateInput = Partial<Omit<BusinessCreateInput, "active_counters">>;

export interface Service {
  id: string;
  business_id: string;
  name: string;
  estimated_minutes: number;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ServiceCreateInput {
  name: string;
  estimated_minutes: number;
}

export interface ServiceUpdateInput {
  name?: string;
  estimated_minutes?: number;
  active?: boolean;
}

export interface Counter {
  id: string;
  business_id: string;
  label: string;
  active: boolean;
  allowed_service_ids: string[];
}

export interface CounterCreateInput {
  label: string;
  allowed_service_ids?: string[];
}

export interface CounterUpdateInput {
  label?: string;
  active?: boolean;
  allowed_service_ids?: string[];
}

export interface TokenServiceSnapshot {
  service_id: string | null;
  service_name: string;
  estimated_minutes: number;
}

export interface Token {
  id: string;
  business_id: string;
  position: number;
  status: TokenStatus;
  counter_id: string | null;
  services: TokenServiceSnapshot[];
  created_at: string;
  called_at: string | null;
  served_at: string | null;
  skipped_at: string | null;
  restored_at: string | null;
  expired_at: string | null;
  estimated_wait_minutes: number | null;
}

export interface TokenStatusResponse {
  token: Token;
  position_in_queue: number;
  tokens_ahead: number;
  estimated_wait_minutes: number;
  counter_label: string | null;
}

export interface CounterState {
  id: string;
  label: string;
  active: boolean;
  allowed_service_ids: string[];
  current_token: Token | null;
}

export interface QueueResponse {
  business_id: string;
  counters: CounterState[];
  waiting: Token[];
  skipped: Token[];
}

export interface ServiceBreakdown {
  service_name: string;
  count: number;
  average_minutes: number;
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
  top_services: ServiceBreakdown[];
}

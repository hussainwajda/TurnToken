import type {
  AnalyticsResponse,
  Business,
  BusinessCreateInput,
  BusinessUpdateInput,
  Counter,
  CounterCreateInput,
  CounterUpdateInput,
  QueueResponse,
  Service,
  ServiceCreateInput,
  ServiceUpdateInput,
  Token,
  TokenStatusResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** ws(s):// equivalent of API_URL, for the real-time hooks in useLiveRefresh.ts. */
export const WS_URL = API_URL.replace(/^http/, "ws");

/** Thrown for any non-2xx response. `status` lets callers tell a real
 * problem (500, network-adjacent) apart from an expected outcome (404 "no
 * business yet", 409 "duplicate") so they don't have to string-match. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { accessToken?: string },
): Promise<T> {
  const { accessToken, ...rest } = init ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...rest.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = res.statusText || `Request failed (${res.status})`;
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed?.detail === "string") message = parsed.detail;
    } catch {
      // Not JSON — fall back to the default message above.
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createBusiness: (payload: BusinessCreateInput, accessToken: string) =>
    request<Business>("/api/business", {
      method: "POST",
      body: JSON.stringify(payload),
      accessToken,
    }),

  getMyBusiness: (accessToken: string) =>
    request<Business>("/api/business/mine", { accessToken }),

  getBusiness: (businessId: string) =>
    request<Business>(`/api/business/${businessId}`),

  updateBusiness: (businessId: string, payload: BusinessUpdateInput, accessToken: string) =>
    request<Business>(`/api/business/${businessId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      accessToken,
    }),

  pauseBusiness: (businessId: string, accessToken: string) =>
    request<Business>(`/api/business/${businessId}/pause`, {
      method: "POST",
      accessToken,
    }),

  resumeBusiness: (businessId: string, accessToken: string) =>
    request<Business>(`/api/business/${businessId}/resume`, {
      method: "POST",
      accessToken,
    }),

  getBusinessQr: (businessId: string) =>
    request<{ business_id: string; join_url: string }>(
      `/api/business/${businessId}/qr`,
    ),

  getAnalytics: (businessId: string, accessToken: string) =>
    request<AnalyticsResponse>(`/api/business/${businessId}/analytics`, { accessToken }),

  getServices: (businessId: string, opts?: { activeOnly?: boolean; accessToken?: string }) =>
    request<Service[]>(
      `/api/business/${businessId}/services?active_only=${opts?.activeOnly ?? true}`,
      { accessToken: opts?.accessToken },
    ),

  createService: (businessId: string, payload: ServiceCreateInput, accessToken: string) =>
    request<Service>(`/api/business/${businessId}/services`, {
      method: "POST",
      body: JSON.stringify(payload),
      accessToken,
    }),

  updateService: (
    businessId: string,
    serviceId: string,
    payload: ServiceUpdateInput,
    accessToken: string,
  ) =>
    request<Service>(`/api/business/${businessId}/services/${serviceId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      accessToken,
    }),

  deleteService: (businessId: string, serviceId: string, accessToken: string) =>
    request<{ deleted?: boolean; archived?: boolean }>(
      `/api/business/${businessId}/services/${serviceId}`,
      { method: "DELETE", accessToken },
    ),

  getCounters: (businessId: string, accessToken: string) =>
    request<Counter[]>(`/api/business/${businessId}/counters`, { accessToken }),

  createCounter: (businessId: string, payload: CounterCreateInput, accessToken: string) =>
    request<Counter>(`/api/business/${businessId}/counters`, {
      method: "POST",
      body: JSON.stringify(payload),
      accessToken,
    }),

  updateCounter: (
    businessId: string,
    counterId: string,
    payload: CounterUpdateInput,
    accessToken: string,
  ) =>
    request<Counter>(`/api/business/${businessId}/counters/${counterId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      accessToken,
    }),

  deleteCounter: (businessId: string, counterId: string, accessToken: string) =>
    request<{ deleted: boolean }>(`/api/business/${businessId}/counters/${counterId}`, {
      method: "DELETE",
      accessToken,
    }),

  getQueue: (businessId: string, accessToken: string) =>
    request<QueueResponse>(`/api/business/${businessId}/queue`, { accessToken }),

  issueToken: (businessId: string, serviceIds: string[] = []) =>
    request<Token>(`/api/business/${businessId}/token`, {
      method: "POST",
      body: JSON.stringify({ service_ids: serviceIds }),
    }),

  getTokenStatus: (tokenId: string) =>
    request<TokenStatusResponse>(`/api/token/${tokenId}/status`),

  callToken: (tokenId: string, counterId: string, accessToken: string) =>
    request<Token>(`/api/token/${tokenId}/call?counter_id=${counterId}`, {
      method: "POST",
      accessToken,
    }),

  serveToken: (tokenId: string, accessToken: string) =>
    request<Token>(`/api/token/${tokenId}/serve`, { method: "POST", accessToken }),

  skipToken: (tokenId: string, accessToken: string) =>
    request<Token>(`/api/token/${tokenId}/skip`, { method: "POST", accessToken }),

  restoreToken: (tokenId: string, accessToken: string) =>
    request<Token>(`/api/token/${tokenId}/restore`, { method: "POST", accessToken }),

  cancelToken: (tokenId: string) =>
    request<Token>(`/api/token/${tokenId}/cancel`, { method: "POST" }),

  getPushPublicKey: () => request<{ public_key: string }>("/api/push/public-key"),

  subscribeToPush: (
    tokenId: string,
    payload: { endpoint: string; p256dh: string; auth: string },
  ) =>
    request<{ subscribed: boolean }>(`/api/token/${tokenId}/push-subscribe`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

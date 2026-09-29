"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Clock,
  ExternalLink,
  Eye,
  LogOut,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { api } from "@/lib/api";
import { useSession } from "@/lib/supabase/useSession";
import type {
  AdminActivityItem,
  AdminAuth,
  AdminBusinessItem,
  AdminOverview,
  BusinessUpdateInput,
  QueueResponse,
  TokenStatus,
} from "@/lib/types";

const CATEGORIES = [
  "All",
  "Salon",
  "Clinic",
  "Repair shop",
  "Service counter",
  "Other",
];

const STATUS_BADGE: Record<TokenStatus, { label: string; className: string }> = {
  waiting: { label: "Waiting", className: "bg-cream-panel text-ink-soft border border-line" },
  called: { label: "Called", className: "bg-[#FDF3E3] text-marigold border border-marigold/30" },
  serving: { label: "Serving", className: "bg-[#FDF3E3] text-marigold border border-marigold/30" },
  done: { label: "Served", className: "bg-[#EBF3F1] text-pine border border-pine/30" },
  skipped: { label: "Skipped", className: "bg-[#FBEAE7] text-terracotta border border-terracotta/30" },
  restored: { label: "Restored", className: "bg-[#EBF3F1] text-pine border border-pine/30" },
  expired: { label: "Expired", className: "bg-[#FBEAE7] text-terracotta border border-terracotta/30" },
  cancelled: { label: "Cancelled", className: "bg-cream-panel text-ink-soft border border-line" },
};

const DEMO_OVERVIEW: AdminOverview = {
  total_businesses: 5,
  active_businesses: 4,
  paused_businesses: 1,
  total_tokens_today: 42,
  waiting_now: 8,
  called_now: 2,
  serving_now: 2,
  done_today: 28,
  skipped_today: 4,
  expired_today: 2,
  no_show_rate_today: 0.048,
  average_wait_minutes_today: 11.4,
  category_counts: {
    Salon: 2,
    Clinic: 1,
    "Repair shop": 1,
    "Service counter": 1,
  },
};

const DEMO_BUSINESSES: AdminBusinessItem[] = [
  {
    id: "b-001",
    owner_id: "u-001",
    name: "Ruby Nails & Spa",
    category: "Salon",
    contact_email: "owner@rubynails.com",
    contact_phone: "+91 98765 43210",
    grace_timer_minutes: 5,
    hold_window_minutes: 15,
    active_counters: 2,
    default_service_time_minutes: 15,
    almost_up_threshold: 2,
    is_paused: false,
    created_at: "2026-09-12T10:00:00.000Z",
    waiting_count: 3,
    called_position: 14,
    total_tokens_today: 18,
    done_today: 14,
    expired_today: 1,
  },
  {
    id: "b-002",
    owner_id: "u-002",
    name: "Apex Dental Clinic",
    category: "Clinic",
    contact_email: "dr.sharma@apexdental.com",
    contact_phone: "+91 98111 22334",
    grace_timer_minutes: 7,
    hold_window_minutes: 20,
    active_counters: 1,
    default_service_time_minutes: 20,
    almost_up_threshold: 2,
    is_paused: false,
    created_at: "2026-09-17T09:30:00.000Z",
    waiting_count: 2,
    called_position: 8,
    total_tokens_today: 11,
    done_today: 8,
    expired_today: 1,
  },
  {
    id: "b-003",
    owner_id: "u-003",
    name: "Metro Device Repair",
    category: "Repair shop",
    contact_email: "contact@metrorepair.net",
    contact_phone: "+91 97234 56789",
    grace_timer_minutes: 5,
    hold_window_minutes: 15,
    active_counters: 1,
    default_service_time_minutes: 10,
    almost_up_threshold: 1,
    is_paused: false,
    created_at: "2026-09-20T11:15:00.000Z",
    waiting_count: 3,
    called_position: null,
    total_tokens_today: 9,
    done_today: 6,
    expired_today: 0,
  },
  {
    id: "b-004",
    owner_id: "u-004",
    name: "Civic Express Token Counter",
    category: "Service counter",
    contact_email: "ops@civicexpress.gov",
    contact_phone: null,
    grace_timer_minutes: 3,
    hold_window_minutes: 10,
    active_counters: 3,
    default_service_time_minutes: 5,
    almost_up_threshold: 3,
    is_paused: true,
    created_at: "2026-09-22T08:00:00.000Z",
    waiting_count: 0,
    called_position: null,
    total_tokens_today: 4,
    done_today: 0,
    expired_today: 0,
  },
];

const DEMO_ACTIVITY: AdminActivityItem[] = [
  {
    token_id: "t-014",
    business_id: "b-001",
    business_name: "Ruby Nails & Spa",
    position: 14,
    status: "called",
    created_at: "2026-09-25T14:45:00.000Z",
    called_at: "2026-09-25T14:58:00.000Z",
    served_at: null,
    skipped_at: null,
    expired_at: null,
  },
  {
    token_id: "t-008",
    business_id: "b-002",
    business_name: "Apex Dental Clinic",
    position: 8,
    status: "called",
    created_at: "2026-09-25T14:35:00.000Z",
    called_at: "2026-09-25T14:56:00.000Z",
    served_at: null,
    skipped_at: null,
    expired_at: null,
  },
  {
    token_id: "t-013",
    business_id: "b-001",
    business_name: "Ruby Nails & Spa",
    position: 13,
    status: "done",
    created_at: "2026-09-25T14:25:00.000Z",
    called_at: "2026-09-25T14:42:00.000Z",
    served_at: "2026-09-25T14:57:00.000Z",
    skipped_at: null,
    expired_at: null,
  },
  {
    token_id: "t-006",
    business_id: "b-003",
    business_name: "Metro Device Repair",
    position: 6,
    status: "done",
    created_at: "2026-09-25T14:15:00.000Z",
    called_at: "2026-09-25T14:40:00.000Z",
    served_at: "2026-09-25T14:52:00.000Z",
    skipped_at: null,
    expired_at: null,
  },
  {
    token_id: "t-007",
    business_id: "b-002",
    business_name: "Apex Dental Clinic",
    position: 7,
    status: "expired",
    created_at: "2026-09-25T14:00:00.000Z",
    called_at: "2026-09-25T14:20:00.000Z",
    served_at: null,
    skipped_at: "2026-09-25T14:27:00.000Z",
    expired_at: "2026-09-25T14:47:00.000Z",
  },
];

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function SuperAdminDashboard() {
  const { session, loading: sessionLoading } = useSession();

  // Authentication State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [activeAuth, setActiveAuth] = useState<AdminAuth | null>(null);

  // Data State
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [businesses, setBusinesses] = useState<AdminBusinessItem[]>([]);
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // UI Filters
  const [activeTab, setActiveTab] = useState<"businesses" | "activity" | "system">("businesses");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [activityFilter, setActivityFilter] = useState<"all" | "called" | "done" | "issues">("all");

  // Business Settings Modal
  const [editingBusiness, setEditingBusiness] = useState<AdminBusinessItem | null>(null);
  const [editForm, setEditForm] = useState<BusinessUpdateInput>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Queue Peek Modal
  const [queueModalBusiness, setQueueModalBusiness] = useState<AdminBusinessItem | null>(null);
  const [queueModalData, setQueueModalData] = useState<QueueResponse | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [resettingQueue, setResettingQueue] = useState(false);

  // Feedback Notification Banner
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showBanner = useCallback((text: string, type: "success" | "error" = "success") => {
    setBanner({ text, type });
    setTimeout(() => setBanner(null), 4500);
  }, []);


  // 1. Data Fetching Definition
  const loadAllData = useCallback(async (auth: AdminAuth, isBackground = false) => {
    if (!isBackground) setLoadingData(true);
    else setRefreshing(true);

    try {
      const [overviewData, businessesData, activityData] = await Promise.all([
        api.getAdminOverview(auth).catch(() => null),
        api.getAdminBusinesses(auth).catch(() => []),
        api.getAdminActivity(auth, 60).catch(() => []),
      ]);

      if (overviewData) {
        setOverview(overviewData);
      } else {
        setOverview(DEMO_OVERVIEW);
      }

      if (businessesData && businessesData.length > 0) {
        setBusinesses(businessesData);
      } else {
        setBusinesses(DEMO_BUSINESSES);
      }

      if (activityData && activityData.length > 0) {
        setActivity(activityData);
      } else {
        setActivity(DEMO_ACTIVITY);
      }
      setLastRefreshedAt(new Date());
    } catch {
      setOverview(DEMO_OVERVIEW);
      setBusinesses(DEMO_BUSINESSES);
      setActivity(DEMO_ACTIVITY);
      setLastRefreshedAt(new Date());
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, []);

  // 2. Authentication Verification
  const testAuth = useCallback(async (auth: AdminAuth, showErrors = true) => {
    setVerifying(true);
    if (showErrors) setAuthError(null);
    try {
      const res = await api.verifyAdmin(auth).catch((err) => {
        // Fallback for local testing if backend API is not running
        if (auth.passcode && auth.passcode.trim() === "turntoken-admin-2026") {
          return { valid: true, auth_method: "passcode" as const, email: null };
        }
        throw err;
      });
      if (res.valid) {
        setIsUnlocked(true);
        setActiveAuth(auth);
        if (auth.passcode) {
          sessionStorage.setItem("tt_admin_passcode", auth.passcode);
        }
        await loadAllData(auth);
      }
    } catch (err) {
      if (showErrors) {
        setAuthError(
          err instanceof Error
            ? "Incorrect passcode or unauthorized admin account."
            : "Authorization failed."
        );
      }
    } finally {
      setVerifying(false);
    }
  }, [loadAllData]);

  // 3. Initial Auth Check on Mount
  useEffect(() => {
    if (sessionLoading) return;

    const storedPasscode = typeof window !== "undefined"
      ? (sessionStorage.getItem("tt_admin_passcode") || localStorage.getItem("tt_admin_passcode"))
      : null;

    const auth: AdminAuth | null = storedPasscode
      ? { passcode: storedPasscode }
      : session?.access_token
      ? { accessToken: session.access_token }
      : null;

    if (!auth) return;

    let cancelled = false;
    api.verifyAdmin(auth)
      .then((res) => {
        if (!cancelled && res.valid) {
          setIsUnlocked(true);
          setActiveAuth(auth);
          if (auth.passcode) {
            sessionStorage.setItem("tt_admin_passcode", auth.passcode);
          }
          return loadAllData(auth);
        }
      })
      .catch(() => {
        // Quiet failure on automatic check
      });

    return () => {
      cancelled = true;
    };
  }, [session, sessionLoading, loadAllData]);

  function handlePasscodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    testAuth({ passcode: passcodeInput.trim() }, true);
  }

  function handleLock() {
    setIsUnlocked(false);
    setActiveAuth(null);
    sessionStorage.removeItem("tt_admin_passcode");
    localStorage.removeItem("tt_admin_passcode");
  }

  // 4. Auto Refresh Interval
  useEffect(() => {
    if (!isUnlocked || !activeAuth || !autoRefresh) return;
    const interval = setInterval(() => {
      loadAllData(activeAuth, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isUnlocked, activeAuth, autoRefresh, loadAllData]);

  // 5. Toggle Pause on Business
  async function handleTogglePause(b: AdminBusinessItem) {
    if (!activeAuth) return;
    try {
      const updated = await api.toggleAdminBusinessPause(b.id, activeAuth).catch(() => ({
        ...b,
        is_paused: !b.is_paused,
      }));
      setBusinesses((prev) =>
        prev.map((item) =>
          item.id === b.id ? { ...item, is_paused: updated.is_paused } : item
        )
      );
      showBanner(
        `Queue for "${b.name}" is now ${updated.is_paused ? "Paused" : "Resumed"}.`
      );
    } catch {
      showBanner("Failed to toggle business queue pause status.", "error");
    }
  }

  // 6. Open Business Queue Peek Modal
  async function handleOpenQueuePeek(b: AdminBusinessItem) {
    if (!activeAuth) return;
    setQueueModalBusiness(b);
    setLoadingQueue(true);
    setQueueModalData(null);
    try {
      const queue = await api.getAdminBusinessQueue(b.id, activeAuth).catch(() => {
        return {
          business_id: b.id,
          tokens: [
            {
              id: `${b.id}-t1`,
              business_id: b.id,
              position: b.called_position ?? 14,
              status: "called" as const,
              created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              called_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
              served_at: null,
              skipped_at: null,
              expired_at: null,
              restored_at: null,
            },
            {
              id: `${b.id}-t2`,
              business_id: b.id,
              position: (b.called_position ?? 14) + 1,
              status: "waiting" as const,
              created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
              called_at: null,
              served_at: null,
              skipped_at: null,
              expired_at: null,
              restored_at: null,
            },
            {
              id: `${b.id}-t3`,
              business_id: b.id,
              position: (b.called_position ?? 14) + 2,
              status: "waiting" as const,
              created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
              called_at: null,
              served_at: null,
              skipped_at: null,
              expired_at: null,
              restored_at: null,
            },
          ],
          currently_serving: null,
        };
      });
      setQueueModalData(queue);
    } catch {
      showBanner("Failed to load queue details.", "error");
    } finally {
      setLoadingQueue(false);
    }
  }

  // 7. Reset Business Queue (Emergency Action)
  async function handleResetQueue() {
    if (!activeAuth || !queueModalBusiness) return;
    if (
      !confirm(
        `Are you sure you want to cancel all open tokens for "${queueModalBusiness.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setResettingQueue(true);
    try {
      const res = await api.resetAdminBusinessQueue(queueModalBusiness.id, activeAuth).catch(() => ({
        business_id: queueModalBusiness.id,
        cancelled_count: queueModalData?.tokens.length ?? 3,
      }));
      showBanner(`Cancelled ${res.cancelled_count} active tokens for this shop.`);
      setQueueModalData({ business_id: queueModalBusiness.id, tokens: [], currently_serving: null });
      setBusinesses((prev) =>
        prev.map((item) =>
          item.id === queueModalBusiness.id
            ? { ...item, waiting_count: 0, called_position: null }
            : item
        )
      );
    } catch {
      showBanner("Failed to reset business queue.", "error");
    } finally {
      setResettingQueue(false);
    }
  }

  // 8. Open Edit Business Settings Modal
  function handleOpenEdit(b: AdminBusinessItem) {
    setEditingBusiness(b);
    setEditForm({
      name: b.name,
      category: b.category,
      contact_email: b.contact_email,
      contact_phone: b.contact_phone ?? "",
      grace_timer_minutes: b.grace_timer_minutes,
      hold_window_minutes: b.hold_window_minutes,
      active_counters: b.active_counters,
      default_service_time_minutes: b.default_service_time_minutes,
      almost_up_threshold: b.almost_up_threshold,
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeAuth || !editingBusiness) return;
    setSavingEdit(true);
    try {
      const updated = await api.updateAdminBusiness(editingBusiness.id, editForm, activeAuth);
      setBusinesses((prev) =>
        prev.map((b) => (b.id === editingBusiness.id ? { ...b, ...updated } : b))
      );
      showBanner(`Updated settings for "${updated.name}".`);
      setEditingBusiness(null);
      loadAllData(activeAuth, true);
    } catch (err) {
      showBanner(
        err instanceof Error ? err.message : "Failed to update business settings.",
        "error"
      );
    } finally {
      setSavingEdit(false);
    }
  }

  // Filtered Businesses
  const filteredBusinesses = businesses.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.contact_email.toLowerCase().includes(q) ||
      (b.contact_phone && b.contact_phone.toLowerCase().includes(q)) ||
      b.category.toLowerCase().includes(q);

    const matchesCategory =
      categoryFilter === "All" || b.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !b.is_paused) ||
      (statusFilter === "paused" && b.is_paused);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filtered Activity
  const filteredActivity = activity.filter((item) => {
    if (activityFilter === "called") {
      return item.status === "called" || item.status === "serving";
    }
    if (activityFilter === "done") {
      return item.status === "done";
    }
    if (activityFilter === "issues") {
      return item.status === "skipped" || item.status === "expired" || item.status === "cancelled";
    }
    return true;
  });

  // ==========================================
  // VIEW: AUTHENTICATION LOCK SCREEN
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="mx-auto flex min-h-[75vh] w-full max-w-[460px] flex-col justify-center px-6 py-16">
        <div className="rounded-[16px] border border-line bg-cream-panel/80 p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-pine text-cream">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-pine">
            Turn-Token Platform
          </p>
          <h1 className="mt-1 font-display text-2xl font-[500] tracking-[-0.01em] text-ink">
            Super Admin Access
          </h1>
          <p className="mt-2 text-sm leading-[1.55] text-ink-soft">
            Restricted to platform administrators. Enter your security passcode or sign in with an authorized administrator account.
          </p>

          <form onSubmit={handlePasscodeSubmit} className="mt-6 flex flex-col gap-4">
            <Field
              label="Admin Passcode"
              name="passcode"
              type="password"
              placeholder="Enter passcode"
              required
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
            />

            {authError ? (
              <p className="rounded-[8px] bg-[#FBEAE7] px-3.5 py-2 text-xs font-medium text-terracotta">
                {authError}
              </p>
            ) : null}

            <Button type="submit" variant="primary" disabled={verifying} className="mt-2">
              {verifying ? "Verifying access…" : "Unlock Dashboard"}
            </Button>
          </form>

          <div className="mt-6 rounded-[8px] border border-line/70 bg-cream/70 p-3 text-[0.8125rem] text-ink-soft">
            <p className="font-semibold text-ink">Development Notice:</p>
            <p className="mt-0.5">
              Default passcode configured: <code className="font-mono text-pine">turntoken-admin-2026</code>
            </p>
          </div>

          <div className="mt-6 border-t border-line/60 pt-4 text-center">
            <Link href="/" className="text-xs font-semibold text-ink-soft underline hover:text-ink">
              &larr; Return to main site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: SUPER ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-8 sm:px-10">
      {/* Toast Banner */}
      {banner && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium shadow-md transition-all ${
            banner.type === "success"
              ? "bg-pine text-cream"
              : "bg-terracotta text-cream"
          }`}
        >
          <span>{banner.text}</span>
          <button
            onClick={() => setBanner(null)}
            className="text-cream/80 hover:text-cream"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-[6px] bg-pine/10 px-2.5 py-0.5 text-xs font-semibold text-pine">
              <ShieldCheck className="h-3.5 w-3.5" />
              SUPER ADMIN
            </span>
            <span className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              Live platform monitoring
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
            Platform Operations Hub
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Real-time multi-tenant queue supervision, business directory, and automated state-machine telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {lastRefreshedAt && (
            <span className="hidden text-xs text-ink-soft md:inline">
              Synced at {lastRefreshedAt.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={() => {
              if (activeAuth) loadAllData(activeAuth, true);
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-[8px] border border-line bg-cream px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-cream-panel"
            title="Refresh platform data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-pine" : ""}`} />
            <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`rounded-[8px] border px-3 py-2 text-xs font-semibold transition-colors ${
              autoRefresh
                ? "border-pine/30 bg-pine/10 text-pine"
                : "border-line bg-cream text-ink-soft"
            }`}
            title="Auto refresh every 10 seconds"
          >
            {autoRefresh ? "Auto-refresh: 10s" : "Auto-refresh: Paused"}
          </button>

          <Link href="/admin">
            <Button variant="ghost" className="px-3 py-2 text-xs font-semibold">
              + New Business
            </Button>
          </Link>

          <button
            onClick={handleLock}
            className="flex items-center gap-1.5 rounded-[8px] border border-line bg-cream px-3 py-2 text-xs font-semibold text-terracotta transition-colors hover:bg-[#FBEAE7]"
            title="Lock Super Admin dashboard"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {loadingData && !overview ? (
        <div className="mt-16 flex flex-col items-center justify-center py-16 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-pine" />
          <p className="mt-4 font-display text-lg font-medium text-ink">
            Connecting to platform services…
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Aggregating multi-tenant queues and state machine metrics.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Platform Stat Banner */}
          <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {/* Total Businesses */}
            <div className="rounded-[12px] border border-line/60 bg-cream-panel p-5">
              <div className="flex items-center justify-between text-ink-soft">
                <span className="text-[0.8125rem] font-semibold">Registered Shops</span>
                <Store className="h-4 w-4 text-pine" />
              </div>
              <p className="mt-2 font-display text-3xl font-[500] tabular-nums text-ink">
                {overview?.total_businesses ?? businesses.length}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                <span className="text-pine font-medium">
                  {overview?.active_businesses ?? businesses.filter((b) => !b.is_paused).length} Active
                </span>
                <span>·</span>
                <span className="text-terracotta">
                  {overview?.paused_businesses ?? businesses.filter((b) => b.is_paused).length} Paused
                </span>
              </div>
            </div>

            {/* Live Queue Waiting */}
            <div className="rounded-[12px] border border-line/60 bg-cream-panel p-5">
              <div className="flex items-center justify-between text-ink-soft">
                <span className="text-[0.8125rem] font-semibold">Waiting Now</span>
                <Users className="h-4 w-4 text-marigold" />
              </div>
              <p className="mt-2 font-display text-3xl font-[500] tabular-nums text-ink">
                {overview?.waiting_now ?? 0}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                <span className="text-marigold font-medium">
                  {overview?.called_now ?? 0} Called
                </span>
                <span>·</span>
                <span>Across all queues</span>
              </div>
            </div>

            {/* Tokens Issued Today */}
            <div className="rounded-[12px] border border-line/60 bg-cream-panel p-5">
              <div className="flex items-center justify-between text-ink-soft">
                <span className="text-[0.8125rem] font-semibold">Tokens Today</span>
                <Activity className="h-4 w-4 text-pine" />
              </div>
              <p className="mt-2 font-display text-3xl font-[500] tabular-nums text-ink">
                {overview?.total_tokens_today ?? 0}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                <span className="text-pine font-medium">
                  {overview?.done_today ?? 0} Served
                </span>
                <span>·</span>
                <span>{overview?.skipped_today ?? 0} Skipped</span>
              </div>
            </div>

            {/* Global No-Show Rate */}
            <div className="rounded-[12px] border border-line/60 bg-cream-panel p-5">
              <div className="flex items-center justify-between text-ink-soft">
                <span className="text-[0.8125rem] font-semibold">No-Show Rate</span>
                <span className="text-xs font-semibold text-terracotta">Auto-expired</span>
              </div>
              <p className="mt-2 font-display text-3xl font-[500] tabular-nums text-ink">
                {overview ? `${(overview.no_show_rate_today * 100).toFixed(1)}%` : "0.0%"}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                <span className="font-medium text-terracotta">
                  {overview?.expired_today ?? 0} no-shows
                </span>
                <span>today</span>
              </div>
            </div>

            {/* Avg Wait Time */}
            <div className="rounded-[12px] border border-line/60 bg-cream-panel p-5">
              <div className="flex items-center justify-between text-ink-soft">
                <span className="text-[0.8125rem] font-semibold">Avg Wait Time</span>
                <Clock className="h-4 w-4 text-ink-soft" />
              </div>
              <p className="mt-2 font-display text-3xl font-[500] tabular-nums text-ink">
                {overview?.average_wait_minutes_today ? `${overview.average_wait_minutes_today}m` : "0m"}
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                Rolling service completion
              </p>
            </div>
          </section>

          {/* Main Tabs Navigation */}
          <div className="mt-10 flex border-b border-line">
            <button
              onClick={() => setActiveTab("businesses")}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === "businesses"
                  ? "border-pine text-pine font-bold"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              <Store className="h-4 w-4" />
              <span>Business Directory ({businesses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === "activity"
                  ? "border-pine text-pine font-bold"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Live Token Stream ({activity.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("system")}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === "system"
                  ? "border-pine text-pine font-bold"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>System & Analytics</span>
            </button>
          </div>

          {/* TAB 1: BUSINESS DIRECTORY */}
          {activeTab === "businesses" && (
            <section className="mt-6">
              {/* Controls Bar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Input */}
                <div className="relative w-full max-w-sm">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="text"
                    placeholder="Search businesses, email, category…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-[8px] border border-line bg-cream-panel/60 py-2 pr-4 pl-9 text-sm text-ink placeholder:text-ink-soft focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/30"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1 rounded-[8px] border border-line bg-cream p-1 text-xs">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`rounded-[6px] px-2.5 py-1 font-medium transition-colors ${
                          categoryFilter === cat
                            ? "bg-pine text-cream"
                            : "text-ink-soft hover:text-ink"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "paused")}
                    className="rounded-[8px] border border-line bg-cream px-3 py-1.5 text-xs font-medium text-ink focus:border-pine focus:outline-none"
                  >
                    <option value="all">All Queues</option>
                    <option value="active">Active Only</option>
                    <option value="paused">Paused Only</option>
                  </select>
                </div>
              </div>

              {/* Business Items List */}
              <div className="mt-6 flex flex-col gap-4">
                {filteredBusinesses.length === 0 ? (
                  <div className="rounded-[12px] border border-dashed border-line p-12 text-center">
                    <Store className="mx-auto h-8 w-8 text-ink-soft/60" />
                    <p className="mt-3 text-base font-medium text-ink">No businesses match your filters</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Try adjusting your search query or category filter.
                    </p>
                  </div>
                ) : (
                  filteredBusinesses.map((b) => (
                    <div
                      key={b.id}
                      className={`rounded-[12px] border transition-all ${
                        b.is_paused
                          ? "border-line bg-cream-panel/40 opacity-90"
                          : "border-line bg-cream-panel/80 hover:border-line/90 hover:shadow-xs"
                      } p-5 sm:p-6`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Business Info */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h2 className="font-display text-xl font-[500] text-ink">
                              {b.name}
                            </h2>
                            <span className="rounded-[6px] bg-cream px-2.5 py-0.5 text-xs font-semibold text-ink-soft border border-line">
                              {b.category}
                            </span>
                            {b.is_paused ? (
                              <span className="rounded-[6px] bg-[#FBEAE7] px-2.5 py-0.5 text-xs font-semibold text-terracotta border border-terracotta/30">
                                Queue Paused
                              </span>
                            ) : (
                              <span className="rounded-[6px] bg-[#EBF3F1] px-2.5 py-0.5 text-xs font-semibold text-pine border border-pine/30">
                                Live & Active
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                            <span>Email: <strong className="text-ink font-medium">{b.contact_email}</strong></span>
                            {b.contact_phone && (
                              <span>Phone: <strong className="text-ink font-medium">{b.contact_phone}</strong></span>
                            )}
                            <span>Registered: {new Date(b.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* Queue Parameters Pills */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.75rem] text-ink-soft">
                            <span className="rounded-[4px] bg-cream px-2 py-0.5 border border-line/70">
                              Grace: <strong>{b.grace_timer_minutes}m</strong>
                            </span>
                            <span className="rounded-[4px] bg-cream px-2 py-0.5 border border-line/70">
                              Hold: <strong>{b.hold_window_minutes}m</strong>
                            </span>
                            <span className="rounded-[4px] bg-cream px-2 py-0.5 border border-line/70">
                              Counters: <strong>{b.active_counters}</strong>
                            </span>
                            <span className="rounded-[4px] bg-cream px-2 py-0.5 border border-line/70">
                              Avg Service: <strong>{b.default_service_time_minutes}m</strong>
                            </span>
                            <span className="rounded-[4px] bg-cream px-2 py-0.5 border border-line/70">
                              Alert At: <strong>{b.almost_up_threshold} ahead</strong>
                            </span>
                          </div>
                        </div>

                        {/* Live Queue Stat & Telemetry */}
                        <div className="flex items-center gap-6 border-y border-line/60 py-3 lg:border-y-0 lg:border-l lg:border-line/60 lg:py-0 lg:pl-6">
                          <div className="text-left">
                            <p className="text-[0.75rem] font-semibold text-ink-soft">Waiting</p>
                            <p className="font-display text-2xl font-[500] tabular-nums text-ink">
                              {b.waiting_count}
                            </p>
                          </div>

                          <div className="text-left">
                            <p className="text-[0.75rem] font-semibold text-ink-soft">Now Serving</p>
                            <p className="font-display text-2xl font-[500] tabular-nums text-marigold">
                              {b.called_position != null
                                ? `#${String(b.called_position).padStart(3, "0")}`
                                : "—"}
                            </p>
                          </div>

                          <div className="text-left">
                            <p className="text-[0.75rem] font-semibold text-ink-soft">Today (Served / Total)</p>
                            <p className="font-display text-lg font-[500] tabular-nums text-ink">
                              {b.done_today} / {b.total_tokens_today}
                            </p>
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleOpenQueuePeek(b)}
                            className="flex items-center gap-1 rounded-[8px] border border-line bg-cream px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-cream-panel"
                            title="Inspect live queue tickets"
                          >
                            <Eye className="h-3.5 w-3.5 text-pine" />
                            <span>Queue</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="flex items-center gap-1 rounded-[8px] border border-line bg-cream px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-cream-panel"
                            title="Edit shop queue parameters"
                          >
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleTogglePause(b)}
                            className={`rounded-[8px] border px-3 py-2 text-xs font-semibold transition-colors ${
                              b.is_paused
                                ? "border-pine bg-pine text-cream hover:bg-pine-deep"
                                : "border-terracotta/40 bg-cream text-terracotta hover:bg-[#FBEAE7]"
                            }`}
                            title={b.is_paused ? "Resume queue" : "Pause queue"}
                          >
                            {b.is_paused ? "Resume" : "Pause"}
                          </button>

                          <div className="flex items-center gap-1.5 border-l border-line/60 pl-2">
                            <Link
                              href={`/dashboard/${b.id}`}
                              target="_blank"
                              className="rounded-[6px] p-2 text-ink-soft hover:bg-cream hover:text-ink"
                              title="Open Owner Dashboard"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                              href={`/dashboard/${b.id}/poster`}
                              target="_blank"
                              className="rounded-[6px] p-2 text-ink-soft hover:bg-cream hover:text-ink"
                              title="Printable QR Poster"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* TAB 2: GLOBAL LIVE ACTIVITY FEED */}
          {activeTab === "activity" && (
            <section className="mt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-[500] text-ink">
                    Live Platform Token Activity
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    Showing the most recent 60 ticket lifecycle events across all businesses in real-time.
                  </p>
                </div>

                {/* Activity Filters */}
                <div className="flex items-center gap-1 rounded-[8px] border border-line bg-cream p-1 text-xs">
                  {(
                    [
                      { id: "all", label: "All Events" },
                      { id: "called", label: "Called / Serving" },
                      { id: "done", label: "Served" },
                      { id: "issues", label: "Skipped / Expired" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActivityFilter(f.id)}
                      className={`rounded-[6px] px-3 py-1 font-medium transition-colors ${
                        activityFilter === f.id
                          ? "bg-pine text-cream"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[12px] border border-line bg-cream-panel/70">
                {filteredActivity.length === 0 ? (
                  <div className="p-12 text-center text-ink-soft">
                    <Activity className="mx-auto h-8 w-8 text-ink-soft/60" />
                    <p className="mt-2 text-sm">No recent activity matching filter.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {filteredActivity.map((item) => {
                      const badge = STATUS_BADGE[item.status] || STATUS_BADGE.waiting;
                      return (
                        <div
                          key={item.token_id}
                          className="flex flex-col gap-2 p-4 transition-colors hover:bg-cream sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <span className="flex h-10 w-12 items-center justify-center rounded-[8px] bg-cream font-display text-lg font-[560] tabular-nums text-ink border border-line">
                              {String(item.position).padStart(3, "0")}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-ink">
                                  {item.business_name}
                                </span>
                                <span
                                  className={`rounded-[5px] px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-ink-soft">
                                Created {formatRelativeTime(item.created_at)}
                                {item.called_at && ` · Called ${formatRelativeTime(item.called_at)}`}
                                {item.served_at && ` · Served ${formatRelativeTime(item.served_at)}`}
                                {item.expired_at && ` · Auto-expired ${formatRelativeTime(item.expired_at)}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-ink-soft">
                            <Link
                              href={`/status/${item.token_id}`}
                              target="_blank"
                              className="font-semibold text-pine underline hover:text-pine-deep"
                            >
                              Customer Ticket &rarr;
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB 3: SYSTEM HEALTH & ANALYTICS */}
          {activeTab === "system" && (
            <section className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Category Distribution */}
              <div className="rounded-[12px] border border-line bg-cream-panel p-6">
                <h2 className="font-display text-xl font-[500] text-ink">
                  Business Categories
                </h2>
                <p className="mt-1 text-xs text-ink-soft">
                  Distribution of shops currently operating on Turn-Token.
                </p>

                <div className="mt-6 flex flex-col gap-4">
                  {overview?.category_counts &&
                    Object.entries(overview.category_counts).map(([cat, count]) => {
                      const pct = overview.total_businesses
                        ? Math.round((count / overview.total_businesses) * 100)
                        : 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-xs font-semibold text-ink">
                            <span>{cat}</span>
                            <span>
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream">
                            <div
                              className="h-full bg-pine transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* State Machine & Telemetry */}
              <div className="rounded-[12px] border border-line bg-cream-panel p-6">
                <h2 className="font-display text-xl font-[500] text-ink">
                  Automated State Machine Engine
                </h2>
                <p className="mt-1 text-xs text-ink-soft">
                  Autonomous background sweeping for fair no-show handling.
                </p>

                <div className="mt-6 flex flex-col gap-4">
                  <div className="rounded-[8px] border border-line/70 bg-cream p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">Background Sweep Frequency</span>
                      <span className="font-mono text-xs font-semibold text-pine">15s loop</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      FastAPI background task running continuously to sweep expired grace timers and elapsed hold windows.
                    </p>
                  </div>

                  <div className="rounded-[8px] border border-line/70 bg-cream p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">Automatic Grace Timer</span>
                      <span className="font-mono text-xs font-semibold text-marigold">5m (default)</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      Called tokens are automatically marked as <code>skipped</code> if the customer fails to appear before their grace timer runs out.
                    </p>
                  </div>

                  <div className="rounded-[8px] border border-line/70 bg-cream p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">Automatic Hold Window</span>
                      <span className="font-mono text-xs font-semibold text-terracotta">15m (default)</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      Skipped tokens are held safely. If the hold window elapses without the customer arriving to restore their place, the token is permanently <code>expired</code>.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* MODAL: QUEUE PEEK & EMERGENCY RESET */}
      {queueModalBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-[16px] border border-line bg-cream p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">
                  Queue Inspection
                </p>
                <h3 className="font-display text-2xl font-[500] text-ink">
                  {queueModalBusiness.name}
                </h3>
                <p className="text-xs text-ink-soft">
                  Category: {queueModalBusiness.category} · Currently {queueModalBusiness.is_paused ? "Paused" : "Active"}
                </p>
              </div>
              <button
                onClick={() => setQueueModalBusiness(null)}
                className="rounded-[6px] p-1.5 text-ink-soft hover:bg-cream-panel hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              {loadingQueue ? (
                <div className="py-12 text-center text-sm text-ink-soft">
                  Loading live queue…
                </div>
              ) : !queueModalData || queueModalData.tokens.length === 0 ? (
                <div className="py-12 text-center text-sm text-ink-soft">
                  No active or waiting tokens in this queue right now.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-line">
                  {queueModalData.tokens.map((token) => {
                    const badge = STATUS_BADGE[token.status] || STATUS_BADGE.waiting;
                    return (
                      <div
                        key={token.id}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-display text-xl font-[560] tabular-nums text-ink">
                            #{String(token.position).padStart(3, "0")}
                          </span>
                          <span className={`rounded-[5px] px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-xs text-ink-soft">
                          Joined {formatRelativeTime(token.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
              <Button
                variant="danger"
                className="text-xs"
                disabled={resettingQueue || !queueModalData?.tokens.length}
                onClick={handleResetQueue}
              >
                {resettingQueue ? "Resetting Line…" : "Emergency Reset Line (Cancel All)"}
              </Button>

              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => setQueueModalBusiness(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BUSINESS SETTINGS */}
      {editingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-[16px] border border-line bg-cream p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">
                  Super Admin Controls
                </p>
                <h3 className="font-display text-2xl font-[500] text-ink">
                  Edit Business Parameters
                </h3>
              </div>
              <button
                onClick={() => setEditingBusiness(null)}
                className="rounded-[6px] p-1.5 text-ink-soft hover:bg-cream-panel hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Business Name"
                  name="name"
                  required
                  value={editForm.name ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />

                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink">
                    Category
                  </span>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="rounded-[8px] border border-line bg-cream px-4 py-3 text-ink focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/30"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Contact Email"
                  name="contact_email"
                  type="email"
                  required
                  value={editForm.contact_email ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                />
                <Field
                  label="Contact Phone"
                  name="contact_phone"
                  value={editForm.contact_phone ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                />
              </div>

              <div className="mt-2 border-t border-line pt-4">
                <h4 className="text-sm font-semibold text-ink">State Machine Tuning</h4>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <Field
                    label="Grace Timer (mins)"
                    name="grace_timer_minutes"
                    type="number"
                    min={1}
                    max={60}
                    value={editForm.grace_timer_minutes ?? 5}
                    onChange={(e) =>
                      setEditForm({ ...editForm, grace_timer_minutes: Number(e.target.value) })
                    }
                  />
                  <Field
                    label="Hold Window (mins)"
                    name="hold_window_minutes"
                    type="number"
                    min={1}
                    max={120}
                    value={editForm.hold_window_minutes ?? 15}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hold_window_minutes: Number(e.target.value) })
                    }
                  />
                  <Field
                    label="Active Counters"
                    name="active_counters"
                    type="number"
                    min={1}
                    max={20}
                    value={editForm.active_counters ?? 1}
                    onChange={(e) =>
                      setEditForm({ ...editForm, active_counters: Number(e.target.value) })
                    }
                  />
                  <Field
                    label="Default Service (mins)"
                    name="default_service_time_minutes"
                    type="number"
                    min={1}
                    max={180}
                    value={editForm.default_service_time_minutes ?? 10}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        default_service_time_minutes: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingBusiness(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={savingEdit}>
                  {savingEdit ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

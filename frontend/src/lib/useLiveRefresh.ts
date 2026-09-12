"use client";

import { useEffect, useRef, useState } from "react";
import { WS_URL } from "./api";

const FALLBACK_POLL_MS = 20000;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 15000;

interface UseLiveRefreshOptions {
  /** Re-fetch-and-update callback for whatever state this view owns. Runs
   * on connect, on every server event, and on the slow fallback poll — the
   * socket only ever says "something changed," never carries state itself. */
  onEvent: () => void;
  /** The `/ws/...` path to connect to. Pass null to stay disconnected
   * (e.g. the session or business id isn't ready yet). */
  path: string | null;
  /** Sent as the first message once connected, e.g. the business socket's
   * `{type: "auth", access_token}` handshake. */
  authMessage?: Record<string, unknown>;
}

/** WebSocket connection with auto-reconnect (capped exponential backoff)
 * plus a slow interval poll that runs regardless of socket health — a
 * permanent safety net against a silently-stuck connection or a missed
 * event, not just a fallback for while the socket is down. */
export function useLiveRefresh({ onEvent, path, authMessage }: UseLiveRefreshOptions) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  const authMessageRef = useRef(authMessage);

  // Keep both refs pointing at the latest values without writing to them
  // during render — the socket callbacks below read these refs, not the
  // hook's closure, so a reconnect always uses the current callback/token.
  useEffect(() => {
    onEventRef.current = onEvent;
    authMessageRef.current = authMessage;
  });

  useEffect(() => {
    if (!path) return;

    let socket: WebSocket | null = null;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = RECONNECT_BASE_MS;

    function connect() {
      socket = new WebSocket(`${WS_URL}${path}`);

      socket.onopen = () => {
        reconnectDelay = RECONNECT_BASE_MS;
        setConnected(true);
        if (authMessageRef.current) {
          socket?.send(JSON.stringify(authMessageRef.current));
        }
        onEventRef.current();
      };

      socket.onmessage = () => {
        onEventRef.current();
      };

      socket.onclose = () => {
        setConnected(false);
        if (stopped) return;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();
    const fallback = setInterval(() => onEventRef.current(), FALLBACK_POLL_MS);

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(fallback);
      socket?.close();
    };
  }, [path]);

  return { connected };
}

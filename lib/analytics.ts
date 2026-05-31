/**
 * Analytics — PostHog REST API wrapper (no native SDK, works everywhere)
 *
 * Env (.env dosyasına):
 *   EXPO_PUBLIC_POSTHOG_KEY=phc_...
 *   EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY  = process.env.EXPO_PUBLIC_POSTHOG_KEY  ?? '';
const HOST     = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
const ENDPOINT = `${HOST}/capture/`;
const DECIDE   = `${HOST}/decide/?v=3`;
const ID_KEY   = 'noor_ph_distinct_id';

// ─── Distinct ID (anonymous, persisted) ──────────────────────────────────────

let _distinctId: string | null = null;

async function getDistinctId(): Promise<string> {
  if (_distinctId) return _distinctId;
  try {
    const stored = await AsyncStorage.getItem(ID_KEY);
    if (stored) { _distinctId = stored; return stored; }
    const id = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem(ID_KEY, id);
    _distinctId = id;
    return id;
  } catch {
    return 'anon_unknown';
  }
}

// ─── Queue (fire-and-forget, no blocking) ────────────────────────────────────

type QueuedEvent = { event: string; properties: Record<string, unknown>; timestamp: string };
const _queue: QueuedEvent[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (_flushTimer) return;
  _flushTimer = setTimeout(() => { _flushTimer = null; _flush(); }, 2000);
}

async function _flush() {
  if (!API_KEY || _queue.length === 0) return;
  const batch = _queue.splice(0, _queue.length);
  const distinctId = await getDistinctId();
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: API_KEY,
        batch: batch.map((e) => ({
          event: e.event,
          distinct_id: distinctId,
          timestamp: e.timestamp,
          properties: { ...e.properties, $lib: 'posthog-react-native', platform: Platform.OS },
        })),
      }),
    });
  } catch { /* offline — events dropped */ }
}

// ─── Feature flags cache ──────────────────────────────────────────────────────

let _flagsCache: Record<string, string | boolean> | null = null;
let _flagsFetchedAt = 0;
const FLAGS_TTL = 5 * 60 * 1000; // 5 min

async function fetchFlags(): Promise<Record<string, string | boolean>> {
  const now = Date.now();
  if (_flagsCache && now - _flagsFetchedAt < FLAGS_TTL) return _flagsCache;
  if (!API_KEY) return {};
  try {
    const distinctId = await getDistinctId();
    const res = await fetch(DECIDE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: API_KEY, distinct_id: distinctId }),
    });
    const json = await res.json() as { featureFlags?: Record<string, string | boolean> };
    _flagsCache = json.featureFlags ?? {};
    _flagsFetchedAt = now;
    return _flagsCache;
  } catch {
    return _flagsCache ?? {};
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const analytics = {
  identify(distinctId: string, properties?: Record<string, string | number | boolean | null>) {
    _distinctId = distinctId;
    AsyncStorage.setItem(ID_KEY, distinctId).catch(() => {});
    _queue.push({
      event: '$identify',
      properties: { $set: properties ?? {} },
      timestamp: new Date().toISOString(),
    });
    scheduleFlush();
  },

  track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean | null>) {
    _queue.push({ event, properties: properties ?? {}, timestamp: new Date().toISOString() });
    scheduleFlush();
  },

  async getFeatureFlag(flag: FeatureFlag): Promise<string | boolean | undefined> {
    const flags = await fetchFlags();
    return flags[flag];
  },

  flush() {
    if (_flushTimer) { clearTimeout(_flushTimer); _flushTimer = null; }
    _flush();
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | 'onboarding_started' | 'onboarding_step_completed' | 'onboarding_completed'
  | 'paywall_viewed' | 'paywall_plan_selected' | 'paywall_cta_tapped' | 'paywall_closed'
  | 'purchase_started' | 'purchase_completed' | 'purchase_failed'
  | 'purchase_cancelled' | 'purchase_restored'
  | 'content_viewed' | 'content_saved' | 'content_unsaved' | 'content_shared'
  | 'prayer_times_viewed' | 'qibla_opened' | 'dhikr_opened' | 'dhikr_completed'
  | 'topic_followed' | 'topic_unfollowed'
  | 'notifications_enabled' | 'notifications_disabled'
  | 'language_changed' | 'theme_changed' | 'dark_mode_toggled';

export type FeatureFlag = 'paywall_variant';

export type PaywallVariant = 'control' | 'simple' | 'annual_first';

export async function getPaywallVariant(): Promise<PaywallVariant> {
  const flag = await analytics.getFeatureFlag('paywall_variant');
  if (flag === 'simple' || flag === 'annual_first') return flag;
  return 'control';
}

// Legacy export — _layout.tsx'te PostHogProvider için kullanılıyordu, artık gerek yok
export const posthogClient = null;

type RateLimitRecord = {
  tokens: number;
  lastRefill: number;
};

const store = new Map<string, RateLimitRecord>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now - record.lastRefill > 600000) {
      store.delete(key);
    }
  }
}, 300000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(config: RateLimitConfig) {
  return (identifier: string): { success: boolean; remaining: number } => {
    const now = Date.now();
    const record = store.get(identifier);

    if (!record) {
      store.set(identifier, { tokens: config.maxRequests - 1, lastRefill: now });
      return { success: true, remaining: config.maxRequests - 1 };
    }

    const elapsed = now - record.lastRefill;
    if (elapsed >= config.windowMs) {
      record.tokens = config.maxRequests - 1;
      record.lastRefill = now;
      return { success: true, remaining: record.tokens };
    }

    if (record.tokens <= 0) {
      return { success: false, remaining: 0 };
    }

    record.tokens -= 1;
    return { success: true, remaining: record.tokens };
  };
}

export const publicBookingLimit = rateLimit({ maxRequests: 3, windowMs: 60000 });
export const publicTrackingLimit = rateLimit({ maxRequests: 5, windowMs: 60000 });
export const publicContactLimit = rateLimit({ maxRequests: 2, windowMs: 60000 });

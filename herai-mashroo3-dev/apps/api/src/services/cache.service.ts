/**
 * In-memory AI Response Cache for HerAI Mashroo3
 *
 * Caches generated and safety-evaluated AI answers so repeated or
 * identical questions return immediate answers without querying
 * the database for rules or executing external AI LLM calls repeatedly.
 */

export type CachedChatData = {
  finalResponse: string
  verdict: {
    action: 'safe' | 'adjust' | 'block'
    bias_score: number
    risk_score: number
    matched_rule_ids: string[]
  }
  draft_response: string
  escalationData?: any
  cachedAt: number
  hits: number
}

// In-memory cache map
const responseCache = new Map<string, CachedChatData>()

// Configuration
const MAX_CACHE_SIZE = 2000
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Normalizes input text across Arabic & English for consistent cache key generation:
 * - Trims and lowercases
 * - Strips Arabic diacritics / tashkeel
 * - Normalizes Arabic letters (أ/إ/آ -> ا, ة -> ه, ى -> ي)
 * - Removes punctuation and collapses whitespace
 */
export function normalizeQuery(text: string): string {
  if (!text) return ''

  let normalized = text
    .trim()
    .toLowerCase()
    // Strip Arabic tashkeel (diacritics)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Arabic alif variants
    .replace(/[أإآ]/g, 'ا')
    // Normalize Arabic taa marbouta
    .replace(/ة/g, 'ه')
    // Normalize Arabic alif maqsura
    .replace(/ى/g, 'ي')
    // Strip common punctuation at start/end
    .replace(/^[؟?!.,:;\-_"'\s]+|[؟?!.,:;\-_"'\s]+$/g, '')
    // Collapse internal whitespace
    .replace(/\s+/g, ' ')

  return normalized
}

/**
 * Constructs a unique, deterministic cache key.
 */
export function buildCacheKey(params: {
  message: string
  regionCode?: string
  domainScope?: string
  language?: string
  persona?: string
}): string {
  const normalizedMsg = normalizeQuery(params.message)
  const region = (params.regionCode || 'EG').toUpperCase()
  const domain = (params.domainScope || 'default').toLowerCase()
  const lang = (params.language || 'auto').toLowerCase()
  const persona = (params.persona || 'default').toLowerCase()

  return `chat:${region}:${domain}:${lang}:${persona}:${normalizedMsg}`
}

/**
 * Retrieves a cached AI response if available and not expired.
 */
export function getCachedResponse(cacheKey: string): CachedChatData | null {
  const entry = responseCache.get(cacheKey)
  if (!entry) {
    return null
  }

  const isExpired = Date.now() - entry.cachedAt > DEFAULT_TTL_MS
  if (isExpired) {
    responseCache.delete(cacheKey)
    return null
  }

  entry.hits += 1
  return entry
}

/**
 * Stores a generated AI response and verdict in the cache.
 */
export function setCachedResponse(
  cacheKey: string,
  data: {
    finalResponse: string
    verdict: {
      action: 'safe' | 'adjust' | 'block'
      bias_score: number
      risk_score: number
      matched_rule_ids: string[]
    }
    draft_response?: string
    escalationData?: any
  }
): void {
  // Evict oldest entries if cache limit is reached
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value
    if (oldestKey) {
      responseCache.delete(oldestKey)
    }
  }

  responseCache.set(cacheKey, {
    finalResponse: data.finalResponse,
    verdict: data.verdict,
    draft_response: data.draft_response || data.finalResponse,
    escalationData: data.escalationData,
    cachedAt: Date.now(),
    hits: 0,
  })
}

/**
 * Clear the entire response cache (e.g., when rules or safety policies are updated).
 */
export function clearResponseCache(): void {
  responseCache.clear()
}

export default {
  normalizeQuery,
  buildCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearResponseCache,
}

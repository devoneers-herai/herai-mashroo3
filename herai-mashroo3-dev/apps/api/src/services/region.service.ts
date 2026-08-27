export type RegionConfig = {
  region_code: string
  version: string
  active_safety_ruleset_id: string
  active_council_content_version: string
  channel_fallback_order: string[]
  domain_scope: string[]
}

/**
 * Static region configurations — embedded directly to avoid file-path
 * resolution issues across different deployment environments (Railway, Vercel, local).
 */
const REGION_CONFIGS: Record<string, RegionConfig> = {
  EG: {
    region_code: 'EG',
    version: 'v1',
    active_safety_ruleset_id: 'ruleset-eg-v1',
    active_council_content_version: 'council-eg-v1',
    channel_fallback_order: ['whatsapp', 'sms', 'voice'],
    domain_scope: ['agri'],
  },
  LB: {
    region_code: 'LB',
    version: 'v1',
    active_safety_ruleset_id: 'ruleset-lb-v1',
    active_council_content_version: 'council-lb-v1',
    channel_fallback_order: ['whatsapp', 'sms', 'voice'],
    domain_scope: ['agri'],
  },
}

/**
 * Runtime Region Resolution Service
 *
 * Resolves region configuration from the static REGION_CONFIGS map.
 * Flow: region_code → lookup config → use configuration
 */
class RegionResolver {
  private configCache: Map<string, RegionConfig> = new Map()

  async resolveRegionConfig(regionCode: string): Promise<RegionConfig | null> {
    if (this.configCache.has(regionCode)) {
      return this.configCache.get(regionCode) || null
    }
    const config = REGION_CONFIGS[regionCode] || null
    if (config) this.configCache.set(regionCode, config)
    return config
  }

  /**
   * Synchronous region config lookup.
   * Throws if the config is not found — used by chat.service to fail fast.
   */
  getRegionConfigSync(regionCode: string): RegionConfig {
    const cached = this.configCache.get(regionCode)
    if (cached) return cached

    const config = REGION_CONFIGS[regionCode]
    if (!config) {
      throw new Error(`Region config not found for region: ${regionCode}`)
    }
    this.configCache.set(regionCode, config)
    return config
  }

  async getRegionConfigVersion(regionCode: string): Promise<string | null> {
    const config = await this.resolveRegionConfig(regionCode)
    return config ? config.version : null
  }

  async getActiveSafetyRulesetId(regionCode: string): Promise<string | null> {
    const config = await this.resolveRegionConfig(regionCode)
    return config ? config.active_safety_ruleset_id : null
  }

  async getDomainScopes(regionCode: string): Promise<string[] | null> {
    const config = await this.resolveRegionConfig(regionCode)
    return config ? config.domain_scope : null
  }

  clearCache() {
    this.configCache.clear()
  }
}

// Export singleton instance
export const regionResolver = new RegionResolver()

/**
 * Named export used by chat.service.ts.
 * Synchronous — looks up from static config map, then caches.
 * Throws if region code is unknown.
 */
export function getRegionConfig(regionCode: string): RegionConfig {
  return regionResolver.getRegionConfigSync(regionCode)
}

export default regionResolver


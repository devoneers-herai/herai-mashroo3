import fs from 'fs'
import path from 'path'

export type RegionConfig = {
  region_code: string
  version: string
  active_safety_ruleset_id: string
  active_council_content_version: string
  channel_fallback_order: string[]
  domain_scope: string[]
}

/**
 * Runtime Region Resolution Service
 *
 * Loads region configuration from static JSON files.
 * At runtime, the system determines the Region, then resolves its configuration.
 *
 * Flow: region_code → load region_config → get active configuration/version → use configuration
 */
class RegionResolver {
  private configCache: Map<string, RegionConfig> = new Map()
  private configDir: string

  constructor() {
    // Config directory path — relative to compiled output location
    this.configDir = path.join(__dirname, '../../../..', 'herai_backend_contracts/config')
  }

  /**
   * Resolve region configuration by region code.
   * Loads from region_config.{REGION}.json, caches result.
   */
  async resolveRegionConfig(regionCode: string): Promise<RegionConfig | null> {
    try {
      if (this.configCache.has(regionCode)) {
        return this.configCache.get(regionCode) || null
      }

      const configPath = path.join(this.configDir, `region_config.${regionCode}.json`)

      if (!fs.existsSync(configPath)) {
        console.warn(`Region config not found for ${regionCode} at ${configPath}`)
        return null
      }

      const configContent = fs.readFileSync(configPath, 'utf-8')
      const config: RegionConfig = JSON.parse(configContent)

      this.configCache.set(regionCode, config)
      return config
    } catch (error) {
      console.error(`Error resolving region config for ${regionCode}:`, error)
      return null
    }
  }

  /**
   * Synchronous region config lookup (from cache or disk).
   * Throws if the config is not found — used by chat.service to fail fast.
   */
  getRegionConfigSync(regionCode: string): RegionConfig {
    // Check cache first
    const cached = this.configCache.get(regionCode)
    if (cached) return cached

    const configPath = path.join(this.configDir, `region_config.${regionCode}.json`)

    if (!fs.existsSync(configPath)) {
      throw new Error(`Region config not found for region: ${regionCode}`)
    }

    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config: RegionConfig = JSON.parse(configContent)
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
 * Synchronous — loads from disk on first call, then serves from cache.
 * Throws if region code is unknown.
 */
export function getRegionConfig(regionCode: string): RegionConfig {
  return regionResolver.getRegionConfigSync(regionCode)
}

export default regionResolver

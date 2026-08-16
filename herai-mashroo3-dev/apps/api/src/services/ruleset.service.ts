import { SupabaseClient } from '@supabase/supabase-js'

export type RuleDecisionAction = 'safe' | 'adjust' | 'block'

export type SafetyRule = {
  rule_id: string
  ruleset_id: string
  version: number
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'active' | 'retired'
  region_code: string
  domain_scope: string[]
  rule_type: string
  title: string
  rule_text: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  decision_policy: {
    default_action: RuleDecisionAction
    block_conditions?: string[]
  }
  applies_to: {
    input?: boolean
    draft?: boolean
  }
  examples?: {
    violating?: string[]
    compliant?: string[]
  }
  test_case_ids?: string[]
  created_by: string
  approved_at?: string | null
}

export type RuleSet = {
  id: string
  region_code: string
  version: number
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'active' | 'retired'
  rules: SafetyRule[]
  created_by: string
  approved_at?: string | null
  published_at?: string | null
  activated_at?: string | null
  created_at: string
}

/**
 * Get a RuleSet by its exact ID.
 *
 * This is important because the region configuration points to an
 * exact active_safety_ruleset_id.
 */
export async function getRuleSetById(
  rulesetId: string,
  supabase: SupabaseClient
): Promise<RuleSet | null> {
  const { data, error } = await supabase
    .from('rulesets')
    .select(`
      *,
      rules (*)
    `)
    .eq('id', rulesetId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }

    throw new Error(`Failed to load RuleSet: ${error.message}`)
  }

  return {
    id: data.id,
    region_code: data.region_code,
    version: data.version,
    status: data.status,
    rules: data.rules || [],
    created_by: data.created_by,
    approved_at: data.approved_at,
    published_at: data.published_at,
    activated_at: data.activated_at,
    created_at: data.created_at,
  }
}

/**
 * Resolve the exact active RuleSet for a region.
 *
 * The region config contains active_safety_ruleset_id.
 * That ID is treated as the authoritative pointer.
 */
export async function getActiveRuleSetForRegion(
  regionCode: string,
  activeRuleSetId: string,
  supabase: SupabaseClient
): Promise<RuleSet> {
  const ruleset = await getRuleSetById(activeRuleSetId, supabase)

  if (!ruleset) {
    throw new Error(
      `Active RuleSet ${activeRuleSetId} was not found for region ${regionCode}`
    )
  }

  if (ruleset.region_code !== regionCode) {
    throw new Error(
      `RuleSet ${activeRuleSetId} belongs to ${ruleset.region_code}, not ${regionCode}`
    )
  }

  if (ruleset.status !== 'active') {
    throw new Error(
      `RuleSet ${activeRuleSetId} is not active. Current status: ${ruleset.status}`
    )
  }

  return ruleset
}

/**
 * Create a new RuleSet version.
 *
 * Published/active RuleSets should never be edited.
 * A new version must be created instead.
 */
export async function createRuleSet(
  input: {
    id: string
    region_code: string
    version: number
    created_by: string
  },
  supabase: SupabaseClient
): Promise<RuleSet> {
  const { data, error } = await supabase
    .from('rulesets')
    .insert([
      {
        id: input.id,
        region_code: input.region_code,
        version: input.version,
        status: 'draft',
        created_by: input.created_by,
      },
    ])
    .select(`
      *,
      rules (*)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create RuleSet: ${error.message}`)
  }

  return {
    id: data.id,
    region_code: data.region_code,
    version: data.version,
    status: data.status,
    rules: data.rules || [],
    created_by: data.created_by,
    approved_at: data.approved_at,
    published_at: data.published_at,
    activated_at: data.activated_at,
    created_at: data.created_at,
  }
}

/**
 * Add a rule to a RuleSet.
 *
 * Only draft RuleSets should be editable.
 */
export async function addRuleToRuleSet(
  rule: SafetyRule,
  supabase: SupabaseClient
): Promise<SafetyRule> {
  const { data: ruleset, error: rulesetError } = await supabase
    .from('rulesets')
    .select('status')
    .eq('id', rule.ruleset_id)
    .single()

  if (rulesetError) {
    throw new Error(`Failed to load RuleSet: ${rulesetError.message}`)
  }

  if (ruleset.status !== 'draft') {
    throw new Error(
      `RuleSet ${rule.ruleset_id} cannot be edited because it is ${ruleset.status}`
    )
  }

  const { data, error } = await supabase
    .from('rules')
    .insert([rule])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create rule: ${error.message}`)
  }

  return data
}

/**
 * Validate a RuleSet before it can move forward.
 */
export function validateRuleSet(rules: SafetyRule[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (rules.length === 0) {
    errors.push('RuleSet must contain at least one rule')
  }

  const ruleIds = new Set<string>()

  for (const rule of rules) {
    if (!rule.rule_id) {
      errors.push('Every rule must have a rule_id')
    }

    if (ruleIds.has(rule.rule_id)) {
      errors.push(`Duplicate rule_id: ${rule.rule_id}`)
    }

    ruleIds.add(rule.rule_id)

    if (!rule.ruleset_id) {
      errors.push(`Rule ${rule.rule_id} is missing ruleset_id`)
    }

    if (!rule.region_code) {
      errors.push(`Rule ${rule.rule_id} is missing region_code`)
    }

    if (!rule.title) {
      errors.push(`Rule ${rule.rule_id} is missing title`)
    }

    if (!rule.rule_text) {
      errors.push(`Rule ${rule.rule_id} is missing rule_text`)
    }

    if (!rule.decision_policy?.default_action) {
      errors.push(
        `Rule ${rule.rule_id} is missing decision_policy.default_action`
      )
    }

    if (
      !['safe', 'adjust', 'block'].includes(
        rule.decision_policy?.default_action
      )
    ) {
      errors.push(
        `Rule ${rule.rule_id} has an invalid default_action`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export default {
  getRuleSetById,
  getActiveRuleSetForRegion,
  createRuleSet,
  addRuleToRuleSet,
  validateRuleSet,
}
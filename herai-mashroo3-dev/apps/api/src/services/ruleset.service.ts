import { SupabaseClient } from '@supabase/supabase-js'

export type RuleDecisionAction =
  | 'safe'
  | 'adjust'
  | 'block'

export type RuleStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'active'
  | 'retired'

export type RuleSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type SafetyRule = {
  rule_id: string
  ruleset_id: string | null
  version: number
  status: RuleStatus
  region_code: string
  domain_scope: string
  category: string
  severity: RuleSeverity
  decision_type: RuleDecisionAction
  trigger_description: string
  adjustment_instruction: string
  fallback_message: string
  created_by: string
  created_at?: string
  approved_at?: string | null
}

export type RuleSet = {
  id: string
  region_code: string
  version: number
  status: RuleStatus
  rules: SafetyRule[]
  created_by: string
  approved_at?: string | null
  published_at?: string | null
  activated_at?: string | null
  created_at: string
}

const RULE_STATUSES: readonly RuleStatus[] = [
  'draft',
  'in_review',
  'approved',
  'published',
  'active',
  'retired',
]

const RULE_SEVERITIES: readonly RuleSeverity[] = [
  'low',
  'medium',
  'high',
  'critical',
]

const RULE_ACTIONS: readonly RuleDecisionAction[] = [
  'safe',
  'adjust',
  'block',
]

const RULE_SELECT = `
  rule_id,
  ruleset_id,
  version,
  status,
  region_code,
  domain_scope,
  category,
  severity,
  decision_type,
  trigger_description,
  adjustment_instruction,
  fallback_message,
  created_by,
  created_at,
  approved_at
`

const RULESET_SELECT = `
  id,
  region_code,
  version,
  status,
  created_by,
  approved_at,
  published_at,
  activated_at,
  created_at,
  rules (${RULE_SELECT})
`

function mapRule(data: any): SafetyRule {
  return {
    rule_id: data.rule_id,
    ruleset_id: data.ruleset_id ?? null,
    version: data.version,
    status: data.status,
    region_code: data.region_code,
    domain_scope: data.domain_scope,
    category: data.category,
    severity: data.severity,
    decision_type: data.decision_type,
    trigger_description:
      data.trigger_description,
    adjustment_instruction:
      data.adjustment_instruction,
    fallback_message:
      data.fallback_message,
    created_by: data.created_by,
    created_at: data.created_at,
    approved_at: data.approved_at ?? null,
  }
}

function mapRuleSet(data: any): RuleSet {
  const rules = Array.isArray(data.rules)
    ? data.rules
        .filter(
          (rule: any) =>
            rule.ruleset_id === data.id
        )
        .map(mapRule)
    : []

  return {
    id: data.id,
    region_code: data.region_code,
    version: data.version,
    status: data.status,
    rules,
    created_by: data.created_by,
    approved_at: data.approved_at ?? null,
    published_at: data.published_at ?? null,
    activated_at: data.activated_at ?? null,
    created_at: data.created_at,
  }
}

/**
 * Load a RuleSet by exact ID.
 */
export async function getRuleSetById(
  rulesetId: string,
  supabase: SupabaseClient
): Promise<RuleSet | null> {
  const normalizedId = rulesetId?.trim()

  if (!normalizedId) {
    throw new Error('rulesetId is required')
  }

  const { data, error } = await supabase
    .from('rulesets')
    .select(RULESET_SELECT)
    .eq('id', normalizedId)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Failed to load RuleSet: ${error.message}`
    )
  }

  if (!data) {
    return null
  }

  return mapRuleSet(data)
}

/**
 * Resolve the exact active RuleSet configured
 * for a region.
 */
export async function getActiveRuleSetForRegion(
  regionCode: string,
  activeRuleSetId: string,
  supabase: SupabaseClient
): Promise<RuleSet> {
  const normalizedRegionCode =
    regionCode?.trim()

  const normalizedRuleSetId =
    activeRuleSetId?.trim()

  if (!normalizedRegionCode) {
    throw new Error(
      'regionCode is required'
    )
  }

  if (!normalizedRuleSetId) {
    throw new Error(
      `No active RuleSet configured for region ${normalizedRegionCode}`
    )
  }

  const ruleset = await getRuleSetById(
    normalizedRuleSetId,
    supabase
  )

  if (!ruleset) {
    throw new Error(
      `Active RuleSet ${normalizedRuleSetId} was not found for region ${normalizedRegionCode}`
    )
  }

  if (
    ruleset.region_code !==
    normalizedRegionCode
  ) {
    throw new Error(
      `RuleSet ${normalizedRuleSetId} belongs to ${ruleset.region_code}, not ${normalizedRegionCode}`
    )
  }

  if (ruleset.status !== 'active') {
    throw new Error(
      `RuleSet ${normalizedRuleSetId} is not active. Current status: ${ruleset.status}`
    )
  }

  const validation = validateRuleSet(
    ruleset.rules,
    {
      expectedRuleSetId: ruleset.id,
      expectedRegionCode:
        ruleset.region_code,
      expectedVersion: ruleset.version,
      requireActiveRules: true,
    }
  )

  if (!validation.valid) {
    throw new Error(
      `Active RuleSet ${normalizedRuleSetId} is invalid: ${validation.errors.join('; ')}`
    )
  }

  return ruleset
}

/**
 * Create a new draft RuleSet.
 *
 * Existing versions are immutable.
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
  if (!input) {
    throw new Error(
      'RuleSet input is required'
    )
  }

  const id = input.id?.trim()
  const regionCode =
    input.region_code?.trim()
  const createdBy =
    input.created_by?.trim()

  if (!id) {
    throw new Error(
      'RuleSet id is required'
    )
  }

  if (!regionCode) {
    throw new Error(
      'RuleSet region_code is required'
    )
  }

  if (!createdBy) {
    throw new Error(
      'RuleSet created_by is required'
    )
  }

  if (
    !Number.isInteger(input.version) ||
    input.version < 1
  ) {
    throw new Error(
      'RuleSet version must be a positive integer'
    )
  }

  const {
    data: existingVersion,
    error: versionError,
  } = await supabase
    .from('rulesets')
    .select('id')
    .eq('region_code', regionCode)
    .eq('version', input.version)
    .maybeSingle()

  if (versionError) {
    throw new Error(
      `Failed to check RuleSet version: ${versionError.message}`
    )
  }

  if (existingVersion) {
    throw new Error(
      `RuleSet version ${input.version} already exists for region ${regionCode}`
    )
  }

  const {
    data: existingId,
    error: idError,
  } = await supabase
    .from('rulesets')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (idError) {
    throw new Error(
      `Failed to check RuleSet ID: ${idError.message}`
    )
  }

  if (existingId) {
    throw new Error(
      `RuleSet ${id} already exists`
    )
  }

  const {
    data,
    error: insertError,
  } = await supabase
    .from('rulesets')
    .insert({
      id,
      region_code: regionCode,
      version: input.version,
      status: 'draft',
      created_by: createdBy,
    })
    .select(RULESET_SELECT)
    .single()

  if (insertError) {
    throw new Error(
      `Failed to create RuleSet: ${insertError.message}`
    )
  }

  if (!data) {
    throw new Error(
      'Failed to create RuleSet: no data returned'
    )
  }

  return mapRuleSet(data)
}

/**
 * Add a rule to a draft RuleSet.
 */
export async function addRuleToRuleSet(
  rule: SafetyRule,
  supabase: SupabaseClient
): Promise<SafetyRule> {
  if (!rule) {
    throw new Error('Rule is required')
  }

  if (!rule.ruleset_id) {
    throw new Error(
      'Rule must belong to a RuleSet'
    )
  }

  const validation = validateRuleSet(
    [rule],
    {
      expectedRuleSetId:
        rule.ruleset_id,
      expectedRegionCode:
        rule.region_code,
      expectedVersion:
        rule.version,
      requireDraftRules: true,
    }
  )

  if (!validation.valid) {
    throw new Error(
      `Invalid rule: ${validation.errors.join('; ')}`
    )
  }

  const {
    data: ruleset,
    error: rulesetError,
  } = await supabase
    .from('rulesets')
    .select(
      'id, region_code, version, status'
    )
    .eq('id', rule.ruleset_id)
    .maybeSingle()

  if (rulesetError) {
    throw new Error(
      `Failed to load RuleSet: ${rulesetError.message}`
    )
  }

  if (!ruleset) {
    throw new Error(
      `RuleSet ${rule.ruleset_id} was not found`
    )
  }

  if (ruleset.status !== 'draft') {
    throw new Error(
      `RuleSet ${rule.ruleset_id} cannot be edited because it is ${ruleset.status}`
    )
  }

  if (
    rule.region_code !==
    ruleset.region_code
  ) {
    throw new Error(
      `Rule region ${rule.region_code} does not match RuleSet region ${ruleset.region_code}`
    )
  }

  if (
    rule.version !==
    ruleset.version
  ) {
    throw new Error(
      `Rule version ${rule.version} does not match RuleSet version ${ruleset.version}`
    )
  }

  const {
    data: existingRule,
    error: existingError,
  } = await supabase
    .from('rules')
    .select('rule_id')
    .eq('rule_id', rule.rule_id)
    .maybeSingle()

  if (existingError) {
    throw new Error(
      `Failed to check existing rule: ${existingError.message}`
    )
  }

  if (existingRule) {
    throw new Error(
      `Rule ${rule.rule_id} already exists`
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from('rules')
    .insert({
      rule_id: rule.rule_id.trim(),
      ruleset_id: rule.ruleset_id,
      version: rule.version,
      status: 'draft',
      region_code: rule.region_code.trim(),
      domain_scope:
        rule.domain_scope.trim(),
      category:
        rule.category.trim(),
      severity: rule.severity,
      decision_type:
        rule.decision_type,
      trigger_description:
        rule.trigger_description.trim(),
      adjustment_instruction:
        rule.adjustment_instruction.trim(),
      fallback_message:
        rule.fallback_message.trim(),
      created_by:
        rule.created_by.trim(),
    })
    .select(RULE_SELECT)
    .single()

  if (error) {
    throw new Error(
      `Failed to create rule: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      'Failed to create rule: no data returned'
    )
  }

  return mapRule(data)
}

export type ValidateRuleSetOptions = {
  expectedRuleSetId?: string
  expectedRegionCode?: string
  expectedVersion?: number
  requireDraftRules?: boolean
  requireActiveRules?: boolean
}

/**
 * Validate rules belonging to a RuleSet.
 */
export function validateRuleSet(
  rules: SafetyRule[],
  options: ValidateRuleSetOptions = {}
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!Array.isArray(rules)) {
    return {
      valid: false,
      errors: [
        'RuleSet rules must be an array',
      ],
    }
  }

  if (rules.length === 0) {
    errors.push(
      'RuleSet must contain at least one rule'
    )
  }

  const expectedRuleSetId =
    options.expectedRuleSetId?.trim()

  const expectedRegionCode =
    options.expectedRegionCode?.trim()

  const ruleIds = new Set<string>()

  for (const rule of rules) {
    if (!rule || typeof rule !== 'object') {
      errors.push(
        'Every RuleSet entry must be a rule object'
      )
      continue
    }

    const id =
      typeof rule.rule_id === 'string' &&
      rule.rule_id.trim()
        ? rule.rule_id.trim()
        : '<unknown>'

    if (!rule.rule_id?.trim()) {
      errors.push(
        'Every rule must have a rule_id'
      )
    } else if (
      ruleIds.has(rule.rule_id.trim())
    ) {
      errors.push(
        `Duplicate rule_id: ${rule.rule_id}`
      )
    } else {
      ruleIds.add(rule.rule_id.trim())
    }

    const ruleSetId =
      rule.ruleset_id?.trim()

    if (!ruleSetId) {
      errors.push(
        `Rule ${id} is missing ruleset_id`
      )
    }

    if (
      expectedRuleSetId &&
      ruleSetId !== expectedRuleSetId
    ) {
      errors.push(
        `Rule ${id} belongs to RuleSet ${ruleSetId}, expected ${expectedRuleSetId}`
      )
    }

    const regionCode =
      rule.region_code?.trim()

    if (!regionCode) {
      errors.push(
        `Rule ${id} is missing region_code`
      )
    }

    if (
      expectedRegionCode &&
      regionCode !== expectedRegionCode
    ) {
      errors.push(
        `Rule ${id} belongs to region ${regionCode}, expected ${expectedRegionCode}`
      )
    }

    if (
      !Number.isInteger(rule.version) ||
      rule.version < 1
    ) {
      errors.push(
        `Rule ${id} has an invalid version`
      )
    }

    if (
      typeof options.expectedVersion ===
        'number' &&
      rule.version !==
        options.expectedVersion
    ) {
      errors.push(
        `Rule ${id} has version ${rule.version}, expected ${options.expectedVersion}`
      )
    }

    if (
      !RULE_STATUSES.includes(
        rule.status
      )
    ) {
      errors.push(
        `Rule ${id} has an invalid status`
      )
    }

    if (
      options.requireDraftRules &&
      rule.status !== 'draft'
    ) {
      errors.push(
        `Rule ${id} must be draft`
      )
    }

    if (
      options.requireActiveRules &&
      rule.status !== 'active'
    ) {
      errors.push(
        `Rule ${id} must be active when its RuleSet is active`
      )
    }

    if (!rule.domain_scope?.trim()) {
      errors.push(
        `Rule ${id} is missing domain_scope`
      )
    }

    if (!rule.category?.trim()) {
      errors.push(
        `Rule ${id} is missing category`
      )
    }

    if (
      !RULE_SEVERITIES.includes(
        rule.severity
      )
    ) {
      errors.push(
        `Rule ${id} has an invalid severity`
      )
    }

    if (
      !RULE_ACTIONS.includes(
        rule.decision_type
      )
    ) {
      errors.push(
        `Rule ${id} has an invalid decision_type`
      )
    }

    if (
      !rule.trigger_description?.trim()
    ) {
      errors.push(
        `Rule ${id} is missing trigger_description`
      )
    }

    if (
      !rule.adjustment_instruction?.trim()
    ) {
      errors.push(
        `Rule ${id} is missing adjustment_instruction`
      )
    }

    if (
      !rule.fallback_message?.trim()
    ) {
      errors.push(
        `Rule ${id} is missing fallback_message`
      )
    }

    if (!rule.created_by?.trim()) {
      errors.push(
        `Rule ${id} is missing created_by`
      )
    }

    if (
      rule.decision_type === 'block' &&
      rule.severity === 'low'
    ) {
      errors.push(
        `Rule ${id} cannot use BLOCK as its default action with low severity`
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
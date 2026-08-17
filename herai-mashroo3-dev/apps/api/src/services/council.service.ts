import { SupabaseClient } from '@supabase/supabase-js'

import {
  SafetyRule,
  RuleSet,
  RuleSeverity,
  RuleDecisionAction,
  createRuleSet,
  addRuleToRuleSet,
  getRuleSetById,
  validateRuleSet,
} from './ruleset.service'

export type CouncilStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

export type CouncilApplication = {
  id: string
  user_id: string
  status: CouncilStatus
  created_at: string
  approved_at: string | null
  motivation: string | null
  experience: string | null
  contribution: string | null
  availability: string | null
  agreement: boolean
}

export type CouncilMemberResponse = {
  id: string
  user_id: string
  status: CouncilStatus
  created_at: string
  approved_at: string | null
}

export type CouncilApplicationInput = {
  motivation: string
  experience: string
  contribution: string
  availability: string
  agreement: boolean
}

export type CouncilRuleInput = {
  rule_id: string
  ruleset_id: string
  version: number
  region_code: string
  domain_scope: string
  category: string
  severity: RuleSeverity
  decision_type: RuleDecisionAction
  trigger_description: string
  adjustment_instruction: string
  fallback_message: string
}

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

const COUNCIL_APPLICATION_SELECT = `
  id,
  user_id,
  status,
  created_at,
  approved_at,
  motivation,
  experience,
  contribution,
  availability,
  agreement
`

const COUNCIL_MEMBER_SELECT = `
  id,
  user_id,
  status,
  created_at,
  approved_at
`

function mapSafetyRule(data: any): SafetyRule {
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
    trigger_description: data.trigger_description,
    adjustment_instruction:
      data.adjustment_instruction,
    fallback_message: data.fallback_message,
    created_by: data.created_by,
    created_at: data.created_at,
    approved_at: data.approved_at ?? null,
  }
}

function mapCouncilApplication(
  data: any
): CouncilApplication {
  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    created_at: data.created_at,
    approved_at: data.approved_at ?? null,
    motivation: data.motivation ?? null,
    experience: data.experience ?? null,
    contribution: data.contribution ?? null,
    availability: data.availability ?? null,
    agreement: data.agreement === true,
  }
}

function mapCouncilMember(
  data: any
): CouncilMemberResponse {
  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    created_at: data.created_at,
    approved_at: data.approved_at ?? null,
  }
}

function isRuleSeverity(
  value: unknown
): value is RuleSeverity {
  return (
    typeof value === 'string' &&
    RULE_SEVERITIES.includes(
      value as RuleSeverity
    )
  )
}

function isRuleDecisionAction(
  value: unknown
): value is RuleDecisionAction {
  return (
    typeof value === 'string' &&
    RULE_ACTIONS.includes(
      value as RuleDecisionAction
    )
  )
}

/**
 * Register a Council application.
 */
export async function registerCouncilMember(
  userId: string,
  input: CouncilApplicationInput,
  supabase: SupabaseClient
): Promise<CouncilApplication> {
  const normalizedUserId = userId?.trim()

  if (!normalizedUserId) {
    throw new Error('User ID is required')
  }

  if (!input) {
    throw new Error(
      'Council application is required'
    )
  }

  if (!input.motivation?.trim()) {
    throw new Error('Motivation is required')
  }

  if (!input.experience?.trim()) {
    throw new Error('Experience is required')
  }

  if (!input.contribution?.trim()) {
    throw new Error('Contribution is required')
  }

  if (!input.availability?.trim()) {
    throw new Error('Availability is required')
  }

  if (input.agreement !== true) {
    throw new Error(
      'Council agreement must be accepted'
    )
  }

  const {
    data: existingMember,
    error: existingError,
  } = await supabase
    .from('council_members')
    .select('id, status')
    .eq('user_id', normalizedUserId)
    .maybeSingle()

  if (existingError) {
    throw new Error(
      `Failed to check Council registration: ${existingError.message}`
    )
  }

  if (existingMember) {
    throw new Error(
      `Council registration already exists with status: ${existingMember.status}`
    )
  }

  const { data, error } = await supabase
    .from('council_members')
    .insert({
      user_id: normalizedUserId,
      status: 'pending',
      motivation: input.motivation.trim(),
      experience: input.experience.trim(),
      contribution: input.contribution.trim(),
      availability: input.availability.trim(),
      agreement: true,
    })
    .select(COUNCIL_APPLICATION_SELECT)
    .single()

  if (error) {
    throw new Error(
      `Council registration failed: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      'Council registration failed: no data returned'
    )
  }

  return mapCouncilApplication(data)
}

/**
 * Get one user's Council application.
 */
export async function getCouncilMemberStatus(
  userId: string,
  supabase: SupabaseClient
): Promise<CouncilApplication | null> {
  const normalizedUserId = userId?.trim()

  if (!normalizedUserId) {
    throw new Error('User ID is required')
  }

  const { data, error } = await supabase
    .from('council_members')
    .select(COUNCIL_APPLICATION_SELECT)
    .eq('user_id', normalizedUserId)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Failed to get Council member status: ${error.message}`
    )
  }

  if (!data) {
    return null
  }

  return mapCouncilApplication(data)
}

/**
 * Get all pending Council applications.
 */
export async function getPendingCouncilApplications(
  supabase: SupabaseClient
): Promise<CouncilApplication[]> {
  const { data, error } = await supabase
    .from('council_members')
    .select(COUNCIL_APPLICATION_SELECT)
    .eq('status', 'pending')
    .order('created_at', {
      ascending: true,
    })

  if (error) {
    throw new Error(
      `Failed to load Council applications: ${error.message}`
    )
  }

  return (data ?? []).map(
    mapCouncilApplication
  )
}

/**
 * Get all Council membership records.
 */
export async function getCouncilMembers(
  supabase: SupabaseClient
): Promise<CouncilMemberResponse[]> {
  const { data, error } = await supabase
    .from('council_members')
    .select(COUNCIL_MEMBER_SELECT)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(
      `Failed to load Council members: ${error.message}`
    )
  }

  return (data ?? []).map(mapCouncilMember)
}

/**
 * Approve or reject a pending Council application.
 */
export async function updateCouncilMemberStatus(
  userId: string,
  status: 'approved' | 'rejected',
  supabase: SupabaseClient
): Promise<CouncilMemberResponse> {
  const normalizedUserId = userId?.trim()

  if (!normalizedUserId) {
    throw new Error('User ID is required')
  }

  if (
    status !== 'approved' &&
    status !== 'rejected'
  ) {
    throw new Error(
      'Invalid Council member status'
    )
  }

  const {
    data: existingMember,
    error: loadError,
  } = await supabase
    .from('council_members')
    .select(COUNCIL_MEMBER_SELECT)
    .eq('user_id', normalizedUserId)
    .maybeSingle()

  if (loadError) {
    throw new Error(
      `Failed to load Council application: ${loadError.message}`
    )
  }

  if (!existingMember) {
    throw new Error(
      'Council application not found'
    )
  }

  if (existingMember.status !== 'pending') {
    throw new Error(
      `Only pending applications can be updated. Current status: ${existingMember.status}`
    )
  }

  const approvedAt =
    status === 'approved'
      ? new Date().toISOString()
      : null

  const { data, error } = await supabase
    .from('council_members')
    .update({
      status,
      approved_at: approvedAt,
    })
    .eq('user_id', normalizedUserId)
    .eq('status', 'pending')
    .select(COUNCIL_MEMBER_SELECT)
    .single()

  if (error) {
    throw new Error(
      `Failed to update Council member status: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      'Failed to update Council member status: no data returned'
    )
  }

  return mapCouncilMember(data)
}

/**
 * Check whether a user is an approved Council member.
 */
export async function isApprovedCouncilMember(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const normalizedUserId = userId?.trim()

  if (!normalizedUserId) {
    return false
  }

  const { data, error } = await supabase
    .from('council_members')
    .select('status')
    .eq('user_id', normalizedUserId)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Failed to check Council membership: ${error.message}`
    )
  }

  return data?.status === 'approved'
}

/**
 * Get all canonical SafetyRules.
 */
export async function getCouncilRules(
  supabase: SupabaseClient
): Promise<SafetyRule[]> {
  const { data, error } = await supabase
    .from('rules')
    .select(RULE_SELECT)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(
      `Failed to load Council rules: ${error.message}`
    )
  }

  return (data ?? []).map(mapSafetyRule)
}

/**
 * Get all RuleSets with their associated rules.
 */
export async function getCouncilRuleSets(
  supabase: SupabaseClient
): Promise<RuleSet[]> {
  const { data, error } = await supabase
    .from('rulesets')
    .select(`
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
    `)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(
      `Failed to load Council RuleSets: ${error.message}`
    )
  }

  return (data ?? []).map(
    (ruleset: any): RuleSet => {
      const rules = Array.isArray(
        ruleset.rules
      )
        ? ruleset.rules
            .filter(
              (rule: any) =>
                rule.ruleset_id ===
                ruleset.id
            )
            .map(mapSafetyRule)
        : []

      return {
        id: ruleset.id,
        region_code: ruleset.region_code,
        version: ruleset.version,
        status: ruleset.status,
        rules,
        created_by: ruleset.created_by,
        approved_at:
          ruleset.approved_at ?? null,
        published_at:
          ruleset.published_at ?? null,
        activated_at:
          ruleset.activated_at ?? null,
        created_at: ruleset.created_at,
      }
    }
  )
}

/**
 * Get a single RuleSet.
 */
export async function getCouncilRuleSet(
  rulesetId: string,
  supabase: SupabaseClient
): Promise<RuleSet | null> {
  const normalizedRuleSetId =
    rulesetId?.trim()

  if (!normalizedRuleSetId) {
    throw new Error(
      'RuleSet ID is required'
    )
  }

  return getRuleSetById(
    normalizedRuleSetId,
    supabase
  )
}

/**
 * Create a new draft RuleSet.
 */
export async function createCouncilRuleSet(
  input: {
    id: string
    region_code: string
    version: number
  },
  createdBy: string,
  supabase: SupabaseClient
): Promise<RuleSet> {
  const normalizedCreatedBy =
    createdBy?.trim()

  if (!normalizedCreatedBy) {
    throw new Error(
      'Authenticated Council user is required'
    )
  }

  if (!input) {
    throw new Error(
      'RuleSet input is required'
    )
  }

  const normalizedId = input.id?.trim()
  const normalizedRegionCode =
    input.region_code?.trim()

  if (!normalizedId) {
    throw new Error(
      'RuleSet ID is required'
    )
  }

  if (!normalizedRegionCode) {
    throw new Error(
      'RuleSet region_code is required'
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

  const isApproved =
    await isApprovedCouncilMember(
      normalizedCreatedBy,
      supabase
    )

  if (!isApproved) {
    throw new Error(
      'Approved Council membership is required'
    )
  }

  return createRuleSet(
    {
      id: normalizedId,
      region_code: normalizedRegionCode,
      version: input.version,
      created_by: normalizedCreatedBy,
    },
    supabase
  )
}

/**
 * Create a canonical SafetyRule inside
 * a draft RuleSet.
 */
export async function createCouncilRule(
  input: CouncilRuleInput,
  createdBy: string,
  supabase: SupabaseClient
): Promise<SafetyRule> {
  const normalizedCreatedBy =
    createdBy?.trim()

  if (!normalizedCreatedBy) {
    throw new Error(
      'Authenticated Council user is required'
    )
  }

  if (!input) {
    throw new Error(
      'Rule input is required'
    )
  }

  const ruleId = input.rule_id?.trim()
  const rulesetId =
    input.ruleset_id?.trim()
  const regionCode =
    input.region_code?.trim()
  const domainScope =
    input.domain_scope?.trim()
  const category =
    input.category?.trim()
  const triggerDescription =
    input.trigger_description?.trim()
  const adjustmentInstruction =
    input.adjustment_instruction?.trim()
  const fallbackMessage =
    input.fallback_message?.trim()

  if (!ruleId) {
    throw new Error('Rule ID is required')
  }

  if (!rulesetId) {
    throw new Error('RuleSet ID is required')
  }

  if (
    !Number.isInteger(input.version) ||
    input.version < 1
  ) {
    throw new Error(
      'Rule version must be a positive integer'
    )
  }

  if (!regionCode) {
    throw new Error(
      'Rule region_code is required'
    )
  }

  if (!domainScope) {
    throw new Error(
      'Rule domain_scope is required'
    )
  }

  if (!category) {
    throw new Error(
      'Rule category is required'
    )
  }

  if (!isRuleSeverity(input.severity)) {
    throw new Error(
      'Rule severity is invalid'
    )
  }

  if (
    !isRuleDecisionAction(
      input.decision_type
    )
  ) {
    throw new Error(
      'Rule decision_type is invalid'
    )
  }

  if (!triggerDescription) {
    throw new Error(
      'Rule trigger_description is required'
    )
  }

  if (!adjustmentInstruction) {
    throw new Error(
      'Rule adjustment_instruction is required'
    )
  }

  if (!fallbackMessage) {
    throw new Error(
      'Rule fallback_message is required'
    )
  }

  if (
    input.decision_type === 'block' &&
    input.severity === 'low'
  ) {
    throw new Error(
      'A block rule cannot use low severity'
    )
  }

  const isApproved =
    await isApprovedCouncilMember(
      normalizedCreatedBy,
      supabase
    )

  if (!isApproved) {
    throw new Error(
      'Approved Council membership is required'
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
    .eq('id', rulesetId)
    .maybeSingle()

  if (rulesetError) {
    throw new Error(
      `Failed to load RuleSet: ${rulesetError.message}`
    )
  }

  if (!ruleset) {
    throw new Error(
      `RuleSet ${rulesetId} was not found`
    )
  }

  if (ruleset.status !== 'draft') {
    throw new Error(
      `Rules can only be added to draft RuleSets. Current status: ${ruleset.status}`
    )
  }

  if (
    ruleset.region_code !==
    regionCode
  ) {
    throw new Error(
      `Rule region ${regionCode} does not match RuleSet region ${ruleset.region_code}`
    )
  }

  if (
    ruleset.version !== input.version
  ) {
    throw new Error(
      `Rule version ${input.version} does not match RuleSet version ${ruleset.version}`
    )
  }

  const rule: SafetyRule = {
    rule_id: ruleId,
    ruleset_id: rulesetId,
    version: input.version,
    status: 'draft',
    region_code: regionCode,
    domain_scope: domainScope,
    category,
    severity: input.severity,
    decision_type: input.decision_type,
    trigger_description:
      triggerDescription,
    adjustment_instruction:
      adjustmentInstruction,
    fallback_message: fallbackMessage,
    created_by: normalizedCreatedBy,
  }

  const validation = validateRuleSet(
    [rule],
    {
      expectedRuleSetId: rulesetId,
      expectedRegionCode: regionCode,
      expectedVersion: input.version,
      requireDraftRules: true,
    }
  )

  if (!validation.valid) {
    throw new Error(
      `Invalid rule: ${validation.errors.join('; ')}`
    )
  }

  return addRuleToRuleSet(
    rule,
    supabase
  )
}

/**
 * Submit a draft rule for Council review.
 *
 * draft -> in_review
 */
export async function submitRuleForReview(
  ruleId: string,
  supabase: SupabaseClient
): Promise<SafetyRule> {
  const normalizedRuleId =
    ruleId?.trim()

  if (!normalizedRuleId) {
    throw new Error(
      'Rule ID is required'
    )
  }

  const {
    data: existingRule,
    error: loadError,
  } = await supabase
    .from('rules')
    .select(RULE_SELECT)
    .eq('rule_id', normalizedRuleId)
    .maybeSingle()

  if (loadError) {
    throw new Error(
      `Failed to load rule: ${loadError.message}`
    )
  }

  if (!existingRule) {
    throw new Error('Rule not found')
  }

  if (existingRule.status !== 'draft') {
    throw new Error(
      `Only draft rules can be submitted for review. Current status: ${existingRule.status}`
    )
  }

  /*
   * Validate the rule before allowing it
   * to enter governance review.
   */
  const rule = mapSafetyRule(existingRule)

  const validation = validateRuleSet(
    [rule],
    {
      expectedRuleSetId:
        existingRule.ruleset_id ?? undefined,
      expectedRegionCode:
        existingRule.region_code,
      expectedVersion:
        existingRule.version,
      requireDraftRules: true,
    }
  )

  if (!validation.valid) {
    throw new Error(
      `Rule cannot be submitted for review: ${validation.errors.join('; ')}`
    )
  }

  if (!existingRule.ruleset_id) {
    throw new Error(
      'Rule cannot be reviewed without a RuleSet'
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
    .eq('id', existingRule.ruleset_id)
    .maybeSingle()

  if (rulesetError) {
    throw new Error(
      `Failed to load RuleSet: ${rulesetError.message}`
    )
  }

  if (!ruleset) {
    throw new Error(
      'Parent RuleSet not found'
    )
  }

  if (ruleset.status !== 'draft') {
    throw new Error(
      `Rule cannot be submitted because its RuleSet is ${ruleset.status}`
    )
  }

  const { data, error } = await supabase
    .from('rules')
    .update({
      status: 'in_review',
    })
    .eq('rule_id', normalizedRuleId)
    .eq('status', 'draft')
    .select(RULE_SELECT)
    .single()

  if (error) {
    throw new Error(
      `Failed to submit rule for review: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      'Failed to submit rule for review: no data returned'
    )
  }

  return mapSafetyRule(data)
}

/**
 * Approve a rule currently in review.
 *
 * in_review -> approved
 */
export async function approveCouncilRule(
  ruleId: string,
  supabase: SupabaseClient
): Promise<SafetyRule> {
  const normalizedRuleId =
    ruleId?.trim()

  if (!normalizedRuleId) {
    throw new Error(
      'Rule ID is required'
    )
  }

  const {
    data: existingRule,
    error: loadError,
  } = await supabase
    .from('rules')
    .select(RULE_SELECT)
    .eq('rule_id', normalizedRuleId)
    .maybeSingle()

  if (loadError) {
    throw new Error(
      `Failed to load rule: ${loadError.message}`
    )
  }

  if (!existingRule) {
    throw new Error('Rule not found')
  }

  if (existingRule.status !== 'in_review') {
    throw new Error(
      `Only rules in review can be approved. Current status: ${existingRule.status}`
    )
  }

  const rule = mapSafetyRule(existingRule)

  const validation = validateRuleSet(
    [rule],
    {
      expectedRuleSetId:
        existingRule.ruleset_id ?? undefined,
      expectedRegionCode:
        existingRule.region_code,
      expectedVersion:
        existingRule.version,
    }
  )

  if (!validation.valid) {
    throw new Error(
      `Rule cannot be approved: ${validation.errors.join('; ')}`
    )
  }

  if (!existingRule.ruleset_id) {
    throw new Error(
      'Rule cannot be approved without a RuleSet'
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
    .eq('id', existingRule.ruleset_id)
    .maybeSingle()

  if (rulesetError) {
    throw new Error(
      `Failed to load RuleSet: ${rulesetError.message}`
    )
  }

  if (!ruleset) {
    throw new Error(
      'Parent RuleSet not found'
    )
  }

  if (
    ruleset.region_code !==
    existingRule.region_code
  ) {
    throw new Error(
      'Rule region does not match its RuleSet'
    )
  }

  if (
    ruleset.version !==
    existingRule.version
  ) {
    throw new Error(
      'Rule version does not match its RuleSet'
    )
  }

  if (
    ruleset.status !== 'draft' &&
    ruleset.status !== 'in_review' &&
    ruleset.status !== 'approved'
  ) {
    throw new Error(
      `Rule cannot be approved because its RuleSet is ${ruleset.status}`
    )
  }

  const approvedAt =
    new Date().toISOString()

  const { data, error } = await supabase
    .from('rules')
    .update({
      status: 'approved',
      approved_at: approvedAt,
    })
    .eq('rule_id', normalizedRuleId)
    .eq('status', 'in_review')
    .select(RULE_SELECT)
    .single()

  if (error) {
    throw new Error(
      `Failed to approve rule: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      'Failed to approve rule: no data returned'
    )
  }

  return mapSafetyRule(data)
}

export default {
  registerCouncilMember,
  getCouncilMemberStatus,
  getPendingCouncilApplications,
  getCouncilMembers,
  updateCouncilMemberStatus,
  isApprovedCouncilMember,
  getCouncilRules,
  getCouncilRuleSets,
  getCouncilRuleSet,
  createCouncilRuleSet,
  createCouncilRule,
  submitRuleForReview,
  approveCouncilRule,
}
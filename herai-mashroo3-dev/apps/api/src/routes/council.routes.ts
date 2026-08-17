import {
  Router,
  Request,
  Response,
} from 'express'
import { SupabaseClient } from '@supabase/supabase-js'

import authMiddleware from '../middleware/auth.middleware'
import councilMiddleware from '../middleware/council.middleware'

import {
  registerCouncilMember,
  getCouncilMemberStatus,
  updateCouncilMemberStatus,
  isApprovedCouncilMember,
  getPendingCouncilApplications,
  getCouncilMembers,
  getCouncilRules,
  getCouncilRuleSets,
  getCouncilRuleSet,
  createCouncilRuleSet,
  createCouncilRule,
  submitRuleForReview,
  approveCouncilRule,
} from '../services/council.service'

type ServiceRequest = Request & {
  services?: {
    supabase?: SupabaseClient
  }

  user?: {
    id: string
    email?: string
  }
}

const router = Router()

function getErrorMessage(
  err: unknown
): string {
  return err instanceof Error
    ? err.message
    : String(err)
}

/*
|--------------------------------------------------------------------------
| APPLY
|--------------------------------------------------------------------------
*/

router.post(
  '/register',
  authMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      const userId =
        req.user?.id?.trim()

      if (!userId || !supabase) {
        return res.status(401).json({
          error:
            'Unauthorized or missing dependencies',
        })
      }

      const {
        motivation,
        experience,
        contribution,
        availability,
        agreement,
      } = req.body

      if (
        typeof motivation !== 'string' ||
        !motivation.trim() ||
        typeof experience !== 'string' ||
        !experience.trim() ||
        typeof contribution !== 'string' ||
        !contribution.trim() ||
        typeof availability !== 'string' ||
        !availability.trim() ||
        agreement !== true
      ) {
        return res.status(400).json({
          error:
            'All Council application fields are required',
        })
      }

      const result =
        await registerCouncilMember(
          userId,
          {
            motivation,
            experience,
            contribution,
            availability,
            agreement,
          },
          supabase
        )

      return res.status(201).json(
        result
      )
    } catch (err: unknown) {
      console.error(
        'Council registration error:',
        err
      )

      return res.status(400).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/*
|--------------------------------------------------------------------------
| MY STATUS
|--------------------------------------------------------------------------
*/

router.get(
  '/members/:user_id',
  authMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      const authenticatedUserId =
        req.user?.id?.trim()

      const requestedUserId =
        req.params.user_id?.trim()

      if (
        !authenticatedUserId ||
        !supabase
      ) {
        return res.status(401).json({
          error: 'Unauthorized',
        })
      }

      if (!requestedUserId) {
        return res.status(400).json({
          error: 'User ID is required',
        })
      }

      const isOwnStatus =
        authenticatedUserId ===
        requestedUserId

      if (!isOwnStatus) {
        const allowed =
          await isApprovedCouncilMember(
            authenticatedUserId,
            supabase
          )

        if (!allowed) {
          return res.status(403).json({
            error:
              'Approved Council membership required',
          })
        }
      }

      const status =
        await getCouncilMemberStatus(
          requestedUserId,
          supabase
        )

      if (!status) {
        return res.status(404).json({
          error:
            'Council application not found',
        })
      }

      return res.json({
        status,
      })
    } catch (err: unknown) {
      console.error(
        'Council status error:',
        err
      )

      return res.status(500).json({
        error: getErrorMessage(err),
      })
    }
  }
)
/*
|--------------------------------------------------------------------------
| MY COUNCIL MEMBERSHIP
|--------------------------------------------------------------------------
*/

router.get(
  '/me',
  authMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      const userId =
        req.user?.id?.trim()

      if (!userId || !supabase) {
        return res.status(401).json({
          error: 'Unauthorized',
        })
      }

      const member =
        await getCouncilMemberStatus(
          userId,
          supabase
        )

      if (!member) {
        return res.status(404).json({
          error:
            'Council membership not found',
        })
      }

      return res.json({
        member,
      })
    } catch (err: unknown) {
      console.error(
        'Council me error:',
        err
      )

      return res.status(500).json({
        error: getErrorMessage(err),
      })
    }
  }
)
/*
|--------------------------------------------------------------------------
| DASHBOARD OVERVIEW
|--------------------------------------------------------------------------
*/

router.get(
  '/dashboard',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error:
            'Supabase client not available',
        })
      }

      const [
        applications,
        members,
        rules,
        rulesets,
      ] = await Promise.all([
        getPendingCouncilApplications(
          supabase
        ),
        getCouncilMembers(
          supabase
        ),
        getCouncilRules(
          supabase
        ),
        getCouncilRuleSets(
          supabase
        ),
      ])

      return res.json({
        applications,
        members,
        rules,
        rulesets,

        stats: {
          pendingApplications:
            applications.length,

          approvedMembers:
            members.filter(
              (member) =>
                member.status ===
                'approved'
            ).length,

          pendingRules:
            rules.filter(
              (rule) =>
                rule.status ===
                'in_review'
            ).length,

          draftRules:
            rules.filter(
              (rule) =>
                rule.status === 'draft'
            ).length,

          approvedRules:
            rules.filter(
              (rule) =>
                rule.status ===
                'approved'
            ).length,

          activeRuleSets:
            rulesets.filter(
              (ruleset) =>
                ruleset.status ===
                'active'
            ).length,

          draftRuleSets:
            rulesets.filter(
              (ruleset) =>
                ruleset.status === 'draft'
            ).length,
        },
      })
    } catch (err: unknown) {
      console.error(
        'Council dashboard error:',
        err
      )

      return res.status(500).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/*
|--------------------------------------------------------------------------
| PENDING APPLICATIONS
|--------------------------------------------------------------------------
*/

router.get(
  '/applications',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error:
            'Supabase client not available',
        })
      }

      const applications =
        await getPendingCouncilApplications(
          supabase
        )

      return res.json({
        applications,
      })
    } catch (err: unknown) {
      console.error(
        'Council applications error:',
        err
      )

      return res.status(500).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/*
|--------------------------------------------------------------------------
| APPROVE APPLICATION
|--------------------------------------------------------------------------
*/

router.post(
  '/members/:user_id/approve',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error:
            'Supabase client not available',
        })
      }

      const userId =
        req.params.user_id?.trim()

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required',
        })
      }

      const result =
        await updateCouncilMemberStatus(
          userId,
          'approved',
          supabase
        )

      return res.json(result)
    } catch (err: unknown) {
      console.error(
        'Council approval error:',
        err
      )

      return res.status(400).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/*
|--------------------------------------------------------------------------
| REJECT APPLICATION
|--------------------------------------------------------------------------
*/

router.post(
  '/members/:user_id/reject',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error:
            'Supabase client not available',
        })
      }

      const userId =
        req.params.user_id?.trim()

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required',
        })
      }

      const result =
        await updateCouncilMemberStatus(
          userId,
          'rejected',
          supabase
        )

      return res.json(result)
    } catch (err: unknown) {
      console.error(
        'Council rejection error:',
        err
      )

      return res.status(400).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/*
|--------------------------------------------------------------------------
| RULESETS
|--------------------------------------------------------------------------
*/

/**
 * Get all RuleSets.
 */
router.get(
  '/rulesets',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error:
            'Supabase client not available',
        })
      }

      const rulesets =
        await getCouncilRuleSets(
          supabase
        )

      return res.json({
        rulesets,
      })
    } catch (err: unknown) {
      console.error(
        'Council RuleSets error:',
        err
      )

      return res.status(500).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/**
 * Get one RuleSet.
 */
router.get(
  '/rulesets/:ruleset_id',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error:
            'Supabase client not available',
        })
      }

      const rulesetId =
        req.params.ruleset_id?.trim()

      if (!rulesetId) {
        return res.status(400).json({
          error:
            'RuleSet ID is required',
        })
      }

      const ruleset =
        await getCouncilRuleSet(
          rulesetId,
          supabase
        )

      if (!ruleset) {
        return res.status(404).json({
          error: 'RuleSet not found',
        })
      }

      return res.json({
        ruleset,
      })
    } catch (err: unknown) {
      console.error(
        'Council RuleSet error:',
        err
      )

      return res.status(500).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/**
 * Create a RuleSet.
 *
 * RuleSets are created as draft by
 * council.service.ts.
 */
router.post(
  '/rulesets',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      const userId =
        req.user?.id?.trim()

      if (!userId || !supabase) {
        return res.status(401).json({
          error:
            'Unauthorized or missing dependencies',
        })
      }

      const {
        id,
        region_code,
        version,
      } = req.body

      if (
        typeof id !== 'string' ||
        !id.trim() ||
        typeof region_code !==
          'string' ||
        !region_code.trim() ||
        !Number.isInteger(version) ||
        version < 1
      ) {
        return res.status(400).json({
          error:
            'id, region_code, and a positive integer version are required',
        })
      }

      const ruleset =
        await createCouncilRuleSet(
          {
            id: id.trim(),
            region_code:
              region_code.trim(),
            version,
          },
          userId,
          supabase
        )

      return res.status(201).json(
        ruleset
      )
    } catch (err: unknown) {
      console.error(
        'Council RuleSet creation error:',
        err
      )

      return res.status(400).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/*
|--------------------------------------------------------------------------
| RULES
|--------------------------------------------------------------------------
*/

/**
 * Get all canonical SafetyRules.
 */
router.get(
  '/rules',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error:
            'Supabase client not available',
        })
      }

      const rules =
        await getCouncilRules(
          supabase
        )

      return res.json({
        rules,
      })
    } catch (err: unknown) {
      console.error(
        'Council rules error:',
        err
      )

      return res.status(500).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/**
 * Create a canonical SafetyRule
 * inside a DRAFT RuleSet.
 *
 * This matches the current SafetyRule
 * structure from ruleset.service.ts.
 */
router.post(
  '/rules',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      const userId =
        req.user?.id?.trim()

      if (!userId || !supabase) {
        return res.status(401).json({
          error:
            'Unauthorized or missing dependencies',
        })
      }

      const {
        rule_id,
        ruleset_id,
        version,
        region_code,
        domain_scope,
        category,
        severity,
        decision_type,
        trigger_description,
        adjustment_instruction,
        fallback_message,
      } = req.body

      /*
       * Canonical SafetyRule validation.
       */
      if (
        typeof rule_id !== 'string' ||
        !rule_id.trim() ||
        typeof ruleset_id !==
          'string' ||
        !ruleset_id.trim() ||
        !Number.isInteger(version) ||
        version < 1 ||
        typeof region_code !==
          'string' ||
        !region_code.trim() ||
        typeof domain_scope !==
          'string' ||
        !domain_scope.trim() ||
        typeof category !==
          'string' ||
        !category.trim() ||
        typeof severity !==
          'string' ||
        !severity.trim() ||
        typeof decision_type !==
          'string' ||
        !decision_type.trim() ||
        typeof trigger_description !==
          'string' ||
        !trigger_description.trim() ||
        typeof adjustment_instruction !==
          'string' ||
        !adjustment_instruction.trim() ||
        typeof fallback_message !==
          'string' ||
        !fallback_message.trim()
      ) {
        return res.status(400).json({
          error:
            'Invalid rule. Required fields: rule_id, ruleset_id, version, region_code, domain_scope, category, severity, decision_type, trigger_description, adjustment_instruction, and fallback_message',
        })
      }

      const validSeverities =
        new Set([
          'low',
          'medium',
          'high',
          'critical',
        ])

      const validDecisionTypes =
        new Set([
          'safe',
          'adjust',
          'block',
        ])

      if (
        !validSeverities.has(
          severity
        )
      ) {
        return res.status(400).json({
          error:
            'severity must be one of: low, medium, high, critical',
        })
      }

      if (
        !validDecisionTypes.has(
          decision_type
        )
      ) {
        return res.status(400).json({
          error:
            'decision_type must be one of: safe, adjust, block',
        })
      }

      if (
        decision_type === 'block' &&
        severity === 'low'
      ) {
        return res.status(400).json({
          error:
            'A block rule cannot use low severity',
        })
      }

      const rule =
        await createCouncilRule(
          {
            rule_id:
              rule_id.trim(),

            ruleset_id:
              ruleset_id.trim(),

            version,

            region_code:
              region_code.trim(),

            domain_scope:
              domain_scope.trim(),

            category:
              category.trim(),

            severity,

            decision_type,

            trigger_description:
              trigger_description.trim(),

            adjustment_instruction:
              adjustment_instruction.trim(),

            fallback_message:
              fallback_message.trim(),
          },
          userId,
          supabase
        )

      return res.status(201).json(
        rule
      )
    } catch (err: unknown) {
      console.error(
        'Council rule creation error:',
        err
      )

      return res.status(400).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/*
|--------------------------------------------------------------------------
| SUBMIT RULE FOR REVIEW
|--------------------------------------------------------------------------
*/

router.post(
  '/rules/:rule_id/review',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error:
            'Supabase client not available',
        })
      }

      const ruleId =
        req.params.rule_id?.trim()

      if (!ruleId) {
        return res.status(400).json({
          error: 'Rule ID is required',
        })
      }

      const rule =
        await submitRuleForReview(
          ruleId,
          supabase
        )

      return res.json(rule)
    } catch (err: unknown) {
      console.error(
        'Council rule review submission error:',
        err
      )

      return res.status(400).json({
        error: getErrorMessage(err),
      })
    }
  }
)

/*
|--------------------------------------------------------------------------
| APPROVE RULE
|--------------------------------------------------------------------------
*/

router.post(
  '/rules/:rule_id/approve',
  authMiddleware,
  councilMiddleware,
  async (
    req: ServiceRequest,
    res: Response
  ) => {
    try {
      const { supabase } =
        req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error:
            'Supabase client not available',
        })
      }

      const ruleId =
        req.params.rule_id?.trim()

      if (!ruleId) {
        return res.status(400).json({
          error: 'Rule ID is required',
        })
      }

      const rule =
        await approveCouncilRule(
          ruleId,
          supabase
        )

      return res.json(rule)
    } catch (err: unknown) {
      console.error(
        'Council rule approval error:',
        err
      )

      return res.status(400).json({
        error: getErrorMessage(err),
      })
    }
  }
)

export default router
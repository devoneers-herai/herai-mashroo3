# HerAI Region Configuration Contract

## 1. Purpose

The region configuration defines region-specific behavior without requiring
changes to the core application logic.

The runtime resolves the active region configuration before generating
a response.

---

## 2. Runtime Resolution

Every request contains a region identifier.

The backend resolves the corresponding region configuration:

```text
region_code
     ↓
region_config[region_code]
     ↓
active region configuration
     ↓
generate + safety evaluation
```

The resolved configuration version must be recorded for traceability.

---

## 3. Configuration Files

Region configurations are stored under:

```text
config/
├── region_config.LB.json
└── region_config.EG.json
```

Each file represents the configuration for one region.

---

## 4. Configuration Shape

Example:

```json
{
  "region_code": "EG",
  "version": "v1",
  "domain_scope": [],
  "language": "",
  "dialect": "",
  "active_safety_ruleset_id": ""
}
```

---

## 5. Configuration Fields

| Field | Description |
|---|---|
| `region_code` | Identifier of the region |
| `version` | Version of the region configuration |
| `domain_scope` | Domains supported by the configuration |
| `language` | Language configuration |
| `dialect` | Regional language or dialect configuration |
| `active_safety_ruleset_id` | Safety ruleset currently associated with the region |

---

## 6. Runtime Behavior

The system must resolve the region configuration at runtime.

The resolved configuration must be used by the relevant services.

The configuration version must be recorded with the conversation and
Safety Verdict.

---

## 7. Architectural Principle

Region-specific behavior belongs in configuration whenever possible.

The core application logic should remain shared across regions.

Adding a new region should primarily require adding a new region
configuration rather than creating a separate application implementation.

---

## 8. Configuration Ownership

The region configuration is an architectural contract.

Changes to its structure must be reviewed before implementation because
multiple services depend on its schema.

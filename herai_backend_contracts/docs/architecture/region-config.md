# HerAI Region Configuration Contract

`region_config` is the single runtime mechanism for country-specific configuration.

Files:
```text
config/
├── region_config.LB.json
└── region_config.EG.json
```

Runtime:
```text
region
  ↓
region_config[region]
  ↓
active configuration
  ↓
services
```

Core fields:
- `active_safety_ruleset_id`
- `active_council_content_version`
- `channel_fallback_order`
- `domain_scope`

Example:
```json
{
  "region_code":"EG",
  "version":"v1",
  "active_safety_ruleset_id":"ruleset-eg-v1",
  "active_council_content_version":"council-eg-v1",
  "channel_fallback_order":["whatsapp","sms","voice"],
  "domain_scope":["agri"]
}
```

The resolved version is recorded with the conversation and verdict.
Region-specific behavior should be configuration-driven, not duplicated core logic.

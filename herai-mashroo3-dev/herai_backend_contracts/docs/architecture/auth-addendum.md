# HerAI Authentication & Council Registration Addendum

> Additive contract for the existing HerAI backend. This document does not replace the existing architecture, API contracts, data model, or migration.

## 1. Account Types

The system has two account types:

- Regular User
- Council Member

Both use Supabase Auth for authentication. The difference is authorization and Council approval.

```text
Supabase Auth
    |
    +--> User --> normal account --> Chat
    |
    +--> Council --> Council membership --> approval --> Council APIs
```

## 2. Regular User

Flow:

```text
Register -> Supabase Auth -> Login -> Authenticated User -> Chat
```

Registration endpoint:

```text
POST /api/auth/register
```

Request:

```json
{
  "email": "string",
  "password": "string"
}
```

Supabase Auth handles passwords, sessions, and authentication identity. Application tables must not store user passwords.

## 3. Council Member

Council uses the same underlying Supabase Auth mechanism, but registration does NOT automatically grant Council privileges.

Flow:

```text
Register
   -> Supabase Auth account
   -> Council membership
   -> status = pending
   -> approval
   -> status = approved
   -> Login
   -> Council authorization
   -> Council APIs
```

Statuses:

```text
pending
approved
rejected
```

Only `approved` members can use protected Council operations.

Registration endpoint:

```text
POST /api/council/register
```

Request:

```json
{
  "email": "string",
  "password": "string"
}
```

The client must NOT be trusted to submit `role = council` and `status = approved` and have those values accepted as authorization.

## 4. Council Membership

Add the following table to the existing data model:

```text
council_members
```

Suggested fields:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Supabase Auth user ID |
| `status` | text/enum | `pending`, `approved`, `rejected` |
| `role` | text | Council role |
| `created_at` | timestamptz | Registration time |
| `approved_at` | timestamptz | Nullable approval time |
| `approved_by` | UUID | Nullable approving user |

The existing project materials do not define who approves a pending Council member. The backend must keep this behind a clear service boundary until the team decides the approval authority.

## 5. Authorization

Authentication asks: “Who is this user?”

Authorization asks: “Is this authenticated user allowed to perform Council operations?”

```text
Request
  -> validate Supabase Auth session/JWT
  -> get authenticated user ID
  -> load Council membership
  -> check role
  -> check status
  -> approved?
       YES -> allow
       NO  -> 403 Forbidden
```

Regular users cannot access protected Council endpoints.

## 6. Existing Application Data

Keep the existing tables:

```text
rules
conversations
verdicts
council_decisions
```

Add:

```text
council_members
```

Extend `conversations` with:

```text
user_id UUID
```

The `user_id` must come from the authenticated user context, not from an arbitrary client-supplied ID.

Council governance actions should be attributable to the authenticated Council actor. Existing fields such as `created_by` must not rely only on free-form client input when authenticated identity is available.

## 7. Existing Council API

The existing endpoint remains:

```text
POST /api/council/rules
```

Access flow:

```text
Authenticated user
      -> Council membership exists?
      -> status = approved?
      -> allowed
```

Otherwise return:

```text
403 Forbidden
```

The existing `COUNCIL_SHARED_TOKEN` may remain as a temporary Week-1/bootstrap mechanism if the team still needs it, but it is not the final Council account authorization mechanism.

## 8. Security Rules

1. Supabase Auth handles passwords.
2. Do not store passwords in application tables.
3. Do not trust the frontend to assign Council role.
4. Do not trust the frontend to assign `approved` status.
5. Derive authenticated `user_id` from the auth context.
6. `pending` and `rejected` Council members cannot access protected Council operations.
7. Regular users cannot access Council endpoints.
8. Council governance actions must be attributable to an authenticated actor.
9. Existing application-table access rules remain unchanged.

## 9. Additions to Existing Contracts

New endpoints:

```text
POST /api/auth/register
POST /api/council/register
```

New table:

```text
council_members
```

New relationship field:

```text
conversations.user_id
```

Existing endpoints and tables remain unchanged unless the backend review identifies a required compatibility adjustment.

## 10. Backend Implementation Scope

The Backend Developer should implement only the additions in this document on top of the existing backend:

- Supabase Auth integration
- user registration
- Council registration
- authentication middleware
- Council authorization middleware
- Council membership persistence
- approval-status checks
- authenticated actor attribution
- required migration additions

Do not recreate the existing backend contracts or replace the existing schema.

## 11. Production Decision

The existing project materials do not define who approves a pending Council registration. This must be decided before production. Possible authorities include an internal administrator or another explicitly authorized governance actor. Until decided, do not hard-code an assumed approval authority.

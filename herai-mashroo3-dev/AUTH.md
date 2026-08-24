# HerAI Authentication API

## Overview

The API provides three main auth flows:
- **Register**: Create new user account with profile
- **Login**: Authenticate and get session token
- **Protected Routes**: Use JWT access token to call council/chat endpoints

## Database Schema

### `public.users` table
Stores user profile information linked to Supabase Auth.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Yes | References `auth.users.id` (primary key) |
| `email` | text | Yes | User email (unique) |
| `first_name` | text | No | User first name |
| `last_name` | text | No | User last name |
| `age` | integer | No | User age |
| `domain` | text | No | Professional domain (e.g., "healthcare") |
| `country` | text | No | Country of residence |
| `city` | text | No | City of residence |
| `phone_number` | text | No | Contact phone number |
| `created_at` | timestamptz | Yes | Account creation timestamp |
| `updated_at` | timestamptz | Yes | Last update timestamp |

## Endpoints

### 1. Register User

**POST** `/api/auth/register`

Create a new user account and profile.

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "age": 30,
  "domain": "healthcare",
  "country": "Egypt",
  "city": "Cairo",
  "phoneNumber": "+201234567890"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error (400):**
```json
{
  "error": "Missing required fields: email, password, firstName, lastName, phoneNumber"
}
```

---

### 2. Login User

**POST** `/api/auth/login`

Authenticate user and get access token.

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error (401):**
```json
{
  "error": "Login failed: Invalid email or password"
}
```

---

### 3. Chat Endpoint (requires auth)

**POST** `/api/chat`

Send a message for AI processing (requires valid access token).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "message": "What are the symptoms of diabetes?",
  "region": "EG",
  "persona": "health-advisor"
}
```

**Response:**
```json
{
  "response": "Symptoms include increased thirst, frequent urination...",
  "safety_flag": "safe",
  "verdict": {
    "bias_score": 0.1,
    "risk_score": 0.05,
    "action": "safe",
    "matched_rule_ids": []
  }
}
```

---

### 4. Create Council Rule (requires auth)

**POST** `/api/council/rules`

Create a new safety rule (requires JWT authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "region_code": "EG",
  "domain_scope": "healthcare",
  "category": "bias",
  "severity": "high",
  "decision_type": "block",
  "trigger_description": "harmful medical misinformation",
  "adjustment_instruction": "provide medically accurate information",
  "fallback_message": "I cannot provide that information. Please consult a healthcare professional.",
  "created_by": "john.doe@example.com"
}
```

**Response (201 Created):**
```json
{
  "data": [
    {
      "rule_id": "rule-uuid-123",
      "region_code": "EG",
      "domain_scope": "healthcare",
      "created_at": "2026-08-13T12:34:56Z",
      ...
    }
  ]
}
```

---

## Usage Flow

### Step 1: Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "age": 30,
    "domain": "healthcare",
    "country": "Egypt",
    "city": "Cairo",
    "phoneNumber": "+201234567890"
  }'
```

### Step 2: Login (or get fresh token)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

Save the `access_token` from response.

### Step 3: Use access token in protected endpoints
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "hello",
    "region": "EG",
    "persona": "test"
  }'
```

---

## Security Notes

- **Passwords**: Never stored in backend; managed entirely by Supabase Auth.
- **Tokens**: Access tokens are JWTs; validate them in protected routes.
- **HTTPS**: Always use HTTPS in production to protect tokens in transit.
- **Token Refresh**: Use `refresh_token` to get new `access_token` when it expires (implement refresh endpoint if needed).
- **Profile Data**: User profile stored in `public.users` table; linked to Supabase Auth by user ID.

---

## Implementation Details

### `apps/api/src/services/auth.service.ts`
Core auth logic:
- `register(input, supabase)` — Creates Auth account + user profile
- `login(input, supabase)` — Authenticates and returns session
- `verifyToken(token, supabase)` — Validates JWT token

### `apps/api/src/routes/auth.routes.ts`
Auth endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`

### `apps/api/src/middleware/auth.middleware.ts`
JWT verification middleware:
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token using Supabase
- Attaches `req.user` to request for use in protected handlers

---

## Testing

Use Postman, curl, or your REST client to test the endpoints above.

**Example environment variables** (for local testing):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
OPENAI_API_KEY=<openai-key>
```

---

## Next Steps

1. Apply migration to Supabase: run `001_intial_schema.sql` in Supabase SQL Editor.
2. Start API: `npm run dev` in `apps/api/`
3. Test register and login endpoints.
4. Use returned `access_token` in protected routes.

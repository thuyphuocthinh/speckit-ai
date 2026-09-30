# Contract: [Service / Component Name]

> **Provider**: [Name of the providing service/team]
> **Consumer**: [Name of the consuming service/team]
> **Version**: 1.0.0
> **Status**: [Draft / Active / Deprecated]

## 1. Overview
[Brief description of what this contract covers. Example: "REST API for User Authentication" or "Event schema for OrderCreated"]

## 2. Endpoints / Interfaces

### `[GET/POST] /api/v1/resource`
[Description of the endpoint]

**Request:**
```json
{
  "field": "type - description"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {}
}
```

## 3. Data Models (Schemas)

### `ResourceObject`
| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |

## 4. Error Handling
| Code | Error Message | Reason |
|---|---|---|
| `400` | `INVALID_INPUT` | The provided schema failed validation |
| `401` | `UNAUTHORIZED` | Missing or invalid token |

## 5. Change Log
- **YYYY-MM-DD**: Initial draft

# Creator Card Microservice

## Overview

This service exposes three root-level endpoints:

- `POST /creator-cards`
- `GET /creator-cards/:slug`
- `DELETE /creator-cards/:slug`

It uses:

- Express for HTTP handling
- MongoDB Atlas for persistence
- the template VSL validator for field-level validation
- template error utilities for business-rule errors

## Features

- Create public and private creator cards
- Auto-generate slugs from `title`
- Enforce active slug uniqueness
- Support private card retrieval with `access_code`
- Soft-delete cards
- Return `id` in API responses while storing `_id` internally
- Omit `access_code` from retrieval responses

## Project Structure

Assessment-relevant files live mainly in:

- `endpoints/creator-cards/`
- `services/creator-cards/`
- `repository/creator-card/`
- `models/creator-card.js`
- `messages/creator-card.js`
- `test/creator-cards.test.js`

## Environment Variables

Required variables for this assessment:

- `PORT`
- `MONGODB_URI`

Useful optional variables:

- `LOG_APP_REQUEST=1`
- `SHOW_RAW_HEADERS=1`

See [.env.example](/Users/samueladelowo/Documents/Resilience%2017/.env.example) for the full template env file.

Example local `.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
LOG_APP_REQUEST=1
```

## Install

```bash
npm install
```

## Run Locally

```bash
node app.js
```

If startup succeeds, the API will be available at:

```text
http://localhost:3000
```

## API Summary

### 1. Create Creator Card

`POST /creator-cards`

Example:

```bash
curl -X POST http://localhost:3000/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "George Cooks",
    "description": "Weekly cooking podcast",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "status": "published",
    "links": [
      {
        "title": "YouTube",
        "url": "https://youtube.com/@georgecooks"
      }
    ],
    "service_rates": {
      "currency": "NGN",
      "rates": [
        {
          "name": "IG Story Post",
          "description": "One story mention",
          "amount": 5000000
        }
      ]
    }
  }'
```

### 2. Retrieve Creator Card

`GET /creator-cards/:slug`

Public card example:

```bash
curl http://localhost:3000/creator-cards/george-cooks
```

Private card example:

```bash
curl "http://localhost:3000/creator-cards/vip-rate-card?access_code=A1B2C3"
```

### 3. Delete Creator Card

`DELETE /creator-cards/:slug`

Example:

```bash
curl -X DELETE http://localhost:3000/creator-cards/george-cooks \
  -H "Content-Type: application/json" \
  -d '{
    "creator_reference": "crt_8f2k1m9x4p7w3q5z"
  }'
```

## Business Rules Implemented

- `SL02`: client-provided slug already taken
- `AC01`: private card missing `access_code`
- `AC05`: public card provided with `access_code`
- `NF01`: card not found
- `NF02`: card exists but is draft
- `AC03`: private card requested without `access_code`
- `AC04`: private card requested with wrong `access_code`

## Validation Notes

Field-level validation is handled with the template VSL validator for:

- required fields
- lengths
- enums
- slug format
- URL format
- integer amounts
- delete body validation
- retrieval query `access_code` validation for private cards

Business rules are enforced in the service layer.

## Testing

Focused creator-card tests:

```bash
npm test -- --grep "Creator Cards endpoints"
```

The current suite covers:

- all valid assessment cases
- all invalid assessment cases
- slug collision handling
- private/public access rules
- soft delete behavior
- serialization rules

# Slabbers

A clean, premium collectible card collection app.

---

## Overview

**Slabbers** is a minimalist card collection app where users authenticate via **email magic link** and add cards to their personal collection.  
All cards are publicly viewable in a gallery with a clean, high-end presentation inspired by Goldin.

Cards can optionally be marked **for sale**.  
When a card is marked as for sale, a **price is displayed**, but **no transaction or marketplace flow exists in V1**.

Slabbers V1 is strictly a **collection + display app**.

---

## Goals (V1)

- Authenticate users using email magic links
- Allow authenticated users to add cards to their collection
- Display all cards publicly in a clean gallery
- Display user-specific collections
- Show a price only when a card is marked as for sale
- Maintain a premium, distraction-free UI

---

## Non-Goals (V1)

- Payments or checkout
- Auctions or bidding
- Offers or negotiations
- Messaging between users
- Card authentication verification
- Sales history or analytics

---

## Tech Stack

- **Next.js** (App Router, JavaScript)
- **shadcn/ui** (Radix UI + Tailwind CSS)
- **Tailwind CSS**
- **Supabase**
  - Email magic link authentication
  - PostgreSQL database
  - Image storage
- **Vercel** for deployment

---

## Supabase Setup

### 1) Database (cards + RLS)

Run the SQL in:

- [supabase/cards.sql](supabase/cards.sql)

This creates the `cards` table and enables RLS with:

- Public `SELECT` for non-private cards
- `INSERT` only when `auth.uid() = user_id`
- `UPDATE / DELETE` only when `auth.uid() = user_id`

---

### 2) Storage (card images bucket)

Run the SQL in:

- [supabase/storage.sql](supabase/storage.sql)

This creates a public bucket named `card-images` and adds basic RLS policies.

---

## Authentication

- Email-based **magic link authentication**
- No passwords or usernames
- Persistent authenticated sessions
- Required for adding or editing cards

---

## Core Features

### Cards

Authenticated users can add cards to their collection.

#### Required Fields

- `title`
- `year`
- `player`
- `brand`
- `image`

#### Optional Fields

- `set_name`
- `card_number`
- `is_graded`
- `grading_company`
- `grade`
- `rookie`
- `autograph`
- `serial_numbered`
- `print_run`
- `for_sale`
- `price` (required only if `for_sale = true`)
- `is_private`

Each card belongs to a single user.

---

### Public Gallery (`/`)

- Displays all **public** cards
- Grid-based layout displaying:
  - Card image
  - Title
  - Key attributes (year, brand)
  - Badges (PSA grade, Rookie, Auto, /99)
  - **Price only if the card is marked for sale**
- Cards link to a detail page

---

### User Collection Page (`/user/[id]`)

- Displays cards belonging to a specific user
- Uses the **exact same grid and card components** as the public gallery
- The only difference is the **data source**:
  - filtered by `user_id`
  - respects privacy rules (`is_private`), unless its the current user
- No UI duplication; gallery components are reused

This page represents a public-facing view of a user’s collection.

---

### Card Detail Page (`/card/[id]`)

Each card page displays:

- Large card image
- Title
- Full attribute list
- Grading information (if applicable)
- Badges for special attributes
- **For Sale status**
- **Displayed price if for sale**

---

## Pages & Routes

| Route        | Description                                       |
| ------------ | ------------------------------------------------- |
| `/`          | Public card gallery                               |
| `/user/[id]` | Public view of a user’s card collection           |
| `/card/[id]` | Card detail page                                  |
| `/add`       | Add card to collection (authenticated users only) |
| `/login`     | Magic link authentication                         |

---

## Data Model

### Table: `cards`

| Field           | Type                |
| --------------- | ------------------- |
| id              | UUID                |
| user_id         | UUID                |
| is_private      | Boolean             |
| title           | Text                |
| year            | Integer             |
| player          | Text                |
| brand           | Text                |
| set_name        | Text (nullable)     |
| card_number     | Text (nullable)     |
| is_graded       | Boolean             |
| grading_company | Text (nullable)     |
| grade           | Text (nullable)     |
| rookie          | Boolean             |
| autograph       | Boolean             |
| serial_numbered | Boolean             |
| print_run       | Integer (nullable)  |
| for_sale        | Boolean             |
| price_cents     | Integer (nullable)  |
| currency        | Text (default: CAD) |
| image_urls      | Text[]              |
| created_at      | Timestamp           |

> `price_cents` must be set only when `for_sale = true`.

---

## Security & Permissions

- Public users can read cards where `is_private = false`
- Signed-in users can read their own cards (including private)
- Only authenticated users can add cards
- Only card owners can edit or delete their cards
- Permissions enforced using database-level row security (RLS)

---

## UI / UX Principles

- Clean, premium aesthetic inspired by Goldin
- Neutral color palette
- Strong typography hierarchy
- Generous whitespace
- Subtle borders and shadows
- Fully responsive layout

---

## Philosophy

Slabbers prioritizes **clarity and presentation** over marketplace complexity.  
Cards should be easy to browse, easy to understand, and visually respected — whether they are part of a personal collection or marked for sale.

---

So in this project we will be trying to connect an Ecom engine which is the backend into Enonic/XP/Content studio which will be the front end using Next.js


AI:
# Instant Storefront — Enonic + Next.js + Headless Commerce

A modern e-commerce prototype built during a 4-week internship at [Enonic AS](https://enonic.com). Demonstrates composable commerce architecture using Enonic as the presentation/editorial layer and a headless commerce API for product and order management.

**License:** Apache 2.0

---

## What This Is

This project proves that Enonic can orchestrate third-party commerce data alongside editorial content — letting developers build fast storefronts while giving editors full control over landing pages and content in Enonic's Content Studio.

The stack:

- **[Enonic XP](https://enonic.com/platform)** — CMS and presentation layer
- **[Next.js](https://nextjs.org)** — Frontend framework
- **[Guillotine API](https://developer.enonic.com/docs/guillotine)** — GraphQL API for Enonic content
- **[Medusa](https://medusajs.com)** — Headless commerce backend

---

## Goals

1. Demonstrate composable commerce with Enonic as the editorial backbone
2. Build a working Next.js storefront connected to real product data
3. Explore how editors can visually build landing pages around products in Content Studio
4. Produce a clean, public, well-documented open-source reference project

---

## Architecture

```
┌─────────────────────────────────────┐
│           Next.js Frontend          │
│  (Product pages, Landing pages)     │
└────────────┬────────────┬───────────┘
             │            │
    Guillotine GraphQL   Commerce API
             │            │
    ┌────────┴──┐   ┌─────┴──────┐
    │  Enonic   │   │   Medusa   │
    │  Content  │   │  Products  │
    │  Studio   │   │  + Orders  │
    └───────────┘   └────────────┘
```

Editorial content (hero sections, landing pages, promotional copy) lives in Enonic. Product catalog, inventory, and checkout logic live in the commerce backend. Next.js stitches them together.

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Editorial landing page built in Content Studio |
| `/products` | Product listing pulled from commerce API |
| `/products/[slug]` | Product detail page |
| `/collections/[slug]` | Collection landing page (editorial + products) |
| `/Blog/[slug]` | editory blog posts |


---

## Getting Started

### Prerequisites

- Next.js 16+
- Enonic XP 8
- Enonic CLI — `npm install -g @enonic/cli`

### 1. Clone the repo

```bash
git clone https://github.com/Archer-TECH-admin/instant-storefront.git
cd instant-storefront
```

### 2. Start Enonic locally

```bash
enonic sandbox start
enonic project deploy
```

### 3. Start the commerce backend

```bash
cd medusa-backend
npm install
medusa develop
```

### 4. Start the Next.js frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
/
├── enonic-app/          # Enonic XP application (content types, page templates)
├── frontend/            # Next.js app
│   ├── components/      # Reusable UI components
│   ├── pages/           # Next.js routes
│   └── lib/             # GraphQL queries, commerce API client
├── medusa-backend/      # Headless commerce backend
└── docs/                # Architecture notes and decisions
```

---

## Development Workflow

- Every feature starts as a **GitHub Issue** with a label (`feature`, `bug`, `docs`)
- Every issue gets its own **branch** named issue-<Issue Number> and a **pull request** before merging
- PR descriptions document decisions and any AI-assisted steps
- Project board: [GitHub Projects](../../projects)

---

## Internship Context

Built over 4 weeks at [Enonic AS](https://enonic.com) as part of an internship. The goal was to explore how Enonic fits into a composable commerce stack and produce a real, usable reference implementation.

**Intern:** Choose name
**Period:** 10/6/25 – 10/7/25?
**Mentor:** Thomas Sigdestad

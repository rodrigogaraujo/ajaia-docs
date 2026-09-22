# Architecture

Ajaia Docs is a small collaborative document editor. Timebox: 4 to 6 hours.
Goal: one coherent working slice, not Google Docs.

Diagrams are Mermaid. Rendered copies live in `diagrams/` as SVG and PNG.

## System

```mermaid
flowchart LR
    U[Browser] -->|HTTPS| N

    subgraph N[Netlify]
        P[proxy.ts<br/>cookie gate] --> PG[Next.js pages<br/>App Router]
        P --> API[API routes<br/>/api/documents, /api/import]
    end

    API -->|Prisma, pooled 6543| DB[(Supabase Postgres)]
    PG -->|Prisma| DB
    CLI[npm run db:push / db:seed] -->|direct 5432| DB
```

![system](diagrams/system.png)

- One deploy on Netlify holds the frontend and the backend. API routes run as Netlify Functions.
- The request gate only checks that the `uid` cookie exists. Every route re-checks access in the database.
- Two database URLs: pooled for the running app, direct for schema push and seed.

## Data model

```mermaid
erDiagram
    User ||--o{ Document : owns
    User ||--o{ DocumentShare : receives
    Document ||--o{ DocumentShare : "shared via (cascade delete)"

    User {
        string id PK
        string name
        string email UK
    }
    Document {
        string id PK
        string title
        text contentHtml
        string ownerId FK
        datetime createdAt
        datetime updatedAt
    }
    DocumentShare {
        string documentId PK, FK
        string userId PK, FK
        datetime createdAt
    }
```

![data-model](diagrams/data-model.png)

- Content is stored as sanitized HTML, not editor JSON. File import produces HTML, so one pipeline serves both paths.
- Access is binary: owner, or shared. Only the owner can delete and manage sharing.

## Opening a document

```mermaid
sequenceDiagram
    participant B as Browser
    participant P as proxy.ts
    participant R as GET /api/documents/:id
    participant A as canAccess (pure)
    participant D as Postgres

    B->>P: request with uid cookie
    P->>R: pass (cookie present)
    R->>D: load user, document, shares
    R->>A: canAccess(userId, document, shares)
    alt owner or shared
        A-->>R: true
        R-->>B: 200 document
    else no access or missing
        A-->>R: false
        R-->>B: 404 (same body, id is not revealed)
    end
```

![open-document](diagrams/open-document.png)

## AI-native workflow

```mermaid
flowchart LR
    ME[Me]

    subgraph BUILD[Builder session: Claude Code + OpenSpec]
        direction TB
        PR[propose] --> AP[apply] --> AR[archive]
    end

    subgraph REV[Reviewer session: Claude Code]
        direction TB
        RD[reads specs and code] --> LOG[AI_LOG.md]
    end

    subgraph VER[Verify after apply]
        direction TB
        T1[tsc]
        T2[Vitest unit tests]
        T3[Playwright e2e in Chromium]
    end

    subgraph MCP[MCP servers]
        direction TB
        SB[Supabase MCP<br/>tables, logs, advisors]
        NF[Netlify MCP<br/>deploy, build logs, env vars]
    end

    ME -->|prompts, one spec at a time| BUILD
    ME -->|decisions| REV
    BUILD -->|milestone reports| REV
    REV -->|findings, ready prompts| ME
    BUILD --> VER
    BUILD --> MCP
    REV -.->|read only| MCP
```

![ai-workflow](diagrams/ai-workflow.png)

- Two Claude Code sessions. One builds, one reviews. I decide what changes.
- OpenSpec keeps each change small: proposal, specs, tasks, then apply, then archive.
- AI_LOG.md records what I kept, changed and rejected.

## Delivery pipeline

```mermaid
flowchart TB
    S[Spec prompt] --> O[OpenSpec propose]
    O --> R{Review}
    R -->|adjust| O
    R -->|ok| I[Apply]
    I --> C[tsc + Vitest + Playwright]
    C -->|green| G[git commit on branch]
    G --> M[merge to main]
    M --> N[Netlify build<br/>prisma generate && next build]
    N --> L[Live URL]
    L --> Q[Smoke test: Alice → Bob → Carol]
```

![delivery-pipeline](diagrams/delivery-pipeline.png)

## Priorities and cuts

Built: create, rename, edit, autosave, reopen, rich text, sharing, file import, persistence, tests, deploy.

Cut on purpose: real auth, real-time editing, roles, comments, version history.

Next 2 to 4 hours: export to Markdown, presence indicator, per-document delete from the dashboard, signed session cookie.

# CLAUDE.md — Clarvoy (Open Source)

## Behavioral Guidelines

Guidelines to reduce common LLM coding mistakes. **Tradeoff:** These bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project Overview

Clarvoy is a governance decision-support platform implementing **System 2 Governance** for mission-critical decisions. It enforces epistemic rigor, eliminates noise in group judgments, and tracks decision quality over time. The primary domain is Pennsylvania non-profit organizations serving adults with intellectual disabilities and autism.

## Architecture

```
client/          → React frontend (Vite + TailwindCSS + shadcn/ui, dark theme)
server/          → Express.js backend
  auth/          → Passport local auth (bcrypt + express-session + connect-pg-simple)
  services/      → LLM, variance engine, document parser, file storage
  seed/          → Demo data seeding
shared/          → Shared types, schemas, and route definitions
  models/        → Drizzle ORM table definitions (auth.ts, chat.ts)
  schema.ts      → Re-exports models + decisions/judgments/comments/attachments/audit_logs/referenceClasses tables
  routes.ts      → Typed API route contracts (method, path, input/response schemas)
uploads/         → Local file storage directory
```

### Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS 3 + shadcn/ui (dark mode default)
- **Backend**: Express 5 on Node.js, single HTTP server serves both API and client
- **Database**: PostgreSQL via Drizzle ORM (`drizzle-orm` + `drizzle-zod`)
- **Auth**: Passport local strategy with bcrypt password hashing, express-session + connect-pg-simple
- **AI**: Multi-LLM streaming via OpenAI, Anthropic (Claude), and Google Gemini SDKs
- **Speech**: Web Speech API for voice-to-text input
- **File Storage**: Local filesystem (`./uploads/`) with multer multipart upload
- **Document Parsing**: `pdf-parse`, `mammoth`, `xlsx` for text extraction from uploads
- **Routing (client)**: `wouter` (not react-router)
- **State Management**: `@tanstack/react-query` for server state
- **Forms**: `react-hook-form` + `@hookform/resolvers` + `zod`
- **Charts**: `recharts` for bias heatmaps and variance visualizations
- **Animations**: `framer-motion`

## Database Schema

All tables defined in `shared/schema.ts` and `shared/models/`. Key tables:

| Table | Purpose |
|---|---|
| `users` | User profiles with email, username, passwordHash |
| `sessions` | Session storage for connect-pg-simple |
| `decisions` | Decision cases with status workflow: `draft → open → closed` |
| `judgments` | Blind inputs: score (1-10) + rationale per user per decision |
| `comments` | Discussion/debate thread per decision |
| `attachments` | File uploads with metadata, objectPath, and extractedText |
| `audit_logs` | Immutable action log (userId, action, entityType, entityId, details) |
| `reference_classes` | Statistical reference data for outside-view forecasting |
| `conversations` / `messages` | AI coaching chat history |

Insert schemas are generated via `drizzle-zod` and exported alongside types from `shared/schema.ts`. Use `InsertDecision`, `InsertJudgment`, etc. for validated inputs.

### Schema Migrations

Run `npm run db:push` (uses `drizzle-kit push`) to sync schema changes to the database. No migration files — schema is pushed directly.

## API Endpoints

All routes defined in `server/routes.ts`, with typed contracts in `shared/routes.ts`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/logout` | Destroy session |
| `GET` | `/api/auth/user` | Get current authenticated user |
| `GET/POST` | `/api/decisions` | List / create decisions |
| `GET/PUT/DELETE` | `/api/decisions/:id` | Single decision CRUD |
| `POST/GET` | `/api/decisions/:decisionId/judgments` | Submit / list blind judgments |
| `POST/GET` | `/api/decisions/:decisionId/comments` | Submit / list comments |
| `POST/GET` | `/api/decisions/:decisionId/attachments` | Upload / list file attachments |
| `GET` | `/api/attachments/:id/text` | Get extracted text from attachment |
| `DELETE` | `/api/attachments/:id` | Delete attachment |
| `POST` | `/api/uploads` | Upload file (multipart/form-data via multer) |
| `GET` | `/api/uploads/:fileName` | Serve uploaded file |
| `GET` | `/api/decisions/:decisionId/variance` | Noise analysis (variance engine) |
| `POST` | `/api/coaching/chat` | AI coaching chat (SSE streaming) |
| `GET` | `/api/coaching/providers` | List available LLM providers |
| `GET` | `/api/admin/audit-logs` | Audit log entries |
| `POST` | `/api/admin/seed-demo-data` | Seed PA demo scenarios |

Auth endpoints are registered via `server/auth/routes.ts`.

## Client Routes

| Path | Component | Auth |
|---|---|---|
| `/auth` | `AuthPage` | Public (login/register forms) |
| `/` | `Dashboard` | Protected |
| `/new` | `CreateDecision` | Protected |
| `/decisions/:id` | `DecisionDetail` | Protected |
| `/admin` | `AdminDashboard` | Protected |
| `/use-cases` | `UseCases` | Protected |

Protected routes use `<ProtectedRoute>` wrapper in `App.tsx` which redirects to `/auth` if unauthenticated.

## Key Services

### Variance Engine (`server/services/varianceEngine.ts`)
Calculates mean, standard deviation, coefficient of variation, and high-noise flag for judgment scores. Threshold default: stdDev > 1.5 = high noise.

### LLM Service (`server/services/llmService.ts`)
Unified streaming interface for OpenAI, Claude, and Gemini. All providers use SSE (`text/event-stream`). The coaching chat includes decision context, judgment variance data, and extracted attachment text in the system prompt.

### Document Parser (`server/services/documentParser.ts`)
Extracts text from uploaded PDFs, Word docs, Excel files, and PowerPoint presentations. Extracted text is stored in the `attachments.extractedText` column and included in AI coaching context.

### File Storage (`server/services/fileStorage.ts`)
Local filesystem storage in `./uploads/`. Files are saved with UUID filenames. The `FileStorageService` class provides `saveFile`, `readFile`, and `deleteFile` methods.

### Auth (`server/auth/localAuth.ts`)
Passport local strategy with bcrypt password hashing. Sessions stored in PostgreSQL via `connect-pg-simple`. User registration requires email, username, and password.

## Key Components

| Component | Location | Purpose |
|---|---|---|
| `Sidebar` | `client/src/components/Sidebar.tsx` | Main navigation sidebar |
| `AICoach` | `client/src/components/AICoach.tsx` | AI coaching chat with LLM provider selector |
| `MicrophoneButton` | `client/src/components/MicrophoneButton.tsx` | Reusable voice input (Web Speech API) |
| `FileAttachments` | `client/src/components/FileAttachments.tsx` | File upload/preview/delete (full and compact modes) |
| `BlindInputForm` | Used in `DecisionDetail` | Score + rationale submission form |

### Custom Hooks

- `use-auth.ts` — User authentication state (login/logout/register)
- `use-decisions.ts` — Decision CRUD mutations and queries
- `use-attachments.ts` — Attachment CRUD hooks
- `use-upload.ts` — FormData multipart upload hook (local filesystem)

## Conventions

### Code Style
- TypeScript throughout (strict mode, `tsconfig.json`)
- ESM modules (`"type": "module"` in package.json)
- Path aliases: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- Zod for runtime validation on both client and server
- All API handlers check `req.isAuthenticated()` for protected routes
- User ID extracted via `(req.user as any).id`

### UI / Design
- Dark theme is the default and only theme
- shadcn/ui components in `client/src/components/ui/`
- `lucide-react` for icons
- Font: uses `font-display` class for headings (display font)
- Color scheme: primary (indigo), accent (amber/gold), muted foreground for secondary text, `white/5` and `white/10` borders
- Responsive layout with fixed sidebar (64px / `w-64` / `ml-64`)

### AI Coaching Prompt
The AI Decision Coach system prompt is defined inline in `server/routes.ts`. It uses HTML formatting (`<b>`, `<i>`, `<br>`) instead of markdown. The coach persona is warm, encouraging, and focused on PA disability services governance. It references pre-mortem analysis, reference class forecasting, base rates, and adversarial debate.

### File Upload Flow
1. Client sends file as `multipart/form-data` to `POST /api/uploads`
2. Server saves file to `./uploads/` with UUID filename via multer
3. Server returns `{ fileName, objectPath, fileType, fileSize }`
4. Client creates an attachment record via `POST /api/decisions/:decisionId/attachments`
5. Server extracts text from parseable files and stores it in `attachments.extractedText`

Allowed MIME types: PDF, plain text, Word (.doc/.docx), PowerPoint (.ppt/.pptx), Excel (.xls/.xlsx), JPEG, PNG. Max size: 10MB.

### Demo Data
`server/seed/demoData.ts` seeds 8 PA-specific use case scenarios with reference class data, blind inputs, and bias detection examples. Demo decisions are marked with `isDemo: true`. Three demo reviewer users are created automatically with password `demo123`.

## Running the App

```bash
# 1. Copy .env.example to .env and fill in values
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Push schema to database
npm run db:push

# 4. Start development server
npm run dev

# Production
npm run build
npm run start
```

The server listens on `process.env.PORT` (default 5000) and serves both the API and the client from the same process.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Secret for session signing (required in production)
- `PORT` — Server port (default: 5000)
- `OPENAI_API_KEY` — OpenAI API key (for AI Coach)
- `ANTHROPIC_API_KEY` — Anthropic API key (for AI Coach)
- `GOOGLE_AI_API_KEY` — Google AI API key (for AI Coach)

At least one LLM API key is required for the AI Decision Coach feature.

## Domain Context

Clarvoy is purpose-built for PA non-profit disability services governance. Key domain concepts:

- **Blind Input Protocol**: Committee members submit independent scores and rationales without seeing peers' inputs to reduce groupthink
- **Noise Audit**: Statistical analysis (variance, stdDev, CV) of judgment scores to detect disagreement/noise
- **Reference Class Forecasting**: Outside-view data (e.g., "94 PA nonprofit housing projects averaged 1.28x cost overruns") to anchor decisions
- **Pre-Mortem Analysis**: Imagining failure scenarios before deciding
- **Epistemic Constitution**: The governance framework's guiding principles ("Laws" like Blind Input, Outside View, Cognitive Sovereignty)
- **PA-specific context**: HCBS waivers, DSP workforce, aging-out cliff, Supported Decision-Making, Medicaid restructuring risks

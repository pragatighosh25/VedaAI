# VedaAI — AI Assessment Creator

Full-stack application for teachers to create assignments, generate structured question papers with AI (Groq `llama-3.3-70b-versatile`), and view exam-style output with real-time progress.

## Architecture Overview

```
┌─────────────┐     REST      ┌──────────────┐     BullMQ     ┌─────────────┐
│  Next.js    │◄────────────►│ Express API  │──────────────►│   Worker    │
│  (Zustand)  │     WS        │  TypeScript  │               │  (Groq AI)  │
└─────────────┘               └──────┬───────┘               └──────┬──────┘
                                     │                              │
                              ┌──────┴──────┐                ┌──────┴──────┐
                              │   MongoDB   │                │    Redis    │
                              │ assignments │                │ queue/cache │
                              └─────────────┘                └─────────────┘
```

### Approach

1. **Frontend** collects assignment config (due date, question types, marks, optional file, instructions) with Zustand and client-side validation.
2. **API** persists the assignment in MongoDB and enqueues a BullMQ job.
3. **Worker** builds a structured prompt, calls Groq with `response_format: json_object`, parses output with **Zod**, stores validated JSON (never raw LLM text).
4. **WebSocket** pushes `job:progress`, `job:completed`, and `job:failed` events to the output page.
5. **Output UI** renders sections/questions from validated JSON with difficulty badges, student info lines, and optional PDF download.

### Key Design Decisions

| Concern | Solution |
|--------|----------|
| Raw LLM output | JSON-only + Zod validation + retry on invalid schema |
| Scalability | Queue/worker separation, Redis caching |
| Real-time UX | WebSocket subscriptions per assignment |
| State | Zustand for create form + generation progress |

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Zustand
- **Backend:** Express, TypeScript, MongoDB, Redis, BullMQ, WebSocket (`ws`)
- **AI:** Groq SDK — `llama-3.3-70b-versatile`

## Project Structure

```
veda/
├── frontend/          # Next.js app (Figma-matched UI)
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/     # AI, prompt, PDF
│   │   ├── queues/
│   │   ├── workers/
│   │   ├── socket/
│   │   └── validators/   # Zod schemas
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 20+
- Docker (for MongoDB + Redis)
- [Groq API key](https://console.groq.com/) (or use mock mode)

### 1. Infrastructure

```bash
docker compose up -d
```

### 2. Environment

**Backend** — create `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=http://localhost:3000

# Optional: run without Groq (deterministic mock paper)
# MOCK_AI=true
```

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### 3. Install & Run

```bash
npm install
npm run install:all

# Terminal 1 — API
npm run dev:api

# Terminal 2 — Worker (required for generation)
npm run dev:worker

# Terminal 3 — Frontend
npm run dev:web
```

Or from root (after `npm install` at root for `concurrently`):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register a new teacher account |
| POST | `/api/auth/login` | Login teacher and return JWT token |

---

### User / Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/profile` | Get logged-in teacher profile |
| PUT | `/api/users/profile` | Update teacher profile/settings |
| PUT | `/api/users/change-password` | Change teacher password |

---

### Assignments

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/assignments` | List logged-in user's assignments |
| POST | `/api/assignments` | Create + enqueue question paper generation (multipart) |
| GET | `/api/assignments/:id` | Get assignment details |
| GET | `/api/assignments/:id/paper` | Get validated generated question paper |
| GET | `/api/assignments/:id/pdf` | Download generated question paper PDF |
| POST | `/api/assignments/:id/regenerate` | Re-generate assignment question paper |
| DELETE | `/api/assignments/:id` | Delete assignment |

---

### Health Check

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API health status |

**WebSocket:** `ws://localhost:4000/ws?assignmentId=<id>`

## AI JSON Schema

```json
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "text": "Explain React hooks",
          "difficulty": "medium",
          "marks": 5
        }
      ]
    }
  ]
}
```

Difficulty values: `easy` | `medium` | `hard` (displayed as Easy / Moderate / Challenging).

## Features Implemented

- Assignment list (empty + filled states per Figma)
- Create assignment form with validation, file upload, steppers
- Zustand state management
- BullMQ background jobs + isolated worker
- WebSocket real-time progress
- Structured output page (exam paper layout)
- Difficulty badges
- Regenerate action
- PDF export (PDFKit)
- Redis result caching
- Skeleton + animated progress UI
- Responsive sidebar (mobile menu)

## Screens

1. **Assignments** — empty state / card grid with search
2. **Create Assignment** — upload, due date, question matrix, instructions
3. **Output** — dark frame, download PDF, structured paper + answer key

## Development Notes

- Always run the **worker** alongside the API; generation will not complete otherwise.
- Set `MOCK_AI=true` to demo UI without a Groq key.
- PDF and AI generation require a completed assignment with validated `questionPaper` in MongoDB.


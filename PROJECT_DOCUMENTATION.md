# VedaAI Developer Guide & Comprehensive System Documentation

Welcome to the **VedaAI Developer Guide**. This document is a complete, in-depth architectural and code-level walkthrough of the VedaAI project. It is designed to help you study the entire system thoroughly, understand how all components interact, and learn the internal details of its workflows.

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Data Models & Schema Relationships](#2-data-models--schema-relationships)
3. [Backend Architecture & Component Deep Dive](#3-backend-architecture--component-deep-dive)
4. [Frontend Architecture & Component Deep Dive](#4-frontend-architecture--component-deep-dive)
5. [End-to-End Workflows Visualized](#5-end-to-end-workflows-visualized)
6. [Setup, Environment & Debugging Guide](#6-setup-environment--debugging-guide)
7. [Developer Guidelines & Future Enhancements](#7-developer-guidelines--future-enhancements)

---

## 1. System Architecture Overview

VedaAI is a full-stack educational assistant application that empowers teachers to:
1. **Create structured, curriculum-aligned exam papers** from simple text prompts or by uploading source files (PDFs, images, or text documents).
2. **Discover educational resources** (video lectures, textbooks, articles, research papers) from external APIs (YouTube, Google Books, arXiv, Tavily) and bookmark them.
3. **Organize saved resources** into custom folders/collections.

The application leverages a robust queue-based worker model to process heavy LLM generation jobs in the background, keeping the user interface fast and responsive.

### Architectural Diagram

```
                              ┌──────────────────────────────────────────────────────────┐
                              │                    NEXT.JS CLIENT                       │
                              │ - Zustand State Management                               │
                              │ - Responsive Layouts (Figma-Matched)                     │
                              │ - WebSockets for real-time progress update               │
                              └─────────────────────────────┬────────────────────────────┘
                                                            │
                                                REST / HTTP │ WebSockets (ws)
                                                            ▼
                              ┌──────────────────────────────────────────────────────────┐
                              │                    EXPRESS API SERVER                    │
                              │ - JWT Auth Middleware                                    │
                              │ - File Extraction (Sharp + Tesseract OCR / PDF-Parse)    │
                              │ - Resource Search Router (External API aggregation)      │
                              └───────┬─────────────────────┬─────────────────────┬──────┘
                                      │                     │                     │
                                      ▼ (Mongoose)          ▼ (Enqueue Jobs)      ▼ (Cache read/write)
                              ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
                              │   MONGODB     │     │    REDIS      │     │    REDIS      │
                              │  - Users      │     │  (BullMQ)     │     │  (Caching)    │
                              │  - Assignments│     └───────┬───────┘     └───────────────┘
                              │  - Resources  │             │
                              │  - Collections│             │ (Dequeue Jobs)
                              └───────────────┘             ▼
                                                    ┌───────────────┐
                                                    │ BULLMQ WORKER │
                                                    │ - Prompt Build│
                                                    │ - Groq AI API │
                                                    │ - Zod Validation
                                                    │ - WebSocket   │
                                                    │   Broadcast   │
                                                    └───────────────┘
```

### Key Technology Stack & Modules

*   **Frontend Framework**: Next.js 15 (App Router, TypeScript, Tailwind CSS)
*   **Frontend State Management**: Zustand
*   **Backend Server**: Express (TypeScript, Node.js)
*   **Database**: MongoDB via Mongoose
*   **Job Queueing & Event Stream**: BullMQ + Redis + WebSockets (`ws` library)
*   **Text Extraction Engine**: `pdf-parse` (Node-safe PDF extractor), `tesseract.js` (OCR), `sharp` (image preprocessing)
*   **AI Model**: Groq SDK (`llama-3.3-70b-versatile` model for JSON-structured question paper generation)
*   **PDF Generation**: `pdfkit` (custom server-side exam paper template builder)
*   **Data Validation**: Zod (for request bodies and AI output schema validation)

---

## 2. Data Models & Schema Relationships

The backend represents information using four primary MongoDB schemas, structured in TypeScript under `backend/src/models`.

### 2.1 User Model
*   **Source File**: [User.ts](file:///d:/veda/backend/src/models/User.ts)
*   **Purpose**: Stores teacher profile information, authentication credentials, and school settings (school name, default subjects, classes).
*   **Schema Fields**:
    *   `name` (String, required): The teacher's full name.
    *   `email` (String, required, unique): The login email.
    *   `password` (String, required): Bcrypt hashed password.
    *   `avatar` (String): URL or base64 representation of the avatar.
    *   `schoolName` (String): The school name, injected automatically into generated PDFs.
    *   `subject` (String): Primary teaching subject.
    *   `className` (String): Primary class or grade level.

### 2.2 Assignment Model
*   **Source File**: [Assignment.ts](file:///d:/veda/backend/src/models/Assignment.ts)
*   **Purpose**: Manages the generated exam papers, user inputs, queue job progress, and final AI answers.
*   **Relationships**: Relates to the `User` model via a `user` field (ObjectId reference).
*   **Schema Fields**:
    *   `title` (String, required): Name of the assessment.
    *   `dueDate` (Date, required): Date by which the assignment is due.
    *   `questionTypes` (Array of `IQuestionType` sub-schemas): Specifies the format of requested questions (type, count, marks per question).
    *   `additionalInstructions` (String, optional): Teacher instructions passed to the AI prompt.
    *   `uploadedFileName` (String, optional): Original name of the uploaded source file.
    *   `uploadedFileText` (String, optional): Extracted text content from the uploaded document, used by the LLM as reference material.
    *   `status` (String enum: `pending`, `processing`, `completed`, `failed`): Current generation job state.
    *   `progress` (Number): Dynamic progress percentage (0 - 100).
    *   `errorMessage` (String, optional): Error messages populated if generation fails.
    *   `questionPaper` (Mixed, conforms to Zod `QuestionPaper` schema): The validated JSON question paper structure.
    *   `answerKey` (Array of Strings): Kept as an empty array (answer key generation is disabled).
    *   `totalQuestions` (Number): Total questions in the paper (computed from `questionTypes` array).
    *   `totalMarks` (Number): Total marks for the paper (computed).
    *   `timeAllowed` (String): Text representing duration of the test (e.g., "60 minutes").
    *   `user` (ObjectId, ref: "User", required): The owner of the assignment.

### 2.3 SavedResource Model
*   **Source File**: [SavedResource.ts](file:///d:/veda/backend/src/models/SavedResource.ts)
*   **Purpose**: Represents educational materials bookmarked by the teacher.
*   **Relationships**: Owned by a `User` (ObjectId reference).
*   **Schema Fields**:
    *   `user` (ObjectId, ref: "User", required): The user who saved this resource.
    *   `title` (String, required): Resource title.
    *   `description` (String): Short description or summary.
    *   `url` (String, required): Direct link to the reference material.
    *   `thumbnail` (String): Image preview URL.
    *   `publisher` (String): Channel or authors (e.g., "MIT OpenCourseWare", "arXiv").
    *   `type` (String enum: `video`, `book`, `article`, `paper`, required): Category of the resource.

### 2.4 Collection Model
*   **Source File**: [Collection.ts](file:///d:/veda/backend/src/models/Collection.ts)
*   **Purpose**: Folders or groupings created by teachers to organize saved resources.
*   **Relationships**: Relates to `User` (owner) and holds an array of `SavedResource` references.
*   **Schema Fields**:
    *   `user` (ObjectId, ref: "User", required): Owner of this collection.
    *   `name` (String, required): Custom folder name.
    *   `description` (String): Optional metadata (e.g., "Class 11 - Mechanics").
    *   `resources` (Array of ObjectIds, ref: "SavedResource"): List of saved resources belonging to this folder.

---

## 3. Backend Architecture & Component Deep Dive

The backend runs as a TypeScript Express server with modularized services.

### 3.1 Server Entrypoint
*   **Location**: [index.ts](file:///d:/veda/backend/src/index.ts)
*   **Functionality**:
    *   Initializes Express application and registers global middlewares (CORS settings, JSON payload size increases up to `5mb` to accommodate large base64 file uploads).
    *   Attaches major route handlers under `/api`.
    *   Spawns an HTTP server and binds a WebSocket Server (`ws`) at path `/ws`.
    *   Performs database connection via Mongoose ([mongo.ts](file:///d:/veda/backend/src/utils/mongo.ts)) and verifies Redis connections ([redis.ts](file:///d:/veda/backend/src/utils/redis.ts)).
    *   Conditionally starts the in-process **BullMQ worker** if `START_WORKER` environment variable is enabled.

### 3.2 Routes & Controllers
All HTTP endpoints are secured using a JSON Web Token (JWT) checking middleware ([authMiddleware.ts](file:///d:/veda/backend/src/middleware/authMiddleware.ts)).

*   **Auth Routes** ([authRoutes.ts](file:///d:/veda/backend/src/routes/authRoutes.ts) & [authController.ts](file:///d:/veda/backend/src/controllers/authController.ts)):
    *   `POST /api/auth/signup`: Registers teachers, hash password.
    *   `POST /api/auth/login`: Validates password and signs standard JWT token.
*   **User Routes** ([userRoutes.ts](file:///d:/veda/backend/src/routes/userRoutes.ts) & [userController.ts](file:///d:/veda/backend/src/controllers/userController.ts)):
    *   `GET /api/user/profile` and `PUT /api/user/profile`: Manages user avatar, subject settings, and school names.
    *   `PUT /api/user/change-password`: Changes account credentials safely.
*   **Assignment Routes** ([assignments.ts](file:///d:/veda/backend/src/routes/assignments.ts) & [assignmentController.ts](file:///d:/veda/backend/src/controllers/assignmentController.ts)):
    *   `GET /api/assignments`: Returns lists of assignments (excluding large texts for speed).
    *   `POST /api/assignments`: Creates record, triggers synchronous **File Extraction**, and enqueues background BullMQ job.
    *   `GET /api/assignments/:id/paper`: Checks if paper is generated and returns validated sections structure. Reads from Mongoose or Redis caching.
    *   `GET /api/assignments/:id/pdf`: Triggers server-side PDFKit compilation and streams response buffer.
    *   `POST /api/assignments/:id/regenerate`: Reset assignment status and re-enqueues job to BullMQ.
*   **Resource Routes** ([resourceRoutes.ts](file:///d:/veda/backend/src/routes/resourceRoutes.ts)):
    *   `GET /api/resources`: Aggregates educational resources, cached on Redis.
    *   `POST /api/resources/save`: Bookmark a resource.
    *   `GET /api/resources/saved` and `DELETE /api/resources/saved/:id`: Read/Delete saved bookmarks.
*   **Collection Routes** ([collectionRoutes.ts](file:///d:/veda/backend/src/routes/collectionRoutes.ts)):
    *   Manages folders, populates bookmarked resources, and updates array references dynamically.

### 3.3 File Extraction Service
*   **Location**: `backend/src/services/fileExtractionService.ts`
*   **Functionality**:
    Extracts text from files uploaded by teachers. Supports three primary modalities based on the MIME type:
    1.  **PDF Parsing**: Uses server-side library `pdf-parse` to extract clean text streams from document pages.
    2.  **Image OCR (JPEG/PNG)**: Processes image files via `sharp` (converts to grayscale to optimize OCR recognition rates) and passes the result to `tesseract.js` for text extraction. Safeguarded by a 30-second OCR timeout.
    3.  **Plain Text**: Decodes buffers directly via UTF-8 string decoding.
    *   **Safeguards**: Truncates extracted text to a maximum of **8,000 characters** before injection into prompt variables to avoid hitting AI token limits. If extraction fails, it falls back to using the filename in brackets as context to prevent system crashes.

### 3.4 Queueing & Background Workers (BullMQ + Redis)
VedaAI offloads question paper generation to a Redis-backed queue system.

```
                           ┌────────────────────────┐
                           │   POST /assignments    │
                           └───────────┬────────────┘
                                       │
                                       ▼
                         ┌────────────────────────────┐
                         │   Mongoose Model Save      │
                         │   status: "pending"        │
                         └───────────┬────────────┘
                                       │
                                       ▼ (enqueue)
                         ┌────────────────────────────┐
                         │     GENERATION_QUEUE       │
                         └───────────┬────────────┘
                                       │
                                       ▼ (BullMQ worker picks up)
                         ┌────────────────────────────┐
                         │  generationWorker.ts       │
                         │  - status: "processing"    │
                         │  - progress updates (10-80)│
                         └───────────┬────────────┘
                                       │
                                       ▼
                         ┌────────────────────────────┐
                         │    aiService.ts (Groq)     │
                         └───────────┬────────────┘
                                       │
                                       ▼ (Zod parse & Cache)
                         ┌────────────────────────────┐
                         │  - status: "completed"     │
                         │  - progress: 100           │
                         │  - ws broadcast event      │
                         └────────────────────────────┘
```

*   **Generation Queue** ([generationQueue.ts](file:///d:/veda/backend/src/queues/generationQueue.ts)):
    Defines `GENERATION_QUEUE` string and exports `enqueueGeneration(assignmentId)`. Retries jobs up to 3 times on failure with an exponential backoff of 2 seconds.
*   **Generation Worker** ([generationWorker.ts](file:///d:/veda/backend/src/workers/generationWorker.ts)):
    *   An independent class listening to BullMQ jobs.
    *   Updates MongoDB states and broadcasts progress percentages through WebSockets (`10%`, `30%`, `80%`, `100%`).
    *   Calls the `aiService` to generate the question paper, writes final objects (with an empty answer key array) to Mongoose, caches the paper on Redis, and notifies the WebSocket manager of job completion.
    *   **Stuck Job Recovery**: Includes `recoverPendingJobs()` at startup, which searches MongoDB for any assignments that remained in `"pending"` state during a server crash and automatically re-queues them.

### 3.5 AI Prompt Building & Validation
*   **Prompt Builder** ([promptBuilder.ts](file:///d:/veda/backend/src/services/promptBuilder.ts)):
    Constructs a detailed system/user instruction prompt for Groq. Instructs the LLM to model question papers after CBSE/NCERT standards, formats questions into logical sections matching the user's counts and marks, integrates teacher instruction overrides, and appends the uploaded text file as `"REFERENCE MATERIAL"` for contextual questions.
*   **AI Service** ([aiService.ts](file:///d:/veda/backend/src/services/aiService.ts)):
    *   Connects to Groq using `llama-3.3-70b-versatile` in `response_format: { type: "json_object" }` mode.
    *   Attempts to parse the result. If JSON parsing fails, it uses regular expressions to extract JSON blocks out of fences.
    *   **Zod Schema Validation**: Validates structure using the [questionPaperSchema.ts](file:///d:/veda/backend/src/validators/questionPaperSchema.ts) definitions.
    *   **Self-Healing / Retry Loop**: If Zod validation fails, the service performs a secondary auto-correct call to the model. It feeds the invalid schema errors and original text back to Groq with high temperature overrides, instructing it to fix the schema structure.
    *   **Mock Mode**: Includes support for `MOCK_AI=true` or missing keys, generating dummy mock exams immediately without API network calls.

### 3.6 WebSockets Real-Time Manager
*   **Location**: [socketManager.ts](file:///d:/veda/backend/src/socket/socketManager.ts)
*   **Functionality**:
    *   Maintains a memory map of open sockets keyed by `assignmentId`.
    *   Allows Next.js client components to subscribe to specific progress events (`job:progress`, `job:completed`, `job:failed`) by establishing a connection to `/ws?assignmentId=X&token=Y` during setup.
    *   Allows worker threads to broadcast JSON objects down to listeners immediately.

### 3.7 PDF Generation Service
*   **Location**: [pdfService.ts](file:///d:/veda/backend/src/services/pdfService.ts)
*   **Functionality**:
    *   Uses `pdfkit` to compile the question paper layout into a standard A4 print sheet.
    *   Draws school header details, subject, class/section markers, total marks, and student signature templates.
    *   Iterates through sections and prints ordered lists showing difficulty levels and question points inline.
    *   Outputs a binary Buffer stream which is piped to the client browser for direct downloads.

### 3.8 Resource Search Aggregation Service
*   **Location**: [resourceService.ts](file:///d:/veda/backend/src/services/resourceService.ts)
*   **Functionality**:
    Aggregates resource searches across multiple public endpoints in parallel:
    1.  **YouTube API**: Searches for video lectures using query extensions (e.g., `+ "educational lecture"`).
    2.  **Google Books API**: Searches for textbook literature.
    3.  **arXiv API**: Searches scientific databases by parsing XML feeds for abstracts and direct PDF links.
    4.  **Tavily Search API**: Searches articles and tutorials.
    *   **Context-Aware Fallback System**: If external APIs are blocked, keyless, or fail, `getFallbackResources(query)` generates query-relevant mock data for Computer Science topics (Binary Search Trees, Big O notation), Biology topics (Cellular respiration, mitochondria, Campbell biology), and dynamic fallbacks matching the user's custom queries.

---

## 4. Frontend Architecture & Component Deep Dive

The frontend is built on Next.js 15 App Router. The UI utilizes a Tailwind CSS design system with custom HSL variables located in [globals.css](file:///d:/veda/frontend/src/app/globals.css).

### 4.1 Client-Side State Management (Zustand)
Instead of lifting state through page routers, VedaAI leverages lightweight global Zustand stores.

*   **Form Store** (`useCreateFormStore` in [assignmentStore.ts](file:///d:/veda/frontend/src/store/assignmentStore.ts)):
    *   Tracks the creation wizard's current step (Step 1: Upload & Meta, Step 2: Question Configuration).
    *   Stores `title`, `dueDate`, uploaded `file` buffer references, and `additionalInstructions`.
    *   Maintains an array of `questionTypes` (e.g., Multiple Choice, Short Answer) with count and marks.
    *   Includes validation functions (`validate()`) and total calculation helpers (`getTotals()`).
*   **Generation Progress Store** (`useGenerationStore` in [assignmentStore.ts](file:///d:/veda/frontend/src/store/assignmentStore.ts)):
    *   Controls UI status during active generation. Tracks the numeric progress and current process state.

### 4.2 API Client & Validators
*   **API Wrapper**: [api.ts](file:///d:/veda/frontend/src/lib/api.ts) contains all fetch calls. Reads authorization tokens from browser `localStorage` and appends JWT headers automatically to outgoing calls. It also handles file upload serialization by formatting fields into `FormData`.
*   **Zod Schema Sync**: [validators.ts](file:///d:/veda/frontend/src/lib/validators.ts) contains client-side Zod validation schemas that mirror the backend database schemas. This ensures type safety and early failure checks before submitting details to API endpoints.

### 4.3 Key Pages & Interactive Components
*   **Create Assignment Page**:
    *   Rendered via `CreateAssignmentForm.tsx` ([CreateAssignmentForm.tsx](file:///d:/veda/frontend/src/components/assignments/CreateAssignmentForm.tsx)).
    *   Uses drag-and-drop file areas to trigger image/document uploads.
    *   Features a responsive steppers panel. Step 2 presents the question type grid where users can add rows, change question type types, adjust quantities, and change marks with custom stepper inputs ([StepperInput.tsx](file:///d:/veda/frontend/src/components/ui/StepperInput.tsx)).
*   **Library & Saved Resources Page** ([page.tsx](file:///d:/veda/frontend/src/app/library/page.tsx)):
    *   A central dashboard where saved bookmarks are listed and filtered by media type tabs (Videos, Articles, Books, Papers).
    *   Provides folder organization folders ("Collections"). Users can create new folders, add bookmarks to folders, and review resource count totals.
*   **Resource Discovery Search Page** ([page.tsx](file:///d:/veda/frontend/src/app/resource-discovery/page.tsx)):
    *   A visual educational search engine. Includes subject category dropdowns, target class filtering, and interactive search submission boxes.
    *   Results are parsed into horizontal carousels with custom cards for videos, books, papers, and articles. Clicking bookmark buttons toggles bookmark states dynamically.
*   **Output Viewer Screen**:
    *   Displays generation steps, loading progress, and logs using WebSocket notifications ([GenerationProgress.tsx](file:///d:/veda/frontend/src/components/output/GenerationProgress.tsx)).
    *   Once complete, renders the examination sheet mockup ([QuestionPaperView.tsx](file:///d:/veda/frontend/src/components/output/QuestionPaperView.tsx)) containing difficulty badges, instructions, student detail outlines, and download anchors linked to the backend PDF generator.

---

## 5. End-to-End Workflows Visualized

### 5.1 Assignment Creation & AI Generation Pipeline
Here is the step-by-step workflow that occurs when a teacher creates a new assignment with an uploaded document:

```
[Teacher UI] ──► Uploads file & selects question types (Zustand store)
     │
     ▼
[POST /api/assignments] ──► Extract text from file (PDF, OCR, Text) (fileExtractionService.ts)
     │
     ▼
[Save to Mongoose] ──► Status: "pending", stores extracted text in database (Assignment model)
     │
     ▼
[Enqueue Job] ──► Job enqueued to BullMQ Redis (generationQueue.ts)
     │
     ├──────────────────────────────────────────────┐
     ▼ (Asynchronous background processing)         ▼ (WebSocket connection)
[BullMQ Worker picks up]                        [Next.js Client]
     │                                              │
     ▼ (updates status to "processing")             │ Opens WebSocket connection to /ws
[Worker broadcasts progress: 10%, 30%] ──────────► Receive progress updates in real-time
     │                                              │
     ▼ (builds prompt + Groq API completion)        │ Show animated skeletons & progress bar
[Call Groq AI Service]                              │
     │                                              │
     ▼ (validates output schema via Zod)            │
[Zod Schema Check]                                  │
     │                                              │
     ├─► [FAIL] ──► [Auto-Correct Retry Call]       │
     │                   │                          │
     │                   ▼                          │
     └─► [PASS] ──► [Saves validated JSON]          │
                         │                          │
                         ▼                          │
[Worker broadcasts progress: 100%, "completed"] ───► Transition page state to show final paper
                         │                          │
                         ▼                          │
[Saves to Cache] ──► Caches paper in Redis ─────────► User can view, download PDF, or regenerate
```

### 5.2 Resource Discovery & Library Organization
Here is the workflow for searching, bookmarking, and organizing educational resources:

```
[Teacher UI] ──► Enters query (e.g. "Binary Trees") + Category + Class
     │
     ▼
[GET /api/resources] ──► Searches YouTube, Google Books, arXiv, & Tavily in parallel (resourceService.ts)
     │
     ├─► [Success] ──► Aggregates and returns results (cached in Redis)
     │
     └─► [API Fails/Keyless] ──► Generates context-aware mock resources
          │
          ▼
[Render Search Page] ──► Displays resources grouped by type in interactive carousels
     │
     ▼
[Click Bookmark] ──► POST /api/resources/save (saves bookmark to SavedResource collection)
     │
     ▼
[Go to Library] ──► GET /api/resources/saved (shows all saved bookmarked cards)
     │
     ▼
[Click Move] ──► Selects/Creates collection folder ──► POST /api/collections/:id/resources (associates bookmark)
```

---

## 6. Setup, Environment & Debugging Guide

### 6.1 System Prerequisites
*   Node.js 20+ installed.
*   Docker (for running database services).
*   A Groq API key (optional; the app runs in mock mode if `GROQ_API_KEY` is omitted).

### 6.2 Spin up Infrastructure (Database & Caching)
Run the following command at the root directory to spin up MongoDB and Redis in Docker containers:
```bash
docker compose up -d
```
*Verify that ports `27017` (MongoDB) and `6379` (Redis) are free on your machine before running.*

### 6.3 Environment Configuration Setup
Create the following environment files to hook up server endpoints:

#### Backend Config (`backend/.env`)
Create the file [backend/.env](file:///d:/veda/backend/.env) and populate it:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_veda_jwt_token_12345
FRONTEND_URL=http://localhost:3000

# AI Provider Configuration
GROQ_API_KEY=gsk_your_groq_api_key_here

# External Search Provider Keys (Optional: system uses fallback data if empty)
YOUTUBE_API_KEY=your_youtube_api_key
GOOGLE_BOOKS_API_KEY=your_books_key
TAVILY_API_KEY=tvly-your_tavily_key

# Developer Mode Options
MOCK_AI=false
START_WORKER=true
```

#### Frontend Config (`frontend/.env.local`)
Create the file [frontend/.env.local](file:///d:/veda/frontend/.env.local) and populate it:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### 6.4 Installation & Running Commands
Run these commands from the root directory to install dependencies and run all services in development mode:

```bash
# 1. Install root dependencies (concurrently, etc.)
npm install

# 2. Install dependencies for both backend and frontend subfolders
npm run install:all

# 3. Start API, Worker, and Next.js frontend concurrently
npm run dev
```

*Alternatively, you can run services individually in separate terminal sessions:*
*   **Backend API only**: Run `npm run dev:api` from root.
*   **BullMQ Generation Worker only**: Run `npm run dev:worker` from root (required to process queues).
*   **Next.js Frontend only**: Run `npm run dev:web` from root.

---

## 7. Developer Guidelines & Future Enhancements

### 7.1 Best Practices for Code Modifications
1.  **Strict Type Safety**: Always define schema fields and validation logic together. If you modify Mongoose fields in [Assignment.ts](file:///d:/veda/backend/src/models/Assignment.ts), verify that you update the matching validators in [validators.ts](file:///d:/veda/frontend/src/lib/validators.ts) and types in [types.ts](file:///d:/veda/frontend/src/lib/types.ts).
2.  **Isolated Worker Context**: Keep the background worker free from DOM integrations or user-session HTTP context. The worker should operate purely on data models and JSON streams.
3.  **Cache Invalidation**: When modifying or regenerating assignments, make sure to delete the cached Redis paper keys (`paper:${assignmentId}`) so the client fetches updated records.
4.  **Graceful Degradation**: Always provide fallbacks for external integrations (such as file extractors or external APIs) so that keyless configurations do not crash the application.

### 7.2 Core Areas for Extension
*   **Document Structure Extraction**: Update [fileExtractionService.ts](file:///d:/veda/backend/src/services/fileExtractionService.ts) to parse headers and tables inside files to provide better context to the LLM.
*   **Audio/Video transcription**: Add support for audio files by passing them to transcription services (e.g. Whisper API) to generate question papers based on lecture recordings.
*   **Direct Collection Share**: Add collaborative folders by introducing sharing settings in [Collection.ts](file:///d:/veda/backend/src/models/Collection.ts) and allowing multiple users to edit the same folder.
*   **Multilingual OCR**: Add language parameters to Tesseract settings to support image OCR text in languages other than English.

---
*VedaAI System Documentation — Prepared for developer study.*

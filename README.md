# SmartDocs AI

An AI-powered document management platform — upload business documents (PDF/DOCX/TXT) and get instant AI summaries, keyword extraction, and a chat interface that answers questions using Retrieval-Augmented Generation (RAG), grounded only in your document.

## Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + React Query + Zustand
- **Backend:** ASP.NET Core 8 Web API + C# + Entity Framework Core
- **Database:** PostgreSQL
- **Auth:** JWT + Refresh Tokens (ASP.NET Identity)
- **AI:** OpenAI API (`gpt-4o-mini` for chat/summaries, `text-embedding-3-small` for RAG)

## What's included in this starter
- Full auth flow: register, login, JWT + refresh token rotation
- Document upload with PDF/TXT text extraction
- AI summary + keyword extraction on upload
- Simple in-database RAG: chunking, embeddings, cosine-similarity retrieval, grounded Q&A
- React dashboard: upload, list documents, chat per document

## Prerequisites
- .NET 8 SDK
- Node.js 18+
- PostgreSQL (running locally or via Docker)
- An OpenAI API key

## Backend setup
```bash
cd server/SmartDocs.Api

# Install required NuGet packages (PdfPig for PDF text extraction)
dotnet add package UglyToad.PdfPig

# Restore everything
dotnet restore

# Update appsettings.json:
#   - ConnectionStrings:DefaultConnection -> your Postgres connection string
#   - Jwt:Key -> a random 32+ character secret
#   - OpenAI:ApiKey -> your OpenAI key
# (Better: use `dotnet user-secrets` instead of committing real keys)

# Create the database via EF Core migrations
dotnet tool install --global dotnet-ef   # if not already installed
dotnet ef migrations add InitialCreate
dotnet ef database update

dotnet run
```
The API will run on something like `http://localhost:5226` — match that port in `client/src/api/client.ts`.

## Frontend setup
```bash
cd client
npm install
npm run dev
```
Runs at `http://localhost:5173`.

## DOCX text extraction (not yet wired up)
Add `DocumentFormat.OpenXml` package and extract text from `document.xml` inside the docx zip. This is intentionally left as your first "extend the project" task — it's a good thing to mention in an interview.

## Roadmap (build in this order)

**Week 1** — Project setup, GitHub repo, EF Core models, Postgres running in Docker.

**Week 2** — Auth: register/login/refresh, protect routes, test with Swagger.

**Week 3** — Document upload + listing, file storage, dashboard UI.

**Week 4** — AI summary + keyword extraction wired to OpenAI, error handling, loading states.

**Week 5** — RAG chat: chunking, embeddings, retrieval, grounded answers (already scaffolded here — extend it).

**Week 6** — Categories, favorites, share links, admin view, simple analytics charts (Recharts).

**Week 7** — Docker (`Dockerfile` + `docker-compose.yml` for API + Postgres), Swagger polish, deploy frontend to Vercel, backend to Railway/Render/Azure, write the GitHub README with screenshots and an architecture diagram.

## Why this is a strong CV project for Lebanon's market
ASP.NET Core is heavily used by banks, insurance, and outsourcing/enterprise software companies operating in Lebanon and the wider Gulf region. Pairing it with a modern React frontend and a real OpenAI integration demonstrates both enterprise-stack competence (what local employers screen for) and AI fluency (what makes you stand out from other junior candidates).

## Commit message convention
```
feat(auth): JWT authentication with refresh tokens
feat(ai): document summarization via OpenAI
feat(rag): chunking + embedding + retrieval chat
fix(documents): handle empty PDF text extraction
refactor(db): normalize chunk/embedding schema
```

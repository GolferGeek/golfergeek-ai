# GolferGeek AI

*A mono-repo AI framework that lets micro-businesses automate work and lets students learn state-of-the-art LLM techniques in the same codebase.*

---

## Project Overview
GolferGeek AI combines a Dockerised NestJS back-end, Vue front-end, and a fleet of pluggable agents.  A concierge agent receives a task (for example *"draft a blog post"*) and hands it to a specialist agent that uses Retrieval-Augmented Generation (MongoDB + Elasticsearch) and secure function calls (MCP) to get the job done.  Users bring their own model/API keys, stored encrypted per account, while Auth0 handles authentication.

### Scope & Assumptions
* GolferGeek AI is an **internal toolbox** used by the GolferGeek team during consulting engagements and classroom instruction; it is **not** offered as a hosted SaaS.
* Clients receive the stack via a guided, consulting-led installation or as read-only reference material.
* Ongoing updates, patches, and SLAs are available only through separate service agreements.

## How You Can Use GolferGeek AI
1. **Consulting-Assisted Deployment** – Engage the GolferGeek team to install and tailor the stack inside your cloud environment.  
2. **Self-Hosted Starter Kit** – Clone this repo, run `docker compose up`, and keep all data on your own infra.  
3. **Fork & Extend / White-Label** – Rebrand or customise under the permissive licence while contributing fixes upstream.

## Tech Stack (Phase 0)
• NestJS (Typescript) API  
• Vue 3 front-end  
• MongoDB Atlas (documents + structured data)  
• Elasticsearch (vector search)  
• Auth0 (JWT auth)  
• Fly.io or Render container hosting  
• Docker Compose for local dev  

*Detailed high-level flow diagrams are available in* [`docs/architecture.md`](docs/architecture.md).

## Quick Start (Local Dev)
```bash
# 0. Prerequisites: Docker + Docker Compose installed

# 1. Clone the repo
$ git clone https://github.com/golfergeek/golfergeek-ai.git
$ cd golfergeek-ai

# 2. Copy sample environment and fill in secrets
$ cp .env.example .env
$ nano .env    # AUTH0_DOMAIN, MONGODB_URI, OPENAI_API_KEY (optional for admins)

# 3. Spin up everything
$ docker compose up --build

# 4. Visit the playground
# API:    http://localhost:3000/api/health
# Front:  http://localhost:8080
```

## Course Labs & Version Tags
See `docs/course-labs/` for step-by-step student exercises.  Major checkpoints: `v0.1` (scaffold) through `v1.0` (cloud deploy).

## Licence
MIT for the core framework.  Premium add-on agents live in a separate private repo.

## Community & Contributing
Issues and pull requests are welcome.  Please read `CONTRIBUTING.md` (coming soon) for code style, commit message guidelines, and the project's *teaching-first* philosophy.

---

*Last updated: May 2025* 
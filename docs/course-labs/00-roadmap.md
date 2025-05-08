# Course Labs Roadmap

This roadmap shows the **exact order** students will follow, the Git tag to check out, what they will see running, and which external services (if any) they configure in that lab.  Keep this file open while you work through the course.

| Lab | Git Tag | Main Goal | New Concepts / Services | Estimated Time |
|-----|---------|-----------|-------------------------|----------------|
| 0   | `v0.1`  | Clone repo & run scaffold | Turborepo basics, Docker Compose, API/Front-end health check | 30–45 min |
| 1   | `v0.2`  | Add local MongoDB + Elasticsearch for RAG | Intro to RAG, text vs. vector search | 60–90 min |
| 2   | `v0.2`  | Connect to **MongoDB Atlas (cloud)** | Free Atlas cluster, connection strings, least-privilege user | 45 min |
| 3   | `v0.3`  | Build Concierge router & stub Post-Writer agent | NestJS modules, dependency injection, routing logic | 90 min |
| 4   | `v0.4`  | Set up **Auth0** & per-user encrypted API keys | JWT flow, middleware, client-side key encryption | 1–2 hr |
| 5   | `v0.5`  | Finish Post-Writer MVP (writes to Atlas + queries ES Cloud) | Chain-of-thought prompts, RAG retrieval, Mongo schema | 2–3 hr |
| 6   | `v1.0`  | Deploy to **Fly.io** & run smoke tests in CI | Container hosting, secrets, GitHub Actions | 1 hr |

---

## Lab 0 – Clone & Run
1. `git clone https://github.com/golfergeek/golfergeek-ai.git`
2. `git checkout v0.1`
3. `cp .env.example .env` (no secrets needed yet)
4. `docker compose up --build`
5. Visit `http://localhost:8080` → "GolferGeek AI scaffold running".
6. `curl http://localhost:3000/api/health` → `{"status":"ok"}`

> **Troubleshooting:** If ports are busy, change the host-side ports in `docker-compose.yml` and re-run.

---

## Lab 1 – Local RAG Stack
Prerequisites: Lab 0 complete.

1. Stop Docker (`Ctrl-C`).
2. Uncomment the `mongo` and `es` services in `docker-compose.yml` (they're already in the file, just commented out for Lab 0).  
3. Run `docker compose up --build`.  
4. Verify Mongo shell: `docker exec -it mongo bash -c "mongosh --eval 'db.stats()'"`.  
5. Verify Elastic: `curl localhost:9200` → `{ "cluster_name": ... }`.
6. Read `docs/architecture.md` RAG section for theory.

---

## Lab 2 – MongoDB Atlas (Cloud)
Prerequisites: Lab 1.

1. Follow `docs/infra/mongo-atlas.md` to create a free cluster.  
2. Whitelist your IP or set temporary `0.0.0.0/0` during class.  
3. Add connection string to `.env` → `MONGODB_URI=`.  
4. Restart API (`docker compose up`) and confirm it still returns `/api/health`.

---

*(Labs 3–6 content is stubbed in headings within their own files.  As each tag is released, the lab doc will be updated.)*

---

*Last updated: May 2025* 
# Artemis — Autonomous Outbound Engine

**Artemis** is an advanced, AI-native B2B sales development system engineered to automate pipeline generation, market research, and high-conversion personalized outreach.

Built with a decoupled frontend/backend architecture, Artemis utilizes a Next.js 14 dashboard to interface with a Python FastAPI backend. A sequential multi-agent CrewAI pipeline executes deep-market analysis and generates multi-channel outbound playbooks in real time.

## 🧠 The Multi-Agent Pipeline

1. **Lead Intelligence:** Conducts deep-market discovery to identify and profile high-fit target accounts.
2. **Sales Strategist:** Analyzes target prospects for quality and suitability, identifying key growth signals and potential risk factors.
3. **Conversion Writer:** Crafts personalized, targeted outreach sequences optimized for maximum open rates and engagement across channels (Email and LinkedIn).

## 🛠️ Tech Stack

* **Frontend:** Next.js 14, React, Tailwind CSS
* **Backend:** Python, FastAPI
* **AI Orchestration:** CrewAI (Multi-Agent Sequential Pipeline)
* **Database & State:** Supabase (PostgreSQL, vector logging)

## 📂 Repository Structure

* `/backend` — Python FastAPI application, CrewAI agents, task configurations, and secure environment vaults.
* `/frontend` — Next.js 14 application dashboard, interactive parameter inputs, and real-time execution logs.

## 🔒 Security & Intellectual Property Note

> *Proprietary AI prompts, sales scoring rubrics, and multi-agent system instructions have been abstracted out of source. `backend/prompts.py` loads them at runtime from environment variables. See `backend/.env.example` for the public redaction structure.*

## 📜 License

Copyright (c) 2026 Siba Labs, LLC. All Rights Reserved.

This source code and accompanying documentation are provided strictly for technical portfolio demonstration, conceptual review, and recruitment evaluation purposes.

Permission is hereby granted to view and fork this repository for personal, non-commercial evaluation.

You may NOT use, modify, reproduce, distribute, or commercially deploy this software, its architecture, or its proprietary multi-agent orchestration logic without explicit, prior written permission from the copyright holder.

# API Metrics Dashboard

A fast dashboard app to track API usage across providers (OpenAI, Anthropic, OpenRouter, etc.).

## Features

- Total calls, input tokens, output tokens, and estimated cost
- Usage trend chart
- Cost distribution by provider
- Add/remove metric rows in a clean dashboard UI
- Mobile-first responsive layout

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Recharts

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy (Cloudflare Pages)

```bash
npx wrangler pages deploy dist --project-name=api-metrics-dashboard
```

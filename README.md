# Spinly Marketing

Système interne d'automation de contenu Instagram pour le compte @spinly.

## Stack

- Next.js 14 + TypeScript + Tailwind
- Supabase (DB + Storage + Auth)
- Claude API (Haiku) pour la génération
- Puppeteer pour le rendu visuel
- Meta Graph API pour la publication

## Dev local

```bash
npm install
npm run dev
```

Build (Node 22 obligatoire — Node 25 incompatible avec Next 14) :

```bash
npm run build:node22
```

## Phases

- [x] Phase 0 — Setup repo et fondations
- [ ] Phase 1 — DB + génération Claude + dashboard validation
- [ ] Phase 2 — Templates + Puppeteer + Storage
- [ ] Phase 3 — Meta Graph API + publication

## Owner

Lupo Antonucci — admin only.

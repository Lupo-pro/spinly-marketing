# Phase 19 — UI/UX Pro-Max Refonte (à utiliser plus tard)

> Spinly Marketing · Refonte UI/UX du studio admin selon l'audit ui-ux-pro-max.
> Lupo n'est pas développeur. Tu fais le maximum toi-même.
> Tu travailles dans le repo `spinly-marketing`. Phases 0-18 OK.
> Le webhook GitHub→Vercel est cassé : après commit, lance `vercel --prod`.

---

# Contexte

Phase 19 fait suite à un audit ui-ux-pro-max qui a identifié 14 problèmes
cross-cut (a11y, design system, mobile, refactor) répartis en 4 priorités.

**Effort total estimé : 6-7h** réparties en 4 phases.

Au début de la session, Lupo te dira quel scope il veut :
- "P0 seulement" (1.5h) — a11y critique
- "P0 + P1" (3.5h) — + design system propre
- "P0 + P1 + P2" (5h) — + UX polish
- "Tout" (7h) — scope complet

---

# 🚨 P0 — Critique a11y + bugs visuels (1.5h)

## P0.1 — Migrer 9 composants Tailwind-zinc vers SPINLY_BRAND (45 min)

Le studio a 2 design systems coexistants : SPINLY_BRAND inline (Phase 12.5+)
vs Tailwind zinc/emerald/rose (Phase 0-11). Aligner sur SPINLY_BRAND.

**Composants à migrer** :
1. `_components/RenderButton.tsx`
2. `_components/SlidesGrid.tsx`
3. `_components/SlidePreview.tsx`
4. `_components/DownloadZipButton.tsx`
5. `_components/MarkPublishedButton.tsx`
6. `_components/CaptionBlock.tsx`
7. `_components/DownloadSinglePngButton.tsx`
8. `_components/ScheduleButton.tsx`
9. `_components/PostActions.tsx`

Pour chacun : remplace les classes Tailwind par les tokens SPINLY_BRAND,
conserve la logique fonctionnelle stricte, vérifie visuellement.

## P0.2 — Focus rings WCAG (20 min)

Dans `app/globals.css` :

```css
*:focus-visible {
  outline: 2px solid #F59E2C;
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid #F59E2C;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transform: none !important;
  }
}
```

Vérifier que les boutons inline-style ne masquent pas le focus ring
(retirer `outline: none` éventuels).

## P0.3 — Aria-labels icon-only (10 min)

- `RefreshStatusButton` → `aria-label="Rafraîchir le statut"`
- `ResetStateButton` → `aria-label="Réinitialiser l'état"`
- `RefreshStatsButton` → `aria-label="Rafraîchir les stats"`
- Bouton fermer SlidePreview → `aria-label="Fermer la preview"`
- Bouton fermer modal éventuel → `aria-label="Fermer"`

## P0.4 — Tap targets 44pt min (5 min)

`PublishButton`, `PilotValidator footer` : ajouter `min-height: 44px`
sur les boutons concernés. Pour les liens text-decoration, augmenter
le padding vertical.

## P0.5 — Mobile responsive (20 min)

**Pilot grid** : 1.2fr/1fr → 1col <768px (CSS media query, pas window.innerWidth).
**Calendar** : grid 7 cols → liste verticale day-by-day <768px.

Utilise `<style jsx>` ou un fichier CSS dédié, pas inline conditional.

---

# 🎨 P1 — Cohérence + maintenabilité (2h)

## P1.1 — CSS vars (20 min)

Dans `app/globals.css`, expose les tokens SPINLY_BRAND en CSS vars :

```css
:root {
  /* Backgrounds */
  --spinly-bg-base: #0A0A0A;
  --spinly-bg-elevated: rgba(255, 255, 255, 0.03);
  --spinly-bg-elevated-hover: rgba(255, 255, 255, 0.05);
  --spinly-border-subtle: rgba(255, 255, 255, 0.06);
  --spinly-border-default: rgba(255, 255, 255, 0.1);
  
  /* Foreground */
  --spinly-fg-primary: #FFFFFF;
  --spinly-fg-muted: #888888;
  --spinly-fg-faded: #555555;
  
  /* Brand */
  --spinly-brand-yellow: #F5C842;
  --spinly-brand-orange: #F59E2C;
  --spinly-brand-red: #FF4500;
  --spinly-brand-pink: #E91E63;
  --spinly-gradient-primary: linear-gradient(95deg, #F5C842 0%, #F59E2C 22%, #E91E63 50%, #FF4500 75%, #FFA500 100%);
  --spinly-gradient-cta: linear-gradient(135deg, #F59E2C 0%, #FF4500 100%);
  
  /* Status */
  --spinly-success: #4ADE80;
  --spinly-success-bg: rgba(74, 222, 128, 0.1);
  --spinly-success-border: rgba(74, 222, 128, 0.3);
  --spinly-error: #EF4444;
  --spinly-error-bg: rgba(239, 68, 68, 0.1);
  --spinly-error-border: rgba(239, 68, 68, 0.3);
  --spinly-warning: #F59E2C;
  --spinly-info: #60A5FA;
  --spinly-info-bg: rgba(96, 165, 250, 0.1);
  --spinly-info-border: rgba(96, 165, 250, 0.3);
}
```

Update `_styles/brand.ts` pour qu'il consomme ces CSS vars via une fonction
helper. Maintien rétro-compat en exportant aussi les valeurs hardcodées.

## P1.2 — Primitive `<Button>` (30 min)

Crée `_components/ui/Button.tsx` :

```tsx
'use client'
import { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--spinly-gradient-cta)', color: '#FFFFFF', border: 'none' },
  secondary: { background: 'var(--spinly-bg-elevated)', color: 'var(--spinly-fg-primary)', border: '1px solid var(--spinly-border-default)' },
  ghost: { background: 'transparent', color: 'var(--spinly-fg-muted)', border: '1px solid transparent' },
  destructive: { background: 'var(--spinly-error-bg)', color: 'var(--spinly-error)', border: '1px solid var(--spinly-error-border)' },
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 10px', fontSize: 12, minHeight: 32 },
  md: { padding: '10px 16px', fontSize: 13, minHeight: 44 },
  lg: { padding: '16px 24px', fontSize: 16, minHeight: 56 },
}

export function Button({ children, onClick, variant = 'secondary', size = 'md', loading = false, icon, disabled = false, type = 'button', className, style, ariaLabel }: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button type={type} onClick={onClick} disabled={isDisabled} aria-label={ariaLabel} aria-busy={loading} className={className}
      style={{ ...VARIANT_STYLES[variant], ...SIZE_STYLES[size], borderRadius: 10, fontWeight: 600, cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.15s ease', ...style }}>
      {loading && <span aria-hidden>⏳</span>}
      {!loading && icon && <span aria-hidden>{icon}</span>}
      {children}
    </button>
  )
}
```

Remplace progressivement les boutons inline-styles par `<Button>`. Commence
par les CTAs principaux.

## P1.3 — Primitive `<StatusPill>` (15 min)

Crée `_components/ui/StatusPill.tsx` :

```tsx
type Status = 'draft' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'failed' | 'processing'

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: 'Draft', color: '#888', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  approved: { label: 'Approved', color: 'var(--spinly-success)', bg: 'var(--spinly-success-bg)', border: 'var(--spinly-success-border)' },
  scheduled: { label: 'Programmé', color: 'var(--spinly-info)', bg: 'var(--spinly-info-bg)', border: 'var(--spinly-info-border)' },
  published: { label: 'Publié', color: 'var(--spinly-success)', bg: 'var(--spinly-success-bg)', border: 'var(--spinly-success-border)' },
  rejected: { label: 'Rejeté', color: 'var(--spinly-error)', bg: 'var(--spinly-error-bg)', border: 'var(--spinly-error-border)' },
  failed: { label: 'Échec', color: 'var(--spinly-error)', bg: 'var(--spinly-error-bg)', border: 'var(--spinly-error-border)' },
  processing: { label: 'En cours', color: 'var(--spinly-warning)', bg: 'rgba(245,158,44,0.1)', border: 'rgba(245,158,44,0.3)' },
}

export function StatusPill({ status, customLabel }: { status: Status; customLabel?: string }) {
  const c = STATUS_CONFIG[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {customLabel || c.label}
    </span>
  )
}
```

Remplace les 5 duplications dans : PostCard, CalendarView, ValidationHeader,
PilotValidator, PublishButton.

## P1.4 — Primitive `<EmptyState>` (15 min)

Crée `_components/ui/EmptyState.tsx` :

```tsx
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  cta?: { label: string; onClick?: () => void; href?: string }
}

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--spinly-bg-elevated)', border: '1px dashed var(--spinly-border-default)', borderRadius: 14 }}>
      {icon && <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>{icon}</div>}
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--spinly-fg-primary)', margin: 0, marginBottom: 8 }}>{title}</h3>
      {description && <p style={{ fontSize: 13, color: 'var(--spinly-fg-muted)', margin: 0, marginBottom: cta ? 20 : 0, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>{description}</p>}
      {cta && (
        cta.href
          ? <a href={cta.href} style={{ display: 'inline-block', padding: '10px 18px', background: 'var(--spinly-bg-elevated-hover)', border: '1px solid var(--spinly-border-default)', borderRadius: 10, color: 'var(--spinly-fg-primary)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>{cta.label}</a>
          : <button onClick={cta.onClick} style={{ padding: '10px 18px', background: 'var(--spinly-bg-elevated-hover)', border: '1px solid var(--spinly-border-default)', borderRadius: 10, color: 'var(--spinly-fg-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{cta.label}</button>
      )}
    </div>
  )
}
```

Utilise dans : Stats (si totals.count === 0), Calendar (jour vide),
PilotValidator (no posts).

## P1.5 — Modal de confirmation branded (30 min)

Remplace `window.confirm()` (laid + cassé en français) par un modal stylé.

Crée `_components/ui/ConfirmModal.tsx` (voir code complet dans la version
détaillée). Utilisé dans : PublishButton Reset state, ContentStudioHeader
Generate Now.

```tsx
'use client'
import { ReactNode } from 'react'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', variant = 'default' }: ConfirmModalProps) {
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-title"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: 'var(--spinly-bg-base)', border: '1px solid var(--spinly-border-default)', borderRadius: 16, padding: 28, maxWidth: 440, width: '100%' }} onClick={e => e.stopPropagation()}>
        <h2 id="confirm-title" style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 13, color: 'var(--spinly-fg-muted)', margin: 0, marginBottom: 24, lineHeight: 1.5 }}>{description}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--spinly-bg-elevated)', border: '1px solid var(--spinly-border-default)', color: 'var(--spinly-fg-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, minHeight: 44 }}>{cancelLabel}</button>
          <button onClick={() => { onConfirm(); onClose() }} style={{ padding: '10px 16px', borderRadius: 10, background: variant === 'destructive' ? 'var(--spinly-error)' : 'var(--spinly-gradient-cta)', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 44 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
```

## P1.6 — Refactor PilotValidator (20 min)

Le fichier fait 651L. Sors :
- `PostPreview` (preview slide + caption)
- `StatsLine` (ligne emoji counters)
- `ToastStack` (système de toasts)
- `NoPostsScreen` (écran "tout validé !")

Dans `_components/PilotValidator/` avec un index.tsx qui re-exporte tout.
PilotValidator principal devient ~150L.

---

# ✨ P2 — UX polish (1.5h)

## P2.1 — Lucide pour icônes fonctionnelles (25 min)

```bash
npm install lucide-react
```

Remplace les emojis fonctionnels :
- ← → navigation : `<ArrowLeft />`, `<ArrowRight />`
- 🔄 refresh : `<RefreshCw />`
- ✕ fermer : `<X />`
- 🚀 launch : `<Rocket />`
- 📅 date picker : `<Calendar />`

**GARDE les emojis sémantiques** : 📷 🎴 📱 (content type), ✓ ✕ status,
❤️ 🔖 metrics. Ces emojis ont du sens.

## P2.2 — Number formatting (10 min)

Crée `_lib/format.ts` :

```ts
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    notation: n >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(n)
}
```

Utilise dans : GlobalStatsBar, TopPostsView. `12847` → `12,8 k`.

## P2.3 — État vide CTA Mode Pilot (5 min)

```tsx
const hasDrafts = draftsCount > 0
<Button variant={hasDrafts ? 'primary' : 'secondary'} disabled={!hasDrafts}>
  🚀 Mode Pilot {hasDrafts && `(${draftsCount})`}
</Button>
```

## P2.4 — Empty state Stats (10 min)

```tsx
{totals.count === 0 ? (
  <EmptyState icon="📊" title="Pas encore de stats" description="Les stats apparaissent 24h après le 1er post publié. Le cron tourne tous les jours à 9h Bogotá." />
) : (
  <GlobalStatsBar totals={totals} avgEngagement={avgEngagement} />
)}
```

## P2.5 — Filtre content type sur Stats (20 min)

Tabs `All / Carousels / Posts / Stories` qui filtrent via query param
`?type=carousel`. Code similaire au `ContentTypeFilter` du Content Studio.

## P2.6 — Sparkline 30 jours (30 min)

Composant SVG simple sur GlobalStatsBar :

```tsx
function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 40 }}>
      <polyline points={points} fill="none" stroke="var(--spinly-brand-orange)" strokeWidth="2" />
    </svg>
  )
}
```

Fetch les data via SQL query qui groupe `ig_post_stats.fetched_at` par jour.

## P2.7 — Pilot undo (15 min)

Bouton "↶ Annuler dernier" dans PilotValidator qui retire le dernier ID
du `processedIds` Set. Le post réapparaît dans la file (mais le serveur
l'a déjà processé donc il sera filtré → undo ne marche que pendant ~3 sec
avant que le serveur confirme).

Solution : cache le bouton dès que la response serveur arrive (timer 3s).

## P2.8 — Calendar passé en opacity 0.5 (5 min)

Si `pe_status === 'published'` ET `pilot_scheduled_at < now`, applique
`opacity: 0.5` sur la card.

---

# 🚀 P3 — Nice-to-have (2h)

## P3.1 — Keyboard shortcuts globaux (30 min)

Crée `_hooks/useGlobalShortcuts.tsx` avec :
- `G` Generate Now
- `R` Refresh
- `P` Pilot mode
- `S` Stats
- `C` Calendar

Ne déclenche pas dans inputs/textarea. Affiche panneau d'aide `?` en bas
à droite.

## P3.2 — Skeleton loaders (30 min)

Pendant `router.refresh()`, montre skeleton placeholders au lieu d'écran
vide. Crée `_components/ui/Skeleton.tsx` avec animation pulse.

## P3.3 — Light mode (45 min)

CSS vars de P1.1 sont en place. Ajoute :

```css
[data-theme="light"] {
  --spinly-bg-base: #FAFAFA;
  --spinly-bg-elevated: rgba(0, 0, 0, 0.04);
  --spinly-fg-primary: #0A0A0A;
  --spinly-fg-muted: #666666;
  /* ... */
}
```

Toggle dans le header (icône soleil/lune) qui set `data-theme` sur `<html>`.
Persiste dans `localStorage`.

## P3.4 — Toast accessibility (10 min)

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {toasts.map(t => /* ... */)}
</div>
```

---

# Per-screen fixes spécifiques

## /admin/instagram (Content Studio)
- Toggle "Voir les rejetés" → barre de filtre principale (pas en bas)
- "Compte & monitoring" aussi visible que "📊 Stats"
- CTA "🚀 Mode Pilot" en gris si 0 drafts

## /admin/instagram/pilot
- Stats line wrap correctement sur mobile (grid au lieu de flex)
- Inbox-zéro : feedback "Tu as validé 8 posts en 1m12s, gain : 6m48s"

## /admin/instagram/calendar
- Mobile : grid 7 cols → liste verticale
- Jour vide : "Approve another draft to fill this slot"
- Posts publiés passés : opacity 0.5

## /admin/instagram/stats
- Empty state si 0 posts publiés
- Filtre content type
- Différenciation Top engagement / Top reach (icône en haut de section)
- Sparkline 30j

## /admin/instagram/[id] (validation)
- Section "Publication manuelle" → SPINLY_BRAND tokens
- `<details><summary>` natif → composant Disclosure custom avec transition
- Caption textarea : focus ring + compteur de caractères + auto-resize

---

# Critères de validation

## P0 (a11y critique)
- [ ] 9 composants migrés vers SPINLY_BRAND
- [ ] Focus rings visibles au clavier Tab
- [ ] prefers-reduced-motion respecté
- [ ] Aria-labels sur boutons icon-only
- [ ] Tap targets ≥ 44pt
- [ ] Pilot + Calendar responsive <768px
- [ ] Build OK
- [ ] Lighthouse a11y > 95

## P1 (design system)
- [ ] CSS vars dans `:root`
- [ ] `<Button>` créé et utilisé 5+ endroits
- [ ] `<StatusPill>` créé et utilisé 5+ endroits
- [ ] `<EmptyState>` créé et utilisé
- [ ] `ConfirmModal` remplace `window.confirm()`
- [ ] PilotValidator refactoré

## P2 (UX polish)
- [ ] Lucide installé, 5+ icônes remplacées
- [ ] Number formatting sur stats
- [ ] Mode Pilot CTA "vide" si 0 drafts
- [ ] Empty state Stats
- [ ] Filtre content type
- [ ] Sparkline 30j
- [ ] Pilot undo
- [ ] Calendar passé opacity 0.5

## P3 (nice-to-have)
- [ ] Keyboard shortcuts
- [ ] Skeleton loaders
- [ ] Light mode toggle
- [ ] Toast aria-live

---

# Règles de comportement

- **Garde la rétro-compat** : ne casse pas les écrans existants
- **Test après chaque migration** : visualise sur localhost avant commit
- **Commit par phase** : 1 commit par P0/P1/P2/P3 pour revert facile
- **Build à chaque commit** : `PATH=/opt/homebrew/opt/node@22/bin:$PATH npx next build`
- **Push manuel** : `git push origin main` puis `vercel --prod` (workflow Lupo)
- **Si bloqué** : ne devine pas, demande à Lupo

---

# Récap pour Lupo

```
✅ Phase 19 — UI/UX Pro-Max [scope choisi] déployée

🎯 Ce qui a été fait selon le scope :
- P0 : a11y conforme WCAG AA, mobile responsive, parité visuelle
- P1 : vrai design system (CSS vars, primitives Button/StatusPill/EmptyState)
- P2 : icônes Lucide, formatage chiffres, undo Pilot, sparkline stats
- P3 : keyboard shortcuts, light mode, skeletons

📊 Effort réel : Xh (sur estimation totale 6-7h)

📋 Notes :
- Tous les composants conservent leur fonctionnalité
- Mobile testé sur viewport <768px
- Focus rings visibles au clavier
- ConfirmModal remplace les window.confirm() laids

⏭️ Prochaine session :
- [scope restant si tout n'a pas été fait]
- Ou attaque les vrais features business
```

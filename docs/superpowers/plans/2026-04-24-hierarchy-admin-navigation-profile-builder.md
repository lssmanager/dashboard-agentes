# Hierarchy-Driven Administration Navigation + Profile Builder Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make hierarchy node clicks always open Administration filtered by node, remove left-rail Agents Builder entry, and route edit (pencil) actions to Administration `tab=profile` where builder-like profile editing lives.

**Architecture:** Keep `Administration` as the single read/operate surface for any selected hierarchy node and use query params (`tab`, `node`) as canonical navigation state. Treat hierarchy actions separately: node click => Administration scoped view, plus button => create route in Agents Builder, pencil button => Administration profile tab scoped to same node. Update top header subtitle to show selected node short name (not workspace fallback).

**Tech Stack:** React, React Router, TypeScript, inline style UI system in `apps/web`, existing hierarchy context + studio routing helpers.

---

## File Structure

- Modify: `apps/web/src/components/ContextPanel.tsx`
  - Make node single-click navigate to Administration scoped by `node` and current/derived tab.
  - Add explicit pencil icon next to plus for each editable row.
  - Keep plus as create route; pencil as edit/profile route.
  - Compact row spacing / left guide usage to recover horizontal space.
- Modify: `apps/web/src/components/NavRail.tsx`
  - Remove `Agents Builder` surface item from left rail menu.
- Modify: `apps/web/src/components/Header.tsx`
  - Show selected node short label in subtitle for studio surfaces; remove hard dependency on `workspace.name` for this line.
- Modify: `apps/web/src/lib/studioRouting.ts`
  - Ensure helpers can generate Administration links with `tab=profile` and `node` consistently.
- Modify: `apps/web/src/layouts/MainLayout.tsx`
  - Keep top-level surface state coherent after removing left-rail builder entry.
- Optional Test/Smoke notes file (if present): `docs/PHASE4_NAVIGATION_SMOKE.md`.

---

### Task 1: Normalize Hierarchy Node Navigation to Administration

**Files:**
- Modify: `apps/web/src/components/ContextPanel.tsx`
- Modify: `apps/web/src/lib/studioRouting.ts`

- [ ] **Step 1: Write failing navigation expectation (manual smoke spec block in comments/doc)**

```md
Given selected node `agent:ops-coordinator`
When user single-clicks node row in hierarchy
Then URL becomes `/administration?tab=<active-or-overview>&node=agent%3Aops-coordinator`
And administration loads scoped breadcrumbs + tab content for that node.
```

- [ ] **Step 2: Run current app and verify current behavior mismatch**

Run: `npm run dev`
Expected: Node click currently routes some levels to `/entity-editor` or mixed behavior.

- [ ] **Step 3: Implement unified route mapping**

```ts
function routeForNode(node: HierarchyNode, selectedBuilderTab: AgencyBuilderTab): string {
  return buildStudioHref({
    surface: 'agency-builder',
    tab: selectedBuilderTab ?? 'overview',
    nodeKey: node.key,
  });
}
```

Also ensure click handlers (`onOpen`, row click route hooks) use this mapping for navigation intent.

- [ ] **Step 4: Verify navigation now always lands in Administration**

Run: `npm run dev`
Expected: Clicking agency/department/workspace/agent/subagent all open Administration with filtered node.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ContextPanel.tsx apps/web/src/lib/studioRouting.ts
git commit -m "feat(nav): unify hierarchy node click routing to administration scoped view"
```

---

### Task 2: Add Pencil Edit Action Next to Plus, Route to Profile Tab

**Files:**
- Modify: `apps/web/src/components/ContextPanel.tsx`

- [ ] **Step 1: Write failing interaction expectation**

```md
Given hierarchy row for `workspace:workspace-default`
When user clicks pencil icon
Then app routes to `/administration?tab=profile&node=workspace%3Aworkspace-default`.
```

- [ ] **Step 2: Verify current UI has only plus without explicit edit action**

Run: `npm run dev`
Expected: no pencil action adjacent to plus.

- [ ] **Step 3: Add pencil icon button and route helper**

```ts
import { Pencil } from 'lucide-react';

function editRouteForNode(node: HierarchyNode): string {
  return buildStudioHref({
    surface: 'agency-builder',
    tab: 'profile',
    nodeKey: node.key,
  });
}

<button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    go(editRouteForNode(node));
  }}
  title="Edit in Profile tab"
  aria-label="Edit in Profile tab"
>
  <Pencil size={12} />
</button>
```

- [ ] **Step 4: Keep plus semantics unchanged**

```ts
// plus remains create route
go(createAgentRouteForNode(node.key, tree.nodes));
```

- [ ] **Step 5: Verify pencil opens profile tab on every level row**

Run: `npm run dev`
Expected: pencil from any row opens `/administration?tab=profile&node=<same-node>`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ContextPanel.tsx
git commit -m "feat(hierarchy): add pencil edit action routing to administration profile tab"
```

---

### Task 3: Remove Left-Rail Agents Builder Entry

**Files:**
- Modify: `apps/web/src/components/NavRail.tsx`
- Modify: `apps/web/src/layouts/MainLayout.tsx`

- [ ] **Step 1: Write failing navigation expectation**

```md
Left rail main surfaces should be only Administration + Studio.
Agents Builder direct menu entry must not be visible.
```

- [ ] **Step 2: Remove entry from rail surface list**

```ts
const NAV = [
  { label: 'Administration', surface: 'agency-builder', Icon: Building2 },
  { label: 'Studio', surface: 'workspace-studio', Icon: Cpu },
];
```

- [ ] **Step 3: Verify keyboard shortcuts still valid and intentional**

- Keep `Alt+3` only if still intended for direct `/entity-editor` access.
- If no longer desired, remove and update shortcuts help text accordingly.

- [ ] **Step 4: Verify no dead layout toggles remain due to surface removal**

Run: `npm run dev`
Expected: Left rail has 2 product entries, navigation works, no broken active states.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/NavRail.tsx apps/web/src/layouts/MainLayout.tsx apps/web/src/components/ui/KeyboardShortcutsHelp.tsx
git commit -m "chore(nav): remove agents builder entry from left rail"
```

---

### Task 4: Top Header Subtitle Uses Selected Node Short Name

**Files:**
- Modify: `apps/web/src/components/Header.tsx`
- Modify: `apps/web/src/lib/HierarchyContext.tsx` (only if needed to expose short selected label)

- [ ] **Step 1: Write failing expectation**

```md
When node `department:marketing` is selected, top header subtitle should display `Marketing`.
When node `agent:ops-coordinator` is selected, subtitle should display `Operations Coordinator`.
```

- [ ] **Step 2: Use hierarchy-selected node label as primary subtitle source**

```ts
const { selectedNode } = useHierarchy();
const subtitle = selectedNode?.label ?? workspace?.name ?? 'No scope selected';
```

- [ ] **Step 3: Keep model chip optional and non-blocking**

```ts
const modelText = selectedNode?.meta ?? workspace?.defaultModel;
```

- [ ] **Step 4: Verify Administration + Studio + Entity Editor consistency**

Run: `npm run dev`
Expected: top subtitle always reflects selected node short name first.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/Header.tsx apps/web/src/lib/HierarchyContext.tsx
git commit -m "feat(header): show selected hierarchy node short name in subtitle"
```

---

### Task 5: Compact Hierarchy Layout and Improve Action Density

**Files:**
- Modify: `apps/web/src/components/ContextPanel.tsx`

- [ ] **Step 1: Write failing visual checklist**

```md
Hierarchy rows should consume less horizontal space.
Left indentation should be tighter.
Actions (+, pencil) should be grouped and aligned per row.
```

- [ ] **Step 2: Tighten spacing tokens and indentation math**

```ts
const indent = 6 + depth * 10; // instead of wider offset
row padding => `4px 6px 4px ${indent}px`
action button size => 16x16 compact
```

- [ ] **Step 3: Keep level guides readable without excessive offset**

```ts
child container marginLeft: 8,
paddingLeft: 6,
borderLeft: `1px dashed ...`
```

- [ ] **Step 4: Manual visual validation in dark theme**

Run: `npm run dev`
Expected: more compact tree, better scanability, action buttons visible without clipping.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ContextPanel.tsx
git commit -m "style(hierarchy): compact row spacing and align row actions"
```

---

### Task 6: Final Validation + Regression Check

**Files:**
- Modify: `docs/PHASE4_NAVIGATION_SMOKE.md` (create if missing)

- [ ] **Step 1: Run build/type checks**

Run: `npm run build`
Expected: successful build, no TypeScript errors.

- [ ] **Step 2: Manual smoke routes**

Run app and validate:
- `/administration?tab=overview&node=agency:...`
- click each hierarchy level row => stays in `/administration` with `node` filter.
- click pencil on each row => opens `/administration?tab=profile&node=...`
- click plus => opens `/entity-editor?mode=create&type=...`
- left rail shows no Agents Builder item.
- top subtitle shows selected short name (`Marketing`, `Contabilidad`, `Operations Coordinator`, etc.).

- [ ] **Step 3: Record evidence in smoke checklist**

```md
- [x] Unified node navigation to Administration
- [x] Pencil routes to Profile tab
- [x] Plus routes to create mode
- [x] Left rail cleaned
- [x] Header subtitle uses selected node short name
```

- [ ] **Step 4: Commit validation doc**

```bash
git add docs/PHASE4_NAVIGATION_SMOKE.md
git commit -m "docs: add phase4 navigation/profile tab smoke validation"
```

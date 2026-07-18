# Todo Service Client Implementation Plan

> **For agentic workers:** Execute milestone-by-milestone. Checkboxes track progress.

**Goal:** Full Todo Service client (member power kit + admin) with TanStack Query, HIG UI, form sheets.

**Spec:** `docs/superpowers/specs/2026-07-18-todo-service-client-design.md`

**Architecture:** `features/{todos,categories,tags,users}` api + queries → tabbed `(main)` screens → form sheet modal.

**Tech:** Expo Router 57, TanStack Query, Axios apiClient, HIG theme.

---

## Milestones

1. Types + APIs (todos, categories, tags, users)
2. Todos list core (infinite, create, toggle, delete)
3. Form sheet full fields
4. Power filters + multi-select + batch
5. Tabs: Todos | Profile | Admin
6. Admin CRUD screens
7. Verify tsc/lint

---

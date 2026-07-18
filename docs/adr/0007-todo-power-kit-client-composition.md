# Power-user todo kit via client composition

**Status:** accepted  
**Date:** 2026-07-18

v1 “power” features beyond basic CRUD are a **closed kit**: full field list/filters/sort/search/infinite scroll, multi-select (client-loop PATCH/DELETE), session-only filter chips, due-date **sectioning** of loaded items, and server batch `complete-all` / `delete-completed`. Explicitly **not** in v1: month calendar UI, persisted named filter presets, offline mutation queue.

**Why:** Backend has no multi-select or calendar APIs; unbounded “power user” scope thrash. Client composition on documented endpoints stays honest and shippable.

**Consequences:** Due sections only apply to currently loaded infinite-query pages; multi-select may issue many HTTP calls (allSettled + toast summary).

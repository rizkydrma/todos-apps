# Power-user todo kit via client composition

**Status:** accepted  
**Date:** 2026-07-18

v1 “power” features beyond basic CRUD are a **closed kit**: full field list/filters/sort/search/infinite scroll, session-only filter chips, due-date **sectioning** of loaded items, and per-item swipe complete/delete. Explicitly **not** in v1: multi-select, server batch APIs in the client, month calendar UI, persisted named filter presets, offline mutation queue.

**Why:** Keep the list UI simple; multi-select/batch added noise without product fit. Client composition on documented single-item endpoints stays honest and shippable.

**Consequences:** Due sections only apply to currently loaded infinite-query pages. Bulk ops (if ever needed) require a deliberate product revisit.

# Member + admin Todo Service client

**Status:** accepted  
**Date:** 2026-07-18

The mobile app implements both the **member** todo experience and **admin** surfaces (categories, tags, users), not member-only and not API-stubs-only.

**Why:** Product choice to use the full OpenAPI surface including admin mutations. Member-only would leave half the service unused; API-only would not deliver a usable product.

**Consequences:** Navigation must role-gate admin UI (`user.role === 'admin'`); non-admin never relies on client hide as security — server still returns 403.

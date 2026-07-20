# Cold start: single native splash hold until destination

**Status:** accepted  
**Date:** 2026-07-20

Cold start must show **one** branded native splash (Cold Start Hold) until Auth Bootstrap finishes **and** a Cold Start Destination is on screen (Login or Home todos). We reject a second JS layer that paints `splash.png` again, and we reject hiding the splash on auth status alone (that exposed white frames from empty stack / `/` redirect).

**Why:** Users saw splash → white → splash → white → destination. Root causes were stacked visuals (native + JS cover), early hide before destination mount, and an authenticated hop via root `index` Redirect. Contract from grilling: one hold, destination-gated hide, no entry hop, 15s bootstrap timeout → unauthenticated → Login.

**Considered:** (A) native splash only, hide when JS ready; (B) native hold until auth status; (C) native hold until destination path — chose **C** with timeout fail-open to Login. Also considered dual native+JS cover “stitched” as one — rejected because it reintroduced double art and races.

**Consequences:** Root authenticated entry must not rely on a visible `/` → todos Redirect; splash hide is keyed off pathname + status; Auth Bootstrap needs a 15s timeout; no `BootstrapCover` Image of splash art.

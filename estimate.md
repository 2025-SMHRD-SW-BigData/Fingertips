# Effort Estimate

All estimates are in focused developer hours and include implementation plus light testing. Assumes existing backend endpoints remain stable and no new backend work is required.

- Sidebar badges (live counts): 1–2h
  - Integrate real counts for Violations/Notifications in the sidebar using existing APIs.
  - Add event-based refresh (`alerts-updated`) and hide badges when zero.
  - Handle API failures gracefully (no crash, badge omitted or set to 0).

- Bell badge on MainpageTop: 0.5–1h
  - Mirror unread notifications count on the bell icon; verify accessibility label and refresh.
  - Note: Partially implemented; time is for polish/verification.

- Bell dropdown (unread preview): 3–5h
  - Clicking bell opens anchored dropdown listing recent unread notifications (5–10).
  - Outside click / Esc closes; keyboard focus managed; includes “View all” link.
  - Minimal styles to match current theme.

- Unread styling (bold) on Notifications page: 0.5–1h
  - Conditional row class for unread; instant style update after marking as read.

- Per-row “Mark as Read” button: 0–0.5h
  - Show only for unread; disable and show busy state while request is in-flight.
  - Note: Button exists; time is for verification/polish.

- PATCH on “Mark as Read”: 0–0.5h
  - Send PATCH to backend; update row state locally on success; handle errors.
  - Fire shared `alerts-updated` to sync sidebar/bell badges.

- QA and cross‑page sync polish: 1–2h
  - Validate counts update across Sidebar, MainpageTop, and Notifications.
  - Edge cases: no admin_id, zero results, network errors.

Total: 6–10 hours

Assumptions and Risks
- No new backend fields or endpoints required; using existing `getUnreadAlerts` and violations total source.
- Styling changes fit within current CSS structure; no design system overhaul.
- Accessibility and keyboard handling for dropdown kept to essentials.

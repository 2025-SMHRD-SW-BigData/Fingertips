## TODO

- [ ] Integrate the notification bubbles for "Violations" and "Notifications" in the sidebar to reflect real counts from the database.
  - Acceptance:
    - Sidebar badges render dynamic counts (no hardcoded numbers).
    - Violations count reflects backend source of truth (defined API).
    - Notifications count equals unread notifications for the current admin.
    - Badges auto-refresh when notifications are updated and hide when zero.
    - Gracefully handle API failures (no crash; badge omitted or set to 0).

- [ ] Display the same notification count bubble on the bell icon in the MainpageTop header.
  - Acceptance:
    - Bell badge mirrors unread notifications count used in the sidebar.
    - Updates in real time on notification changes/events.
    - Hidden when count is zero; accessible label announces the count.

- [ ] When the header's bell icon is clicked, it should open a dropdown list of unread notifications instead of navigating directly to the page.
  - Acceptance:
    - Clicking the bell toggles a dropdown anchored to the bell.
    - Dropdown lists recent unread notifications (e.g., top 5–10) with timestamps.
    - Clicking outside or pressing Esc closes the dropdown.
    - Includes a “View all” link to the full Notifications page.
    - No page navigation occurs on the bell itself.

- [ ] On the Notification page, style unread messages in bold.
  - Acceptance:
    - Rows without `read_at` render with bold font weight (or distinct style).
    - Read rows render with normal weight; styling updates immediately on state change.

- [ ] Add a "Mark as Read" button at the end of each row in the notifications table.
  - Acceptance:
    - Button appears only for unread rows; hidden or disabled for read rows.
    - While the PATCH is in-flight, the button shows a loading/disabled state.

- [ ] Clicking the "Mark as Read" button should send a PATCH request to the backend API to update the message's status.
  - Acceptance:
    - Sends PATCH to the defined endpoint (per-notification) and handles errors.
    - On success, the row updates in-place (`read_at` set, styling switches to read).
    - Sidebar/bell badges decrement accordingly (via shared state/event).

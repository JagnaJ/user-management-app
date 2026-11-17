# User Management roadmap

## Agreed direction

Replace the JSONPlaceholder demo with a tool for creating and managing your own user list. Add CSV import/export later.

## UMA-001 — Remove demo API and prepare local state

Branch: `refactor/UMA-001-remove-demo-api`.

Acceptance criteria:

- No JSONPlaceholder requests, API module, or Axios dependency.
- No asynchronous load action, request status, or error state in the users slice.
- Initial users list is empty; name, username, email, and phone filters remain.
- The table renders immediately and explains empty and filtered-empty states.
- Application tests and production build pass.

This milestone deliberately leaves the list empty; it does not claim that the user-management UI is finished.

## UMA-002 — Add a local user

Branch: `feature/UMA-002-add-user`.

- Require name, username, email, and phone; trim surrounding whitespace.
- Check basic email format and case-insensitive uniqueness of username/email.
- Allow international phone formats without a country-specific pattern.
- Assign a local numeric ID and append the user to Redux state.
- Clear form and filters after success so the new row is visible.
- Show accessible inline errors and focus the first invalid field.
- Clearly state that data is lost on reload; persistence is a separate feature.

## Next milestones

Add editing and deletion, defining deletion confirmation and the editing interaction. Decide whether and how to persist data across reloads.

## Later milestone — CSV import/export

After local management works, define CSV headers, encoding, invalid-row feedback, duplicate handling, and spreadsheet-formula safety. CSV is planned, not implemented.

## Continuing from an existing Codespace

The original planning session referred to this branch name, but only `main` was published when UMA-001 was resumed. Uncommitted or unpushed Codespace changes are not visible through the repository connection. Save and inspect those changes before switching branches or pulling; do not reset or overwrite them.

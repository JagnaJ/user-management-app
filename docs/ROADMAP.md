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

## UMA-003 — Edit a local user

Branch: `feature/UMA-003-edit-user`.

- Open a prefilled form using Edit in the Actions column.
- Share fields and validation with the add form.
- Allow unchanged username/email; reject duplicates belonging to other users.
- Save updates the existing record in place, retaining its ID.
- Cancel discards the draft without modifying Redux state.
- Keep filters unchanged; an edited row can stop matching the current filters.
- Focus the name field when editing starts and the table when editing ends.
- Keep one edit session open at a time. Data still resets on reload.

## Next milestones

Add deletion with confirmation. Decide whether and how to persist data across reloads.

## Later milestone — CSV import/export

After local management works, define CSV headers, encoding, invalid-row feedback, duplicate handling, and spreadsheet-formula safety. CSV is planned, not implemented.

## Continuing from an existing Codespace

The original planning session referred to this branch name, but only `main` was published when UMA-001 was resumed. Uncommitted or unpushed Codespace changes are not visible through the repository connection. Save and inspect those changes before switching branches or pulling; do not reset or overwrite them.

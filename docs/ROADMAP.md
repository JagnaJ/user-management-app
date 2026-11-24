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

## UMA-004 — Delete a local user

Branch: `feature/UMA-004-delete-user`.

- Show a Delete action on each row.
- Use the native browser confirmation prompt with the user's name and email.
- Cancel leaves the list and notification unchanged; confirmation removes only the selected ID.
- Keep filters and remaining records unchanged; return focus to the table.
- Show `User deleted` through the shared four-second notification.
- Disable deletion while editing to avoid discarding an open draft.
- No undo or persistence in this milestone.

## UMA-005 — Persist local users

Branch: `feature/UMA-005-persist-users`.

- Save the user list after changes under `user-management.users.v1`, with a versioned envelope.
- Restore validated records and IDs on startup; do not persist filters or drafts.
- Reject malformed records, duplicate IDs/usernames/emails, and unsupported versions as a whole.
- Preserve invalid stored data and pause saving for that session, with an alert.
- Keep CRUD usable when storage fails; warn about unsaved changes and retry writes on the next list change.
- Data belongs to this browser/device; clearing site data removes it. No cross-tab or cross-device synchronization.

## UMA-006 — Export users to CSV

Branch: `feature/UMA-006-export-csv`.

- Export all saved users regardless of filters; disable the button for an empty list.
- Download `users.csv` with `name,username,email,phone` headers and no internal IDs.
- Use UTF-8 BOM, comma delimiters, CRLF record separators, and quoted/escaped fields.
- Prefix formula-like values and all phone numbers with an apostrophe; document that CSV readers may display it literally.
- Keep the list, filters, and unsaved drafts unchanged; show an error if download initiation fails.

## UMA-007 — Import users from CSV

- Require UTF-8 comma-separated CSV with exact name,username,email,phone headers.
- Limit each file to 1 MB and 1,000 users; support BOM, quoting and multiline fields.
- Show validation results before confirmation; cancel leaves data unchanged.
- Reject the whole batch for invalid fields or duplicate username/email, including existing users.
- Revalidate against current state and append atomically with fresh IDs; clear filters and persist normally.
- Explicit opt-in reverses this app's protective export apostrophes; default preserves literal input.
- Show up to ten errors with nonblank CSV record numbers; no overwrite or partial import.

## Continuing from an existing Codespace

The original planning session referred to this branch name, but only `main` was published when UMA-001 was resumed. Uncommitted or unpushed Codespace changes are not visible through the repository connection. Save and inspect those changes before switching branches or pulling; do not reset or overwrite them.

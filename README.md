# User Management App

A React and TypeScript application for managing your own user list, with Redux Toolkit for local state.

## Current status — UMA-006

Create users with the Add user form and filter the local list by name, username, email, and phone. The app does not fetch demo records or require an API.

All four fields are required and trimmed. Email must have a valid basic format; username and email must be unique, ignoring case. Phone is required but not restricted to one country's format. IDs are assigned locally. After a successful addition, the form and table filters are cleared so the new row is visible.

Errors are displayed next to the fields and focus moves to the first invalid input. Successful additions, updates, and deletions share one status message: `User added`, `User updated`, or `User deleted`. The latest action replaces the previous message and starts a fresh four-second dismissal timer.

Use Edit beside a row to open a prefilled form. Save changes validates and updates the same record; Cancel discards the draft. The user keeps their ID and position in the list. Username/email checks exclude the record being edited. Filters remain unchanged after editing, so an updated row may no longer match them. Only one edit form can be open at a time.

Delete beside a row opens the browser confirmation prompt with the user’s name and email. Cancel keeps the record; confirming removes only that user. Filters stay unchanged, focus returns to the table, and the shared notice displays `User deleted` for four seconds. Deletion is disabled while an edit form is open. There is no undo.

Users are saved automatically in localStorage after adding, editing, or deleting and restored on reload. Only the user list is saved; filters and form drafts reset. Data stays in this browser on this device and is not synced or backed up. Clearing site data removes it.

Stored records are validated before loading. Invalid or unsupported data is preserved, saving is paused for that session, and an alert is shown. If browser storage is unavailable or full, the app keeps working in memory and shows a persistent warning. Failed writes are retried on the next list change. Use **Export all users (CSV)** to download `users.csv` containing all saved rows, regardless of table filters. The button is disabled when the list is empty. Unsaved form drafts are excluded. Columns: `name,username,email,phone`; internal IDs are omitted.

The file uses comma delimiters, UTF-8 with a BOM, quoted fields, and CRLF record separators. Quotes, commas, and line breaks in values are escaped. Formula-like values and all phone numbers receive a leading apostrophe to encourage spreadsheet text handling; some CSV readers display that apostrophe literally. When importing into Excel, select UTF-8, a comma delimiter, and Text columns to preserve phone formatting. This is a spreadsheet-oriented export, not a lossless backup format. CSV import is not implemented yet.

## Stack

- React 18 and TypeScript
- Redux Toolkit and React Redux
- CSS
- Create React App (react-scripts)
- React Testing Library and Jest

## Local development / Codespaces

```bash
git clone https://github.com/JagnaJ/user-management-app.git
cd user-management-app
npm ci
npm start
```

In Codespaces, open the forwarded development-server port (normally 3000). No API key or backend configuration is required.

## Checks

```bash
npm test -- --watchAll=false
npm run build
```

Tests cover the empty local state, the absence of a load action on mount, combined case-insensitive filtering, no-match feedback, and clearing filters.

## Roadmap

The agreed direction is to let users manage their own list, then add CSV import/export.

- [x] **UMA-001:** Remove the demo API and loading/error state; keep an empty Redux list and existing filters.
- [x] **UMA-002:** Add local users with validation and duplicate checks.
- [x] **UMA-003:** Edit local users with validation, duplicate checks, and cancel.
- [x] **UMA-004:** Delete local users after confirmation.
- [x] **UMA-005:** Persist validated users in browser storage.
- [x] **UMA-006:** Export all users to CSV.
- [ ] Add CSV import with validation and duplicate handling.

CSV field rules still need to be specified before implementation. See [docs/ROADMAP.md](docs/ROADMAP.md).

## License

See [LICENSE](LICENSE).

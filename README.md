# User Management App

A React and TypeScript application for managing your own user list, with Redux Toolkit for local state.

## Current status — UMA-003

Create users with the Add user form and filter the local list by name, username, email, and phone. The app does not fetch demo records or require an API.

All four fields are required and trimmed. Email must have a valid basic format; username and email must be unique, ignoring case. Phone is required but not restricted to one country's format. IDs are assigned locally. After a successful addition, the form and table filters are cleared so the new row is visible.

Errors are displayed next to the fields and focus moves to the first invalid input. Successful additions and updates share one status message: `User added` or `User updated`. The latest action replaces the previous message and starts a fresh four-second dismissal timer.

Use Edit beside a row to open a prefilled form. Save changes validates and updates the same record; Cancel discards the draft. The user keeps their ID and position in the list. Username/email checks exclude the record being edited. Filters remain unchanged after editing, so an updated row may no longer match them. Only one edit form can be open at a time.

Deletion, persistence, and CSV import/export are not implemented yet. Redux state is in memory and resets on reload; the form displays this limitation.

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
- [ ] Add deletion.
- [ ] Add CSV import/export after the local management flow is ready.

Persistence, deletion behavior, and CSV field rules still need to be specified before their implementation. See [docs/ROADMAP.md](docs/ROADMAP.md).

## License

See [LICENSE](LICENSE).

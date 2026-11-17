# User Management App

A React and TypeScript application for managing your own user list, with Redux Toolkit for local state.

## Current status — UMA-001

The app starts with an empty local list. It no longer fetches demo users from JSONPlaceholder or depends on a remote API. The table supports case-insensitive filtering by name, username, email, and phone, with separate messages for an empty list and no matching results.

User creation, editing, deletion, and persistence are not implemented yet. There is currently no UI to populate the list; this milestone prepares the state and table for those features. Redux state is in memory and resets on reload.

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
- [ ] Add local user creation, editing, and deletion.
- [ ] Add CSV import/export after the local management flow is ready.

Form validation, persistence, and CSV field rules still need to be specified before their implementation. See [docs/ROADMAP.md](docs/ROADMAP.md).

## License

See [LICENSE](LICENSE).

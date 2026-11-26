import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import userReducer from './redux/userSlice';
import { User } from './types';

function renderApp(users: User[] = [], openAdd = true) {
  const store = configureStore({
    reducer: { users: userReducer },
    preloadedState: {
      users: {
        users,
        filters: { name: '', username: '', email: '', phone: '' },
      },
    },
  });
  const dispatch = jest.spyOn(store, 'dispatch');
  render(<Provider store={store}><App /></Provider>);
  if (openAdd) fireEvent.click(screen.getByRole('button', { name: 'Add a user' }));
  return { store, dispatch };
}

test('starts with an empty local list without dispatching a data request', () => {
  const { store, dispatch } = renderApp();
  expect(screen.getByRole('heading', { name: 'User Management' })).toBeInTheDocument();
  expect(screen.getByText('No users yet.')).toBeInTheDocument();
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  expect(store.getState().users.users).toEqual([]);
  expect(dispatch).not.toHaveBeenCalled();
});

test('combines case-insensitive filters and restores rows when filters are cleared', () => {
  renderApp([
    { id: 1, name: 'Alice Smith', username: 'alice', email: 'alice@example.com', phone: '123' },
    { id: 2, name: 'Bob Smith', username: 'bob', email: 'bob@example.com', phone: '456' },
  ]);
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter by name' }), { target: { value: 'SMITH' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter by email' }), { target: { value: 'ALICE' } });
  expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter by phone' }), { target: { value: '999' } });
  expect(screen.getByText('No users match your filters.')).toBeInTheDocument();
  expect(screen.queryByText('No users yet.')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter by phone' }), { target: { value: '' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter by email' }), { target: { value: '' } });
  expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  expect(screen.getByText('Bob Smith')).toBeInTheDocument();
});

function fillUser(values = { Name: ' Alice Smith ', Username: ' alice ', Email: ' alice@example.com ', Phone: ' +48 123 456 789 ' }) {
  Object.entries(values).forEach(([name, value]) => {
    fireEvent.change(screen.getByRole('textbox', { name, exact: true }), { target: { value } });
  });
}

test('adds trimmed user data, clears filters, resets form and assigns distinct IDs', () => {
  const { store } = renderApp();
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter by name' }), { target: { value: 'hidden' } });
  fillUser();
  fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
  expect(screen.getByRole('cell', { name: 'Alice Smith' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('');
  expect(screen.getByRole('textbox', { name: 'Name', exact: true })).toHaveFocus();
  expect(screen.getByRole('textbox', { name: 'Filter by name' })).toHaveValue('');
  expect(store.getState().users.users[0]).toEqual({ id: 1, name: 'Alice Smith', username: 'alice', email: 'alice@example.com', phone: '+48 123 456 789' });
  fillUser({ Name: 'Bob', Username: 'bob', Email: 'bob@example.com', Phone: '456' });
  fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
  expect(store.getState().users.users.map(user => user.id)).toEqual([1, 2]);
});

test('blocks empty fields and invalid email and focuses the first error', () => {
  const { store } = renderApp();
  fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
  expect(screen.getAllByText('This field is required.')).toHaveLength(4);
  expect(screen.getByRole('textbox', { name: 'Name', exact: true })).toHaveFocus();
  fillUser({ Name: 'Alice', Username: 'alice', Email: 'invalid', Phone: '123' });
  fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
  expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Email', exact: true })).toHaveFocus();
  expect(store.getState().users.users).toHaveLength(0);
});

test('blocks case-insensitive duplicates, then allows correction', () => {
  const { store } = renderApp([{ id: 7, name: 'Existing', username: 'Alice', email: 'Alice@example.com', phone: '123' }]);
  fillUser();
  fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
  expect(screen.getByText('This username is already in use.')).toBeInTheDocument();
  expect(screen.getByText('This email is already in use.')).toBeInTheDocument();
  expect(store.getState().users.users).toHaveLength(1);
  fillUser({ Name: 'Another', Username: 'another', Email: 'another@example.com', Phone: '123' });
  fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
  expect(store.getState().users.users[1].id).toBe(8);
});


test('edits a user without changing their ID and allows unchanged unique fields', () => {
  const { store } = renderApp([{ id: 8, name: 'Alice', username: 'alice', email: 'alice@example.com', phone: '123' }]);
  fireEvent.click(screen.getByRole('button', { name: 'Edit Alice' }));
  const editor = within(screen.getByRole('region', { name: 'Edit Alice' }));
  expect(editor.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Alice');
  expect(editor.getByRole('textbox', { name: 'Name', exact: true })).toHaveFocus();
  fireEvent.change(editor.getByRole('textbox', { name: 'Name', exact: true }), { target: { value: ' Alice Updated ' } });
  fireEvent.click(editor.getByRole('button', { name: 'Save changes' }));
  expect(store.getState().users.users).toEqual([{ id: 8, name: 'Alice Updated', username: 'alice', email: 'alice@example.com', phone: '123' }]);
  expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Users' })).toHaveFocus();
});

test('cancel discards edits and reopening uses original values', () => {
  const original = { id: 1, name: 'Alice', username: 'alice', email: 'alice@example.com', phone: '123' };
  const { store } = renderApp([original]);
  fireEvent.click(screen.getByRole('button', { name: 'Edit Alice' }));
  let editor = within(screen.getByRole('region', { name: 'Edit Alice' }));
  fireEvent.change(editor.getByRole('textbox', { name: 'Name', exact: true }), { target: { value: 'Discard me' } });
  fireEvent.click(editor.getByRole('button', { name: 'Cancel' }));
  expect(store.getState().users.users).toEqual([original]);
  fireEvent.click(screen.getByRole('button', { name: 'Edit Alice' }));
  editor = within(screen.getByRole('region', { name: 'Edit Alice' }));
  expect(editor.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Alice');
});

test('editing rejects duplicates and invalid fields, and preserves filters after save', () => {
  const { store } = renderApp([
    { id: 1, name: 'Alice', username: 'alice', email: 'alice@example.com', phone: '123' },
    { id: 2, name: 'Bob', username: 'bob', email: 'bob@example.com', phone: '456' },
  ]);
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter by name' }), { target: { value: 'Alice' } });
  fireEvent.click(screen.getByRole('button', { name: 'Edit Alice' }));
  const editor = within(screen.getByRole('region', { name: 'Edit Alice' }));
  fireEvent.change(editor.getByRole('textbox', { name: 'Username', exact: true }), { target: { value: ' BOB ' } });
  fireEvent.change(editor.getByRole('textbox', { name: 'Email', exact: true }), { target: { value: 'bad-email' } });
  fireEvent.click(editor.getByRole('button', { name: 'Save changes' }));
  expect(editor.getByText('This username is already in use.')).toBeInTheDocument();
  expect(editor.getByText('Enter a valid email address.')).toBeInTheDocument();
  expect(store.getState().users.users[0].username).toBe('alice');
  fireEvent.change(editor.getByRole('textbox', { name: 'Username', exact: true }), { target: { value: 'alice' } });
  fireEvent.change(editor.getByRole('textbox', { name: 'Email', exact: true }), { target: { value: 'BOB@example.com' } });
  expect(editor.getByText('This email is already in use.')).toBeInTheDocument();
  fireEvent.change(editor.getByRole('textbox', { name: 'Email', exact: true }), { target: { value: 'alice@example.com' } });
  fireEvent.change(editor.getByRole('textbox', { name: 'Name', exact: true }), { target: { value: 'Carol' } });
  fireEvent.click(editor.getByRole('button', { name: 'Save changes' }));
  expect(store.getState().users.filters.name).toBe('Alice');
  expect(store.getState().users.users[0].name).toBe('Carol');
  expect(screen.getByText('No users match your filters.')).toBeInTheDocument();
});


test('uses one latest-action notification and resets its dismissal timer', () => {
  jest.useFakeTimers();
  try {
    renderApp();
    fillUser();
    fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(/^User added$/);
    act(() => { jest.advanceTimersByTime(3000); });
    fireEvent.click(screen.getByRole('button', { name: 'Edit Alice Smith' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('status')).toHaveTextContent(/^User updated$/);
    expect(screen.queryByText('User added')).not.toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(1000); });
    expect(screen.getByRole('status')).toHaveTextContent('User updated');
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  } finally {
    jest.useRealTimers();
  }
});

test('repeating the same action gets a full notification timeout', () => {
  jest.useFakeTimers();
  try {
    renderApp();
    fillUser();
    fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
    act(() => { jest.advanceTimersByTime(3000); });
    fillUser({ Name: 'Bob', Username: 'bob', Email: 'bob@example.com', Phone: '456' });
    fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
    act(() => { jest.advanceTimersByTime(1000); });
    expect(screen.getByRole('status')).toHaveTextContent(/^User added$/);
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  } finally {
    jest.useRealTimers();
  }
});


test('canceling deletion keeps the user; confirming removes only the selected user', () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
  try {
    const { store } = renderApp([
      { id: 1, name: 'Alice', username: 'alice', email: 'alice@example.com', phone: '123' },
      { id: 2, name: 'Bob', username: 'bob', email: 'bob@example.com', phone: '456' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Alice' }));
    expect(confirm).toHaveBeenCalledWith('Delete Alice (alice@example.com)? This cannot be undone.');
    expect(store.getState().users.users).toHaveLength(2);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Alice' }));
    expect(store.getState().users.users.map(user => user.id)).toEqual([2]);
    expect(screen.queryByRole('cell', { name: 'Alice' })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Bob' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/^User deleted$/);
    expect(screen.getByRole('table', { name: 'Users' })).toHaveFocus();
  } finally { confirm.mockRestore(); }
});

test('deleting the last filtered user preserves filters and dismisses the shared notice', () => {
  jest.useFakeTimers();
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  try {
    const { store } = renderApp();
    fillUser();
    fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Filter by name' }), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Alice Smith' }));
    expect(store.getState().users.users).toEqual([]);
    expect(store.getState().users.filters.name).toBe('Alice');
    expect(screen.getByText('No users yet.')).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(/^User deleted$/);
    act(() => { jest.advanceTimersByTime(4000); });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  } finally { confirm.mockRestore(); jest.useRealTimers(); }
});

test('deletion is disabled during editing and available again after cancel', () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  try {
    renderApp([{ id: 1, name: 'Alice', username: 'alice', email: 'alice@example.com', phone: '123' }]);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Alice' }));
    expect(screen.getByRole('button', { name: 'Delete Alice' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Alice' }));
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Delete Alice' })).toBeEnabled();
  } finally { confirm.mockRestore(); }
});

test('starts with the table and opens one panel at a time while preserving drafts', () => {
  renderApp([], false);
  expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('CSV file')).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Add a user' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Import CSV' }));
  expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('CSV file')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Add a user' }));
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Draft');
});

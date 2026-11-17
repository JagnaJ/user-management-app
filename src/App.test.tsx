import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import userReducer from './redux/userSlice';
import { User } from './types';

function renderApp(users: User[] = []) {
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

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

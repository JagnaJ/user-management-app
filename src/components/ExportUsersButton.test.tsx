import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import ExportUsersButton from './ExportUsersButton';
import userReducer, { addUser, setFilter } from '../redux/userSlice';
import { downloadUsersCsv } from '../utils/exportUsers';

jest.mock('../utils/exportUsers', () => ({ downloadUsersCsv: jest.fn() }));
const download = downloadUsersCsv as jest.Mock;
beforeEach(() => download.mockReset());

function setup(withUsers = false) {
  const store = configureStore({ reducer: { users: userReducer } });
  if (withUsers) {
    store.dispatch(addUser({ name: 'Jana', username: 'jana', email: 'jana@example.com', phone: '00123' }));
    store.dispatch(addUser({ name: 'Anna', username: 'anna', email: 'anna@example.com', phone: '+48 123' }));
  }
  store.dispatch(setFilter({ key: 'name', value: 'No matches' }));
  render(<Provider store={store}><ExportUsersButton /></Provider>);
  return store;
}

test('disables export when there are no users', () => {
  setup();
  expect(screen.getByRole('button', { name: 'Export all users (CSV)' })).toBeDisabled();
});

test('exports all records despite filters without modifying state', () => {
  const store = setup(true);
  const before = store.getState();
  fireEvent.click(screen.getByRole('button'));
  expect(download).toHaveBeenCalledWith(before.users.users);
  expect(download.mock.calls[0][0]).toHaveLength(2);
  expect(store.getState()).toBe(before);
});

test('shows a download failure and clears it on successful retry', () => {
  setup(true);
  download.mockImplementationOnce(() => { throw new Error('Unavailable'); });
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('alert')).toHaveTextContent('Could not start the download');
  fireEvent.click(screen.getByRole('button'));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

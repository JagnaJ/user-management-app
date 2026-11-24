import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createAppStore } from '../redux/store';
import { addUser } from '../redux/userSlice';
import ImportUsers from './ImportUsers';
const csv = 'name,username,email,phone\nJana,jana,jana@example.com,00123';
function setup() {
  const storage = { getItem: () => null, setItem: jest.fn() };
  const store = createAppStore(() => storage);
  const onImported = jest.fn();
  render(<Provider store={store}><ImportUsers onImported={onImported} /></Provider>);
  return { store, storage, onImported };
}
function upload(text = csv) {
  fireEvent.change(screen.getByLabelText('CSV file'), { target: { files: [new File([text], 'users.csv', { type: 'text/csv' })] } });
}
test('previews without writes, confirms once and persists the batch', async () => {
  const { store, storage, onImported } = setup();
  upload();
  await screen.findByText('1 user ready to add. Table filters will be cleared.');
  expect(store.getState().users.users).toHaveLength(0);
  expect(storage.setItem).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Import users' }));
  expect(store.getState().users.users[0].phone).toBe('00123');
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  expect(onImported).toHaveBeenCalledWith(1);
  expect(screen.getByRole('button', { name: 'Import users' })).toBeDisabled();
});
test('cancel discards preview; an invalid file changes no data', async () => {
  const { store } = setup(); upload();
  await screen.findByText('1 user ready to add. Table filters will be cleared.');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel import' }));
  expect(screen.queryByText(/ready to add/)).not.toBeInTheDocument();
  upload(csv + '\nBad,bad,invalid,123');
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Import users' })).toBeDisabled();
  expect(store.getState().users.users).toHaveLength(0);
});
test('revalidates preview when users change', async () => {
  const { store } = setup(); upload();
  await screen.findByText(/ready to add/);
  act(() => { store.dispatch(addUser({ name: 'Other', username: 'jana', email: 'other@example.com', phone: '1' })); });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Import users' })).toBeDisabled());
  expect(screen.getByRole('alert')).toHaveTextContent('username');
});
test('rejects oversized files before reading', () => {
  setup();
  fireEvent.change(screen.getByLabelText('CSV file'), { target: { files: [new File(['x'.repeat(1024 * 1024 + 1)], 'large.csv')] } });
  expect(screen.getByRole('alert')).toHaveTextContent('1 MB');
});
test('reports read failure and ignores a stale read after cancellation', () => {
  setup();
  const readers: FileReader[] = [];
  const read = jest.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) { readers.push(this); });
  try {
    upload();
    const first = readers[0];
    act(() => { first.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>); });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not read');
    upload();
    const second = readers[1];
    fireEvent.click(screen.getByRole('button', { name: 'Cancel import' }));
    Object.defineProperty(second, 'result', { value: csv });
    act(() => { second.onload?.(new ProgressEvent('load') as ProgressEvent<FileReader>); });
    expect(screen.queryByText(/ready to add/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import users' })).toBeDisabled();
  } finally { read.mockRestore(); }
});

test('lets users map arbitrary columns, preview and import', async () => {
  const { store } = setup();
  upload('Contact;Address;Account;Number;Company\nJana;jana@example.com;jana;00123;Acme');
  await screen.findByRole('table', { name: 'Column mapping' });
  expect(screen.getByLabelText('Delimiter')).toHaveValue(';');
  const fields = ['name', 'email', 'username', 'phone'];
  fields.forEach((field, index) => fireEvent.change(screen.getByLabelText(new RegExp(`Map column ${index + 1}:`)), { target: { value: field } }));
  expect(screen.getByRole('table', { name: 'Import preview' })).toHaveTextContent('00123');
  fireEvent.click(screen.getByRole('button', { name: 'Import users' }));
  expect(store.getState().users.users[0]).toEqual({ id: 1, name: 'Jana', email: 'jana@example.com', username: 'jana', phone: '00123' });
});
test('allows delimiter correction and blocks duplicate mappings', async () => {
  setup(); upload('name\tusername\temail\tphone\nJana\tjana\tjana@example.com\t00123');
  await screen.findByRole('table', { name: 'Column mapping' });
  expect(screen.getByLabelText('Delimiter')).toHaveValue('\t');
  fireEvent.change(screen.getByLabelText('Delimiter'), { target: { value: ',' } });
  expect(screen.getByRole('button', { name: 'Import users' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Delimiter'), { target: { value: '\t' } });
  expect(screen.getByRole('button', { name: 'Import users' })).toBeEnabled();
  fireEvent.change(screen.getByLabelText('Map column 2: username'), { target: { value: 'name' } });
  expect(screen.getByRole('button', { name: 'Import users' })).toBeDisabled();
});

import { createAppStore } from './store';
import { addUser, deleteUser, setFilter, updateUser } from './userSlice';
import { STORAGE_KEY, storageInvalid, storageUnavailable } from './userStorage';

const draft = { name: 'Jana', username: 'jana', email: 'jana@example.com', phone: '+48 123' };
function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => values.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => { values.set(key, value); }),
  };
}

test('restores additions, edits and deletions across fresh stores, but not filters', () => {
  const storage = memoryStorage();
  let store = createAppStore(() => storage);
  expect(storage.setItem).not.toHaveBeenCalled();
  store.dispatch(addUser(draft));
  store.dispatch(setFilter({ key: 'name', value: 'Jana' }));
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  store = createAppStore(() => storage);
  expect(store.getState().users.users).toEqual([{ id: 1, ...draft }]);
  expect(store.getState().users.filters.name).toBe('');
  store.dispatch(updateUser({ id: 1, ...draft, name: 'Updated' }));
  store = createAppStore(() => storage);
  expect(store.getState().users.users[0].name).toBe('Updated');
  store.dispatch(addUser({ ...draft, username: 'other', email: 'other@example.com' }));
  expect(store.getState().users.users[1].id).toBe(2);
  store.dispatch(deleteUser(1));
  store.dispatch(deleteUser(2));
  expect(createAppStore(() => storage).getState().users.users).toEqual([]);
});

test.each([
  '{broken',
  JSON.stringify({ version: 2, users: [] }),
  JSON.stringify({ version: 1, users: [{ id: 1, ...draft, phone: null }] }),
  JSON.stringify({ version: 1, users: [{ id: 1, ...draft, email: 'invalid' }] }),
  JSON.stringify({ version: 1, users: [{ id: 1, ...draft }, { id: 2, ...draft }] }),
  JSON.stringify({ version: 1, users: [{ id: 1, ...draft }, { id: 1, ...draft, username: 'other', email: 'other@example.com' }] }),
])('preserves invalid stored data without blocking CRUD: %s', raw => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, raw);
  storage.setItem.mockClear();
  const store = createAppStore(() => storage);
  expect(store.getState().persistence.error).toBe(storageInvalid);
  store.dispatch(addUser(draft));
  expect(store.getState().users.users).toHaveLength(1);
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(storage.getItem(STORAGE_KEY)).toBe(raw);
});

test('handles denied storage access and read errors without crashing', () => {
  const store = createAppStore(() => { throw new Error('Denied'); });
  store.dispatch(addUser(draft));
  expect(store.getState().users.users).toHaveLength(1);
  expect(store.getState().persistence.error).toBe(storageUnavailable);
  const storage = memoryStorage();
  storage.getItem.mockImplementation(() => { throw new Error('Read failed'); });
  expect(createAppStore(() => storage).getState().persistence.error).toBe(storageInvalid);
});

test('reports failed writes and retries with the complete list on the next change', () => {
  const storage = memoryStorage();
  storage.setItem.mockImplementationOnce(() => { throw new Error('Quota exceeded'); });
  const store = createAppStore(() => storage);
  store.dispatch(addUser(draft));
  expect(store.getState().persistence.error).toBe(storageUnavailable);
  store.dispatch(updateUser({ id: 1, ...draft, name: 'Updated' }));
  expect(store.getState().persistence.error).toBe('');
  expect(createAppStore(() => storage).getState().users.users[0].name).toBe('Updated');
});

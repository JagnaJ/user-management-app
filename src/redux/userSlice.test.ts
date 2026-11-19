import reducer, { addUser, updateUser, deleteUser } from './userSlice';

test('rejects invalid and duplicate additions even when dispatched outside the form', () => {
  const valid = { name: 'Alice', username: 'alice', email: 'alice@example.com', phone: '123' };
  const initial = reducer(undefined, { type: 'init' });
  expect(reducer(initial, addUser({ ...valid, name: '  ' }))).toEqual(initial);
  const populated = reducer(initial, addUser(valid));
  expect(reducer(populated, addUser({ ...valid, username: 'ALICE', email: 'other@example.com' }))).toEqual(populated);
  expect(reducer(populated, addUser({ ...valid, username: 'other', email: 'ALICE@example.com' }))).toEqual(populated);
});


test('update rejects missing IDs and invalid or duplicate data while preserving list order', () => {
  const alice = { name: 'Alice', username: 'alice', email: 'alice@example.com', phone: '123' };
  const bob = { name: 'Bob', username: 'bob', email: 'bob@example.com', phone: '456' };
  const state = reducer(reducer(undefined, addUser(alice)), addUser(bob));
  expect(reducer(state, updateUser({ id: 99, ...alice }))).toEqual(state);
  expect(reducer(state, updateUser({ id: 1, ...alice, phone: ' ' }))).toEqual(state);
  expect(reducer(state, updateUser({ id: 1, ...alice, email: 'BOB@example.com' }))).toEqual(state);
  const updated = reducer(state, updateUser({ id: 1, ...alice, name: ' Alice Updated ' }));
  expect(updated.users.map(user => user.id)).toEqual([1, 2]);
  expect(updated.users[0].name).toBe('Alice Updated');
  expect(updated.users[1]).toEqual(state.users[1]);
});


test('deletes only the specified ID and leaves filters and other records unchanged', () => {
  const user = { name: 'Same name', username: 'one', email: 'one@example.com', phone: '123' };
  const state = reducer(reducer(undefined, addUser(user)), addUser({ ...user, username: 'two', email: 'two@example.com' }));
  const filtered = { ...state, filters: { ...state.filters, name: 'Same' } };
  const deleted = reducer(filtered, deleteUser(1));
  expect(deleted.users).toEqual([filtered.users[1]]);
  expect(deleted.filters).toEqual(filtered.filters);
  expect(reducer(deleted, deleteUser(999))).toEqual(deleted);
  expect(reducer(deleted, deleteUser(2)).users).toEqual([]);
});

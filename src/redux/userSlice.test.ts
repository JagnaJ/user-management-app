import reducer, { addUser } from './userSlice';

test('rejects invalid and duplicate additions even when dispatched outside the form', () => {
  const valid = { name: 'Alice', username: 'alice', email: 'alice@example.com', phone: '123' };
  const initial = reducer(undefined, { type: 'init' });
  expect(reducer(initial, addUser({ ...valid, name: '  ' }))).toEqual(initial);
  const populated = reducer(initial, addUser(valid));
  expect(reducer(populated, addUser({ ...valid, username: 'ALICE', email: 'other@example.com' }))).toEqual(populated);
  expect(reducer(populated, addUser({ ...valid, username: 'other', email: 'ALICE@example.com' }))).toEqual(populated);
});

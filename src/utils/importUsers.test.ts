import { parseCsv, readUserDrafts, validateImport, detectDelimiter, readCsvTable, mapUserDrafts, suggestMapping } from './importUsers';
import { usersToCsv } from './exportUsers';
import reducer, { importUsers, setFilter } from '../redux/userSlice';
const draft = { name: 'Яна, "Jana"\nŁódź', username: 'jana', email: 'jana@example.com', phone: '+48 00123' };
const header = 'name,username,email,phone\n';
test('round trips app exports with explicit prefix removal', () => {
  const csv = usersToCsv([{ id: 9, ...draft }]);
  expect(readUserDrafts(csv, true)).toEqual([draft]);
  expect(readUserDrafts(csv, false)[0].phone).toBe("'+48 00123");
  expect(readUserDrafts(usersToCsv([{ id: 9, ...draft, name: '=1+1' }]), true)[0].name).toBe('=1+1');
});
test('supports BOM, blank lines, LF/CRLF, quoted commas and apostrophes', () => {
  expect(parseCsv('\uFEFFa,b\r\n\r\n"x,y","O\'Neil"\n')).toEqual([['a','b'],['x,y',"O'Neil"]]);
});
test.each(['"unfinished', 'a"b,c', '"a"x,b'])('rejects malformed quoting: %s', text => expect(() => parseCsv(text)).toThrow());
test.each(['', header, 'name;username;email;phone\n', header + 'a,b,c'])('rejects empty or malformed files: %s', text => expect(() => readUserDrafts(text, false)).toThrow());
test('rejects too many records', () => expect(() => readUserDrafts(header + 'a,b,c,d\n'.repeat(1001), false)).toThrow('1,000'));
test('reports required fields, invalid emails and duplicates inside file and existing list', () => {
  expect(validateImport([{ ...draft, email: 'bad', name: '' }], [])).toEqual(expect.arrayContaining([expect.stringContaining('name'), expect.stringContaining('email')]));
  expect(validateImport([draft, { ...draft, username: 'JANA' }], [])).toEqual(expect.arrayContaining([expect.stringContaining('Record 3, username')]));
  expect(validateImport([draft], [{ id: 1, ...draft }])).toHaveLength(2);
});
test('imports atomically, assigns unique IDs and clears filters only on success', () => {
  let state = reducer(undefined, importUsers([draft]));
  state = reducer(state, setFilter({ key: 'name', value: 'hidden' }));
  const second = { ...draft, username: 'other', email: 'other@example.com' };
  expect(reducer(state, importUsers([second, draft]))).toBe(state);
  const result = reducer(state, importUsers([second]));
  expect(result.users.map(user => user.id)).toEqual([1, 2]);
  expect(result.filters.name).toBe('');
  expect(reducer(state, importUsers([]))).toBe(state);
});
test('rejects a single quoted header field masquerading as four columns', () => {
  expect(() => readUserDrafts('"name,username,email,phone"\na,b,c,d', false)).toThrow('Check the delimiter');
});


test.each([',', ';', '\t'])('maps aliases and reordered columns with delimiter %s', separator => {
  const text = ['Email Address', 'Company', 'Telephone', 'Login', 'Full Name'].join(separator) + '\n' + ['jana@example.com', 'Acme', '00123', 'jana', 'Jana'].join(separator);
  expect(detectDelimiter(text)).toBe(separator);
  expect(readUserDrafts(text, false)).toEqual([{ name: 'Jana', username: 'jana', email: 'jana@example.com', phone: '00123' }]);
});
test('maps unknown headers manually and rejects duplicate or missing targets', () => {
  const table = readCsvTable('A,B,C,D,E\njana@example.com,00123,Jana,jana,ignored', ',');
  expect(suggestMapping(table.header)).toEqual(['', '', '', '', '']);
  expect(mapUserDrafts(table, ['email', 'phone', 'name', 'username', ''], false)[0].name).toBe('Jana');
  expect(() => mapUserDrafts(table, ['email', 'phone', 'name', 'username', 'name'], false)).toThrow('exactly one');
  expect(() => mapUserDrafts(table, ['email', 'phone', '', 'username', ''], false)).toThrow('name');
});
test('ignores delimiters inside quoted headers and handles ambiguous aliases conservatively', () => {
  expect(detectDelimiter('"Company, Inc";Email;Phone\n')).toBe(';');
  expect(suggestMapping(['Name', 'Full Name', 'EMAIL', 'Phone Number', 'User_name'])).toEqual(['name', '', 'email', 'phone', 'username']);
});

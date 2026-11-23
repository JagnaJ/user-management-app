import { downloadUsersCsv, usersToCsv } from './exportUsers';

const user = { id: 7, name: 'Яна, "Jana"\nŁódź', username: 'jana', email: 'jana@example.com', phone: '+48 00123' };

test('exports ordered columns, UTF-8 marker, escaped content and text phone without IDs', () => {
  expect(usersToCsv([user])).toBe('\uFEFFname,username,email,phone\r\n"Яна, ""Jana""\nŁódź","jana","jana@example.com","\'+48 00123"\r\n');
  expect(usersToCsv([])).toBe('\uFEFFname,username,email,phone\r\n');
});

test.each(['=1+1', '+1+1', '-1+1', '@SUM(A1)', '  =1+1', '\ttext', '\rtext', '\ntext'])('prefixes formula-like or control-prefixed values: %s', name => {
  expect(usersToCsv([{ ...user, name }])).toContain(`"'${name}"`);
});

test('retains leading zeros in phone text without mutating records', () => {
  const value = Object.freeze({ ...user, phone: '001234' });
  expect(usersToCsv([value])).toContain('"\'001234"');
  expect(value.phone).toBe('001234');
});

test('initiates a named CSV download and releases its URL after a delay', () => {
  jest.useFakeTimers();
  URL.createObjectURL = jest.fn(() => 'blob:test');
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe('users.csv');
    expect(this.href).toBe('blob:test');
    expect(this.isConnected).toBe(true);
  });
  try {
    downloadUsersCsv([user]);
    expect(click).toHaveBeenCalledTimes(1);
    expect((URL.createObjectURL as jest.Mock).mock.calls[0][0].type).toBe('text/csv;charset=utf-8;');
    expect(document.querySelector('a[download]')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  } finally {
    click.mockRestore();
    jest.useRealTimers();
  }
});

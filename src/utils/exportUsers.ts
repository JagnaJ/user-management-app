import { User } from '../types';

function csvCell(value: string, forceText = false): string {
  // Prefix formula-like values and phone numbers so spreadsheets treat them as text.
  // Ignore leading control characters when checking for a formula prefix.
  // eslint-disable-next-line no-control-regex
  const text = forceText || /^[\s\u0000-\u001f]*[=+@-]/u.test(value) || /^[\t\r\n]/.test(value)
    ? `'${value}` : value;
  return `"${text.replace(/"/g, '""')}"`;
}

export function usersToCsv(users: User[]): string {
  const rows = users.map(user => [
    csvCell(user.name), csvCell(user.username), csvCell(user.email), csvCell(user.phone, true),
  ].join(','));
  return '\uFEFF' + ['name,username,email,phone', ...rows].join('\r\n') + '\r\n';
}

export function downloadUsersCsv(users: User[]): void {
  const blob = new Blob([usersToCsv(users)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  try {
    link.href = url;
    link.download = 'users.csv';
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Give the browser time to start consuming the download before releasing its URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

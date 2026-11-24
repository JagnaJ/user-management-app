import { User } from '../types';
import { normalizeUser, UserDraft, validateUser } from './userValidation';

export const MAX_CSV_BYTES = 1024 * 1024;
export const MAX_IMPORT_USERS = 1000;

// CSV records may contain quoted commas, escaped quotes and embedded newlines.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false, closed = false;
  const input = text.replace(/^\uFEFF/, '');
  const finish = () => {
    row.push(cell);
    if (!(row.length === 1 && row[0].trim() === '')) rows.push(row);
    if (rows.length > MAX_IMPORT_USERS + 1) throw new Error('Import at most 1,000 users at a time.');
    row = []; cell = ''; closed = false;
  };
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
      } else cell += char;
    } else if (char === ',') {
      row.push(cell); cell = ''; closed = false;
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      finish();
    } else if (char === '"' && cell === '' && !closed) {
      quoted = true;
    } else {
      if (closed || char === '"') throw new Error('Invalid CSV quoting. Check the file and try again.');
      cell += char;
    }
  }
  if (quoted) throw new Error('A quoted CSV field is not closed.');
  if (cell || row.length || closed) finish();
  return rows;
}

export function readUserDrafts(text: string, fromAppExport: boolean): UserDraft[] {
  const [header, ...rows] = parseCsv(text);
  if (!header || header.length !== 4 || header.join(',') !== 'name,username,email,phone') {
    throw new Error('Expected columns in this order: name,username,email,phone. Use a comma-separated CSV file.');
  }
  if (!rows.length) throw new Error('The CSV file contains no users.');
  return rows.map((row, index) => {
    if (row.length !== 4) throw new Error(`Record ${index + 2}: expected four fields.`);
    const values = row.map((value, field) => {
      if (!fromAppExport || !value.startsWith("'")) return value;
      const rest = value.slice(1);
      // Reverse only prefixes inserted by this app's export, when explicitly requested.
      // eslint-disable-next-line no-control-regex
      return field === 3 || /^[\s\u0000-\u001f]*[=+@-]/u.test(rest) || /^[\t\r\n]/.test(rest) ? rest : value;
    });
    return normalizeUser({ name: values[0], username: values[1], email: values[2], phone: values[3] });
  });
}

export function validateImport(drafts: UserDraft[], existing: User[]): string[] {
  const errors: string[] = [];
  if (!drafts.length || drafts.length > MAX_IMPORT_USERS) return ['Import between 1 and 1,000 users.'];
  let id = existing.reduce((max, user) => Math.max(max, user.id), 0);
  if (!Number.isSafeInteger(id + drafts.length) || id + drafts.length >= Number.MAX_SAFE_INTEGER) return ['Cannot assign more user IDs.'];
  const seen = [...existing];
  drafts.forEach((draft, index) => {
    const issues = validateUser(draft, seen);
    Object.entries(issues).forEach(([field, message]) => errors.push(`Record ${index + 2}, ${field}: ${message}`));
    seen.push({ id: ++id, ...normalizeUser(draft) });
  });
  return errors;
}

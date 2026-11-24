import { User } from '../types';
import { normalizeUser, UserDraft, userFields, validateUser } from './userValidation';

export const MAX_CSV_BYTES = 1024 * 1024;
export const MAX_IMPORT_USERS = 1000;

// CSV records may contain quoted commas, escaped quotes and embedded newlines.
export function parseCsv(text: string, delimiter = ','): string[][] {
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
    } else if (char === delimiter) {
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

export type ColumnMapping = (keyof UserDraft | '')[];
export type CsvTable = { header: string[]; rows: string[][] };

export function detectDelimiter(text: string): string {
  // Count separators in the first record, outside quoted fields.
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted) {
      if (char === '\r' || char === '\n') break;
      if (char in counts) counts[char]++;
    }
  }
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}

export function readCsvTable(text: string, delimiter: string): CsvTable {
  const [header, ...rows] = parseCsv(text, delimiter);
  if (!header || !rows.length) throw new Error('The CSV file must contain a header and at least one user.');
  rows.forEach((row, index) => {
    if (row.length !== header.length) throw new Error(`Record ${index + 2}: expected ${header.length} fields, found ${row.length}. Check the delimiter.`);
  });
  return { header, rows };
}

export function suggestMapping(header: string[]): ColumnMapping {
  const aliases: Record<keyof UserDraft, string[]> = {
    name: ['name', 'fullname', 'contactname'],
    username: ['username', 'login', 'userlogin', 'handle'],
    email: ['email', 'emailaddress', 'mail'],
    phone: ['phone', 'telephone', 'phonenumber', 'mobile', 'mobilephone'],
  };
  const used = new Set<string>();
  return header.map(label => {
    const key = label.trim().toLowerCase().replace(/[\s_-]/g, '');
    const field = userFields.find(field => aliases[field].includes(key) && !used.has(field));
    if (field) used.add(field);
    return field ?? '';
  });
}

export function mapUserDrafts(table: CsvTable, mapping: ColumnMapping, fromAppExport: boolean): UserDraft[] {
  for (const field of userFields) {
    if (mapping.filter(value => value === field).length !== 1) throw new Error(`Map exactly one column to ${field}.`);
  }
  if (mapping.length !== table.header.length) throw new Error('Check the column mapping.');
  return table.rows.map(row => {
    const draft: UserDraft = { name: '', username: '', email: '', phone: '' };
    mapping.forEach((field, index) => {
      if (!field) return;
      let value = row[index];
      if (fromAppExport && value.startsWith("'")) {
        const rest = value.slice(1);
        // eslint-disable-next-line no-control-regex
        if (field === 'phone' || /^[\s\u0000-\u001f]*[=+@-]/u.test(rest) || /^[\t\r\n]/.test(rest)) value = rest;
      }
      draft[field] = value;
    });
    return normalizeUser(draft);
  });
}

export function readUserDrafts(text: string, fromAppExport: boolean): UserDraft[] {
  const table = readCsvTable(text, detectDelimiter(text));
  return mapUserDrafts(table, suggestMapping(table.header), fromAppExport);
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

import { User } from '../types';
import { normalizeUser, userFields, validateUser } from '../utils/userValidation';

export const STORAGE_KEY = 'user-management.users.v1';
export type UserStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const storageUnavailable = 'Changes could not be saved in this browser. They may be lost when you reload.';
export const storageInvalid = 'Saved users could not be loaded. Saving is paused to protect the existing data.';

export function loadUsers(storage: UserStorage): User[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 || !('users' in data) || !Array.isArray(data.users)) {
    throw new Error('Invalid saved users');
  }
  const users: User[] = [];
  for (const entry of data.users) {
    if (!entry || typeof entry !== 'object' || !Number.isSafeInteger(entry.id) || entry.id <= 0 || entry.id >= Number.MAX_SAFE_INTEGER || userFields.some(field => typeof entry[field] !== 'string')) {
      throw new Error('Invalid saved user');
    }
    const draft = normalizeUser(entry);
    if (users.some(user => user.id === entry.id) || Object.keys(validateUser(draft, users)).length) {
      throw new Error('Invalid or duplicate saved user');
    }
    users.push({ id: entry.id, ...draft });
  }
  return users;
}

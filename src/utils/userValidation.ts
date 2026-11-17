import { User } from '../types';

export type UserDraft = Omit<User, 'id'>;
export type UserErrors = Partial<Record<keyof UserDraft, string>>;
export const emptyDraft: UserDraft = { name: '', username: '', email: '', phone: '' };
export const userFields: (keyof UserDraft)[] = ['name', 'username', 'email', 'phone'];

export function normalizeUser(draft: UserDraft): UserDraft {
  return { name: draft.name.trim(), username: draft.username.trim(), email: draft.email.trim(), phone: draft.phone.trim() };
}

export function validateUser(draft: UserDraft, users: User[]): UserErrors {
  const value = normalizeUser(draft);
  const errors: UserErrors = {};
  userFields.forEach(field => {
    if (!value[field]) errors[field] = 'This field is required.';
  });
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.email = 'Enter a valid email address.';
  for (const field of ['username', 'email'] as const) {
    if (value[field] && users.some(user => user[field].trim().toLowerCase() === value[field].toLowerCase())) {
      errors[field] = `This ${field} is already in use.`;
    }
  }
  return errors;
}

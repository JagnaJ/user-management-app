import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { User } from '../types';
import { addUser, updateUser } from '../redux/userSlice';
import { emptyDraft, normalizeUser, UserDraft, userFields, validateUser } from '../utils/userValidation';
import '../styles/AddUserForm.css';

const labels: Record<keyof UserDraft, string> = { name: 'Name', username: 'Username', email: 'Email', phone: 'Phone' };

interface UserFormProps {
  user?: User;
  onSaved?: (name: string) => void;
  onCancel?: () => void;
}

export default function UserForm({ user, onSaved, onCancel }: UserFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector((state: RootState) => state.users.users);
  const [draft, setDraft] = useState<UserDraft>(user ? normalizeUser(user) : emptyDraft);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const fields = useRef<Partial<Record<keyof UserDraft, HTMLInputElement | null>>>({});
  const prefix = user ? `edit-${user.id}` : 'add';
  const otherUsers = users.filter(existing => existing.id !== user?.id);
  const errors = submitted ? validateUser(draft, otherUsers) : {};

  useEffect(() => {
    if (user) fields.current.name?.focus();
  }, [user]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setMessage('');
    const nextErrors = validateUser(draft, otherUsers);
    const firstError = userFields.find(field => nextErrors[field]);
    if (firstError) {
      fields.current[firstError]?.focus();
      return;
    }
    const normalized = normalizeUser(draft);
    if (user) {
      dispatch(updateUser({ id: user.id, ...normalized }));
      onSaved?.(normalized.name);
      return;
    }
    dispatch(addUser(normalized));
    setDraft({ ...emptyDraft });
    setSubmitted(false);
    setMessage(`${normalized.name} added. Table filters have been cleared.`);
    fields.current.name?.focus();
  };

  return (
    <section aria-labelledby={`${prefix}-heading`} className="add-user">
      <h2 id={`${prefix}-heading`}>{user ? `Edit ${user.name}` : 'Add user'}</h2>
      <p>All fields are required. Users are stored for this session and will be cleared when you reload the page.</p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="add-user-fields">
          {userFields.map(field => (
            <div key={field}>
              <label htmlFor={`${prefix}-${field}`}>{labels[field]}</label>
              <input
                id={`${prefix}-${field}`}
                name={field}
                type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                required
                ref={element => { fields.current[field] = element; }}
                value={draft[field]}
                aria-invalid={Boolean(errors[field])}
                aria-describedby={errors[field] ? `${prefix}-${field}-error` : undefined}
                onChange={event => {
                  setDraft({ ...draft, [field]: event.target.value });
                  setMessage('');
                }}
              />
              {errors[field] && <p className="field-error" id={`${prefix}-${field}-error`}>{errors[field]}</p>}
            </div>
          ))}
        </div>
        <button type="submit">{user ? 'Save changes' : 'Add user'}</button>
        {user && <button type="button" onClick={onCancel}>Cancel</button>}
        <p role="status" aria-live="polite">{message}</p>
      </form>
    </section>
  );
}

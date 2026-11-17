import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { addUser } from '../redux/userSlice';
import { emptyDraft, normalizeUser, UserDraft, userFields, validateUser } from '../utils/userValidation';
import '../styles/AddUserForm.css';

const labels: Record<keyof UserDraft, string> = { name: 'Name', username: 'Username', email: 'Email', phone: 'Phone' };

export default function AddUserForm() {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector((state: RootState) => state.users.users);
  const [draft, setDraft] = useState<UserDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const fields = useRef<Partial<Record<keyof UserDraft, HTMLInputElement | null>>>({});
  const errors = submitted ? validateUser(draft, users) : {};

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setMessage('');
    const nextErrors = validateUser(draft, users);
    const firstError = userFields.find(field => nextErrors[field]);
    if (firstError) {
      fields.current[firstError]?.focus();
      return;
    }
    const user = normalizeUser(draft);
    dispatch(addUser(user));
    setDraft({ ...emptyDraft });
    setSubmitted(false);
    setMessage(`${user.name} added. Table filters have been cleared.`);
    fields.current.name?.focus();
  };

  return (
    <section aria-labelledby="add-user-heading" className="add-user">
      <h2 id="add-user-heading">Add user</h2>
      <p>All fields are required. Users are stored for this session and will be cleared when you reload the page.</p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="add-user-fields">
          {userFields.map(field => (
            <div key={field}>
              <label htmlFor={`add-${field}`}>{labels[field]}</label>
              <input
                id={`add-${field}`}
                name={field}
                type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                required
                ref={element => { fields.current[field] = element; }}
                value={draft[field]}
                aria-invalid={Boolean(errors[field])}
                aria-describedby={errors[field] ? `add-${field}-error` : undefined}
                onChange={event => {
                  setDraft({ ...draft, [field]: event.target.value });
                  setMessage('');
                }}
              />
              {errors[field] && <p className="field-error" id={`add-${field}-error`}>{errors[field]}</p>}
            </div>
          ))}
        </div>
        <button type="submit">Add user</button>
        <p role="status" aria-live="polite">{message}</p>
      </form>
    </section>
  );
}

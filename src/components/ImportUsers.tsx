import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { importUsers } from '../redux/userSlice';
import { MAX_CSV_BYTES, readUserDrafts, validateImport } from '../utils/importUsers';

const ImportUsers: React.FC<{ onImported: (count: number) => void }> = ({ onImported }) => {
  const users = useSelector((state: RootState) => state.users.users);
  const store = useStore<RootState>();
  const dispatch = useDispatch<AppDispatch>();
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [fromExport, setFromExport] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader | null>(null);
  useEffect(() => () => { reader.current?.abort(); }, []);
  const clear = () => {
    reader.current?.abort(); reader.current = null;
    setText(null); setError(''); setReading(false);
    if (input.current) input.current.value = '';
  };
  const chooseFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    reader.current?.abort(); reader.current = null;
    setText(null); setError(''); setReading(false);
    if (!file) return;
    if (file.size > MAX_CSV_BYTES) { setError('Choose a CSV file no larger than 1 MB.'); return; }
    const next = new FileReader(); reader.current = next; setReading(true);
    next.onload = () => {
      if (reader.current !== next) return;
      setReading(false); setText(String(next.result ?? ''));
    };
    next.onerror = () => {
      if (reader.current !== next) return;
      setReading(false); setError('Could not read the file. Please select it again.');
    };
    next.readAsText(file, 'UTF-8');
  };
  let drafts: ReturnType<typeof readUserDrafts> = [];
  let errors: string[] = [];
  if (text !== null) {
    try { drafts = readUserDrafts(text, fromExport); errors = validateImport(drafts, users); }
    catch (cause) { errors = [cause instanceof Error ? cause.message : 'Could not parse the CSV file.']; }
  }
  const confirm = () => {
    const currentErrors = validateImport(drafts, store.getState().users.users);
    if (currentErrors.length) { setError(currentErrors[0]); return; }
    dispatch(importUsers(drafts));
    onImported(drafts.length); clear(); input.current?.focus();
  };
  return (
    <section aria-labelledby="import-heading">
      <h2 id="import-heading">Import users</h2>
      <p id="import-help">Choose a UTF-8 CSV with columns name,username,email,phone. Up to 1 MB and 1,000 users. All fields are required. Duplicates block the entire import; existing users are never replaced.</p>
      <label htmlFor="import-file">CSV file</label>{' '}
      <input id="import-file" ref={input} type="file" accept=".csv,text/csv" aria-describedby="import-help" onChange={chooseFile} />
      <p><label><input type="checkbox" checked={fromExport} onChange={event => setFromExport(event.target.checked)} /> This file was exported by this app (remove protective apostrophes).</label></p>
      {reading && <p>Reading file…</p>}
      {(error || errors.length > 0) && <div role="alert"><p>Nothing imported.</p><ul>{(error ? [error] : errors).slice(0, 10).map((message, index) => <li key={index}>{message}</li>)}</ul>{errors.length > 10 && <p>{errors.length - 10} more errors. Fix the file and select it again.</p>}</div>}
      {drafts.length > 0 && errors.length === 0 && <p>{drafts.length} {drafts.length === 1 ? 'user' : 'users'} ready to add. Table filters will be cleared.</p>}
      <button type="button" disabled={reading || !drafts.length || errors.length > 0} onClick={confirm}>Import users</button>{' '}
      <button type="button" onClick={clear}>Cancel import</button>
    </section>
  );
};
export default ImportUsers;

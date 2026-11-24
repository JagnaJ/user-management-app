import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { importUsers } from '../redux/userSlice';
import { userFields, UserDraft } from '../utils/userValidation';
import { MAX_CSV_BYTES, ColumnMapping, CsvTable, detectDelimiter, readCsvTable, suggestMapping, mapUserDrafts, validateImport } from '../utils/importUsers';

const ImportUsers: React.FC<{ onImported: (count: number) => void }> = ({ onImported }) => {
  const users = useSelector((state: RootState) => state.users.users);
  const store = useStore<RootState>();
  const dispatch = useDispatch<AppDispatch>();
  const [text, setText] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState(',');
  const [mapping, setMapping] = useState<ColumnMapping>([]);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [fromExport, setFromExport] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader | null>(null);
  useEffect(() => () => { reader.current?.abort(); }, []);
  const clear = () => {
    reader.current?.abort(); reader.current = null;
    setText(null); setMapping([]); setFromExport(false); setError(''); setReading(false);
    if (input.current) input.current.value = '';
  };
  const chooseFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    reader.current?.abort(); reader.current = null;
    setText(null); setMapping([]); setFromExport(false); setError(''); setReading(false);
    if (!file) return;
    if (file.size > MAX_CSV_BYTES) { setError('Choose a CSV file no larger than 1 MB.'); return; }
    const next = new FileReader(); reader.current = next; setReading(true);
    next.onload = () => {
      if (reader.current !== next) return;
      const value = String(next.result ?? '');
      const separator = detectDelimiter(value);
      setDelimiter(separator); setReading(false); setText(value);
      try { setMapping(suggestMapping(readCsvTable(value, separator).header)); } catch { setMapping([]); }
    };
    next.onerror = () => {
      if (reader.current !== next) return;
      setReading(false); setError('Could not read the file. Please select it again.');
    };
    next.readAsText(file, 'UTF-8');
  };
  const changeDelimiter = (value: string) => {
    setDelimiter(value); setError('');
    try { setMapping(suggestMapping(readCsvTable(text ?? '', value).header)); } catch { setMapping([]); }
  };
  let table: CsvTable | null = null;
  let drafts: UserDraft[] = [];
  let errors: string[] = [];
  if (text !== null) {
    try { table = readCsvTable(text, delimiter); drafts = mapUserDrafts(table, mapping, fromExport); errors = validateImport(drafts, users); }
    catch (cause) { errors = [cause instanceof Error ? cause.message : 'Could not parse the CSV file.']; }
  }
  const confirm = () => {
    if (errors.length || !drafts.length || reading) return;
    const currentErrors = validateImport(drafts, store.getState().users.users);
    if (currentErrors.length) { setError(currentErrors[0]); return; }
    dispatch(importUsers(drafts));
    onImported(drafts.length); clear(); input.current?.focus();
  };
  return (
    <section aria-labelledby="import-heading">
      <h2 id="import-heading">Import users</h2>
      <p id="import-help">Choose a UTF-8 CSV with a header row, then match its columns to name, username, email and phone. Column order does not matter. Up to 1 MB and 1,000 users. All fields are required. Duplicates block the entire import; existing users are never replaced.</p>
      <label htmlFor="import-file">CSV file</label>{' '}
      <input id="import-file" ref={input} type="file" accept=".csv,text/csv" aria-describedby="import-help" onChange={chooseFile} />
      <p><label><input type="checkbox" checked={fromExport} onChange={event => setFromExport(event.target.checked)} /> This file was exported by this app (remove protective apostrophes).</label></p>
      {text !== null && <p><label>Delimiter{' '}<select value={delimiter} onChange={event => changeDelimiter(event.target.value)}>
        <option value=",">Comma</option><option value=";">Semicolon</option><option value={'\t'}>Tab</option>
      </select></label></p>}
      {table && <div style={{ overflowX: 'auto' }}>
        <h3>Match columns</h3>
        <p>Check the suggested matches. Skip extra columns. Each required field must be matched once.</p>
        <table aria-label="Column mapping"><thead><tr><th>CSV column</th><th>Example</th><th>Import as</th></tr></thead>
          <tbody>{table.header.map((label, index) => <tr key={index}><td>{label || '(unnamed)'} ({index + 1})</td><td>{table?.rows[0][index]}</td><td>
            <select aria-label={`Map column ${index + 1}: ${label}`} value={mapping[index] ?? ''} onChange={event => {
              const next = [...mapping]; next[index] = event.target.value as keyof UserDraft | ''; setMapping(next); setError('');
            }}><option value="">Do not import</option>{userFields.map(field => <option key={field} value={field}>{field}</option>)}</select>
          </td></tr>)}</tbody></table>
      </div>}
      {drafts.length > 0 && <div style={{ overflowX: 'auto' }}><h3>Preview (first 5 users)</h3>
        <table aria-label="Import preview"><thead><tr>{userFields.map(field => <th key={field}>{field}</th>)}</tr></thead>
          <tbody>{drafts.slice(0, 5).map((draft, index) => <tr key={index}>{userFields.map(field => <td key={field}>{draft[field]}</td>)}</tr>)}</tbody></table>
      </div>}
      {reading && <p>Reading file…</p>}
      {(error || errors.length > 0) && <div role="alert"><p>Nothing imported.</p><ul>{(error ? [error] : errors).slice(0, 10).map((message, index) => <li key={index}>{message}</li>)}</ul>{errors.length > 10 && <p>{errors.length - 10} more errors. Fix the file and select it again.</p>}</div>}
      {drafts.length > 0 && errors.length === 0 && <p>{drafts.length} {drafts.length === 1 ? 'user' : 'users'} ready to add. Table filters will be cleared.</p>}
      <button type="button" disabled={reading || !drafts.length || errors.length > 0} onClick={confirm}>Import users</button>{' '}
      <button type="button" onClick={clear}>Cancel import</button>
    </section>
  );
};
export default ImportUsers;

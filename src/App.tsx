import './styles/App.css';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import React, { useEffect, useState } from 'react';
import AddUserForm from './components/AddUserForm';
import UserTable from './components/UserTable';
import ImportUsers from './components/ImportUsers';
import ExportUsersButton from './components/ExportUsersButton';

const App: React.FC = () => {
  const [panel, setPanel] = useState<'add' | 'import' | null>(null);
  const count = useSelector((state: RootState) => state.users.users.length);
  const storageError = useSelector((state: RootState) => state.persistence?.error);
  const [notice, setNotice] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="App">
      <header className="page-header"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>User Management</h1><p>Manage your contacts, all in one place.</p></div><span className="user-count">{count} {count === 1 ? 'user' : 'users'}</span></header>
      {storageError && <p role="alert">{storageError}</p>}
      <div className="toolbar">
        <button className="primary" type="button" aria-expanded={panel === 'add'} aria-controls="add-panel" onClick={() => setPanel(panel === 'add' ? null : 'add')}>Add a user</button>
        <button type="button" aria-expanded={panel === 'import'} aria-controls="import-panel" onClick={() => setPanel(panel === 'import' ? null : 'import')}>Import CSV</button>
        <ExportUsersButton />
      </div>
      <div id="add-panel" hidden={panel !== 'add'}><AddUserForm onAdded={() => setNotice({ message: 'User added' })} /></div>
      <div id="import-panel" hidden={panel !== 'import'}><ImportUsers onImported={count => setNotice({ message: `${count} ${count === 1 ? 'user' : 'users'} imported` })} /></div>
      <p className="notice" role="status" aria-live="polite" aria-atomic="true">{notice?.message}</p>
      <UserTable
        onUpdated={() => setNotice({ message: 'User updated' })}
        onDeleted={() => setNotice({ message: 'User deleted' })}
      />
    </div>
  );
};

export default App;

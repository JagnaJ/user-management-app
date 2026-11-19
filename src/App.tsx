import React, { useEffect, useState } from 'react';
import AddUserForm from './components/AddUserForm';
import UserTable from './components/UserTable';

const App: React.FC = () => {
  const [notice, setNotice] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="App">
      <h1>User Management</h1>
      <AddUserForm onAdded={() => setNotice({ message: 'User added' })} />
      <p role="status" aria-live="polite" aria-atomic="true">{notice?.message}</p>
      <UserTable
        onUpdated={() => setNotice({ message: 'User updated' })}
        onDeleted={() => setNotice({ message: 'User deleted' })}
      />
    </div>
  );
};

export default App;

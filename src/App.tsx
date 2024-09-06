import React from 'react';
import UserTable from './components/UserTable';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>User Management</h1>
      <UserTable />
    </div>
  );
};

export default App;

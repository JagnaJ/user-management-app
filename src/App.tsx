import React from 'react';
import AddUserForm from './components/AddUserForm';
import UserTable from './components/UserTable';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>User Management</h1>
      <AddUserForm />
      <UserTable />
    </div>
  );
};

export default App;

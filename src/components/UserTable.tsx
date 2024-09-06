import React, { useEffect } from 'react';
import '../styles/UserTable.css'; 
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { loadUsers, setFilter } from '../redux/userSlice';
import { Filters } from '../redux/userSlice'; 

const UserTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, filters, status, error } = useSelector((state: RootState) => state.users);

  useEffect(() => {
    dispatch(loadUsers());
  }, [dispatch]);

  const isFilterKey = (key: string): key is keyof Filters => {
    return ['name', 'username', 'email', 'phone'].includes(key as keyof Filters);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (isFilterKey(name)) {
      dispatch(setFilter({ key: name, value }));
    }
  };

  const filteredUsers = users.filter(user =>
    (filters.name === '' || user.name.toLowerCase().includes(filters.name.toLowerCase())) &&
    (filters.username === '' || user.username.toLowerCase().includes(filters.username.toLowerCase())) &&
    (filters.email === '' || user.email.toLowerCase().includes(filters.email.toLowerCase())) &&
    (filters.phone === '' || user.phone.toLowerCase().includes(filters.phone.toLowerCase()))
  );

  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'failed') return <p>{error}</p>;

  return (
    <div>
      <div className="filter-inputs">
        <input
          type="text"
          name="name"
          placeholder="Filter by name"
          value={filters.name}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Filter by username"
          value={filters.username}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="email"
          placeholder="Filter by email"
          value={filters.email}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Filter by phone"
          value={filters.phone}
          onChange={handleFilterChange}
        />
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;

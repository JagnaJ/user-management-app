import React, { useRef, useState } from 'react';
import UserForm from './UserForm';
import '../styles/UserTable.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { User } from '../types';
import { deleteUser, setFilter } from '../redux/userSlice';
import { Filters } from '../redux/userSlice';

const UserTable: React.FC<{ onUpdated: () => void; onDeleted: () => void }> = ({ onUpdated, onDeleted }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const table = useRef<HTMLTableElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { users, filters } = useSelector((state: RootState) => state.users);

  const handleDelete = (user: User) => {
    if (!window.confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return;
    dispatch(deleteUser(user.id));
    onDeleted();
    table.current?.focus();
  };

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

  const editingUser = users.find(user => user.id === editingId);
  const closeEditor = () => {
    setEditingId(null);
    table.current?.focus();
  };

  return (
    <section className="users-card" aria-label="User list">
      <h2>Users</h2>
      <div className="filter-inputs">
        <input
          type="text"
          name="name"
          aria-label="Filter by name"
          placeholder="Filter by name"
          value={filters.name}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="username"
          aria-label="Filter by username"
          placeholder="Filter by username"
          value={filters.username}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="email"
          aria-label="Filter by email"
          placeholder="Filter by email"
          value={filters.email}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="phone"
          aria-label="Filter by phone"
          placeholder="Filter by phone"
          value={filters.phone}
          onChange={handleFilterChange}
        />
      </div>

      {editingUser && (
        <UserForm key={editingUser.id} user={editingUser}
          onSaved={() => { onUpdated(); closeEditor(); }}
          onCancel={closeEditor}
        />
      )}
      <div className="table-scroll"><table ref={table} tabIndex={-1} aria-label="Users">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan={5}>
                {users.length === 0 ? "No users yet." : "No users match your filters."}
              </td>
            </tr>
          )}
          {filteredUsers.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>
                <button type="button" aria-label={`Edit ${user.name}`} disabled={editingId !== null}
                  onClick={() => { setEditingId(user.id); }}>
                  Edit
                </button>
                <button type="button" className="delete-user" aria-label={`Delete ${user.name}`}
                  disabled={editingId !== null} onClick={() => handleDelete(user)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </section>
  );
};

export default UserTable;

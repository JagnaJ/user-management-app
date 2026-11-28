import React, { useEffect, useRef, useState } from 'react';
import UserForm from './UserForm';
import '../styles/UserTable.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { User } from '../types';
import { deleteUser, deleteAllUsers, setFilter, resetFilters } from '../redux/userSlice';
import { Filters } from '../redux/userSlice';

const UserTable: React.FC<{ onUpdated: () => void; onDeleted: () => void; onAllDeleted: (count: number) => void }> = ({ onUpdated, onDeleted, onAllDeleted }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ key: keyof Filters; direction: 'asc' | 'desc' } | null>(null);
  const table = useRef<HTMLTableElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { users, filters } = useSelector((state: RootState) => state.users);

  const handleDelete = (user: User) => {
    if (!window.confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return;
    dispatch(deleteUser(user.id));
    onDeleted();
    table.current?.focus();
  };

  const handleDeleteAll = () => {
    if (!users.length || editingId !== null) return;
    const count = users.length;
    if (!window.confirm(`Delete all ${count} ${count === 1 ? 'user' : 'users'}? This includes users hidden by filters and on other pages. This cannot be undone.`)) return;
    dispatch(deleteAllUsers());
    setPage(1);
    onAllDeleted(count);
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

  const sortedUsers = sort ? [...filteredUsers].sort((a, b) => {
    const comparison = a[sort.key].localeCompare(b[sort.key], 'en', { sensitivity: 'base', numeric: true });
    return sort.direction === 'asc' ? comparison : -comparison;
  }) : filteredUsers;
  const pages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * pageSize;
  const visibleUsers = sortedUsers.slice(start, start + pageSize);
  useEffect(() => { setPage(1); }, [filters, pageSize, sort]);
  useEffect(() => { setPage(previous => Math.min(previous, pages)); }, [pages]);
  const changeSort = (key: keyof Filters) => {
    setSort(previous => ({ key, direction: previous?.key === key && previous.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const editingUser = users.find(user => user.id === editingId);
  const closeEditor = () => {
    setEditingId(null);
    table.current?.focus();
  };

  return (
    <section className="users-card" aria-label="User list">
      <div className="users-heading">
        <h2>Users</h2>
        <button type="button" className="delete-all-users" disabled={users.length === 0 || editingId !== null} onClick={handleDeleteAll}>Delete all users</button>
      </div>
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

      <div className="table-controls">
        <button type="button" disabled={!Object.values(filters).some(Boolean)} onClick={() => dispatch(resetFilters())}>Clear filters</button>
        <label>Rows per page{' '}<select value={pageSize} onChange={event => setPageSize(Number(event.target.value))}>
          {[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}
        </select></label>
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
            {(['name', 'username', 'email', 'phone'] as const).map(key => (
              <th key={key} aria-sort={sort?.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className="sort-button" aria-label={`Sort by ${key}`} onClick={() => changeSort(key)}>
                  {key[0].toUpperCase() + key.slice(1)} <span aria-hidden="true">{sort?.key === key ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </button>
              </th>
            ))}
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
          {visibleUsers.map(user => (
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
      <nav className="pagination" aria-label="User table pages">
        <p aria-live="polite">Showing {sortedUsers.length ? start + 1 : 0}–{Math.min(start + pageSize, sortedUsers.length)} of {sortedUsers.length}{sortedUsers.length !== users.length ? ` (filtered from ${users.length})` : ''}</p>
        <div><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
          <span>Page {currentPage} of {pages}</span>
          <button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
      </nav>
    </section>
  );
};

export default UserTable;

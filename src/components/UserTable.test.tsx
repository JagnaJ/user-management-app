import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, within } from '@testing-library/react';
import UserTable from './UserTable';
import reducer from '../redux/userSlice';
function setup(count = 26) {
 const users = Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `User ${i + 1}`, username: `u${i + 1}`, email: `u${i + 1}@example.com`, phone: `${i + 1}` }));
 const store = configureStore({ reducer: { users: reducer }, preloadedState: { users: { users, filters: { name: '', username: '', email: '', phone: '' } } } });
 render(<Provider store={store}><UserTable onUpdated={() => {}} onDeleted={() => {}} /></Provider>);
 return store;
}
test('paginates filtered results and resets page on filters, size and clear', () => {
 setup();
 expect(screen.getByText('Showing 1–10 of 26')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'Next' }));
 expect(screen.getByText('Showing 11–20 of 26')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Filter by name'), { target: { value: 'User 26' } });
 expect(screen.getByText('Showing 1–1 of 1 (filtered from 26)')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
 fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '25' } });
 expect(screen.getByText('Showing 1–25 of 26')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'Next' }));
 expect(screen.getByText('Showing 26–26 of 26')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '50' } });
 expect(screen.getByText('Showing 1–26 of 26')).toBeInTheDocument();
});
test('sorts the full result set both ways without mutating stored order', () => {
 const store = setup(); const before = store.getState().users.users;
 fireEvent.click(screen.getByRole('button', { name: 'Next' }));
 fireEvent.click(screen.getByRole('button', { name: 'Sort by name' }));
 expect(screen.getByText('Showing 1–10 of 26')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'Sort by name' }));
 const rows = within(screen.getByRole('table', { name: 'Users' })).getAllByRole('row');
 expect(within(rows[1]).getByText('User 26')).toBeInTheDocument();
 expect(screen.getByRole('button', { name: 'Sort by name' }).closest('th')).toHaveAttribute('aria-sort','descending');
 expect(store.getState().users.users).toBe(before);
});
test('clamps page after deleting its last row and handles empty results', () => {
 setup(11); jest.spyOn(window, 'confirm').mockReturnValue(true);
 fireEvent.click(screen.getByRole('button', { name: 'Next' }));
 fireEvent.click(screen.getByRole('button', { name: 'Delete User 11' }));
 expect(screen.getByText('Showing 1–10 of 10')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Filter by name'), { target: { value: 'missing' } });
 expect(screen.getByText('Showing 0–0 of 0 (filtered from 10)')).toBeInTheDocument();
 expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
 expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
 jest.restoreAllMocks();
});

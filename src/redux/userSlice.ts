import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../types';
import { fetchUsers } from '../api';

export interface Filters {
  name: string;
  username: string;
  email: string;
  phone: string;
}

interface UserState {
  users: User[];
  filters: Filters;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UserState = {
  users: [],
  filters: {
    name: '',
    username: '',
    email: '',
    phone: '',
  },
  status: 'idle',
  error: null,
};

export const loadUsers = createAsyncThunk('users/loadUsers', async () => {
  const users = await fetchUsers();
  return users;
});

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<{ key: keyof Filters; value: string }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(loadUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to load users';
      });
  },
});

export const { setFilter } = userSlice.actions;
export default userSlice.reducer;

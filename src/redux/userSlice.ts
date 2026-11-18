import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';
import { normalizeUser, UserDraft, validateUser } from '../utils/userValidation';

export interface Filters {
  name: string;
  username: string;
  email: string;
  phone: string;
}

interface UserState {
  users: User[];
  filters: Filters;
}

const initialState: UserState = {
  users: [],
  filters: {
    name: '',
    username: '',
    email: '',
    phone: '',
  },
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<UserDraft>) => {
      const draft = normalizeUser(action.payload);
      if (Object.keys(validateUser(draft, state.users)).length > 0) return;
      const id = state.users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
      state.users.push({ id, ...draft });
      state.filters = { name: '', username: '', email: '', phone: '' };
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index === -1) return;
      const draft = normalizeUser(action.payload);
      const others = state.users.filter(user => user.id !== action.payload.id);
      if (Object.keys(validateUser(draft, others)).length > 0) return;
      state.users[index] = { id: action.payload.id, ...draft };
    },
    setFilter: (state, action: PayloadAction<{ key: keyof Filters; value: string }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
  },
});

export const { setFilter, addUser, updateUser } = userSlice.actions;
export default userSlice.reducer;

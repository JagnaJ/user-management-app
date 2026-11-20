import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import { loadUsers, STORAGE_KEY, storageInvalid, storageUnavailable, UserStorage } from './userStorage';

const persistenceSlice = createSlice({
  name: 'persistence',
  initialState: { error: '' },
  reducers: {
    setError: (state, action: PayloadAction<string>) => { state.error = action.payload; },
  },
});

export function createAppStore(getStorage: () => UserStorage = () => window.localStorage) {
  let storage: UserStorage | undefined;
  let error = '';
  let users = userReducer(undefined, { type: '@@init' });
  try {
    storage = getStorage();
  } catch {
    error = storageUnavailable;
  }
  if (storage) {
    try {
      users = { ...users, users: loadUsers(storage) };
    } catch {
      error = storageInvalid;
      storage = undefined;
    }
  }
  const store = configureStore({
    reducer: { users: userReducer, persistence: persistenceSlice.reducer },
    preloadedState: { users, persistence: { error } },
  });
  let previousUsers = store.getState().users.users;
  store.subscribe(() => {
    const nextUsers = store.getState().users.users;
    if (previousUsers === nextUsers) return;
    previousUsers = nextUsers;
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, users: nextUsers }));
      if (store.getState().persistence.error) store.dispatch(persistenceSlice.actions.setError(''));
    } catch {
      store.dispatch(persistenceSlice.actions.setError(storageUnavailable));
    }
  });
  return store;
}

export const store = createAppStore();
export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

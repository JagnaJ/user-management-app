import React from 'react';
import UserForm from './UserForm';

export default function AddUserForm({ onAdded }: { onAdded: () => void }) {
  return <UserForm onSaved={onAdded} />;
}

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { downloadUsersCsv } from '../utils/exportUsers';

const ExportUsersButton: React.FC = () => {
  const users = useSelector((state: RootState) => state.users.users);
  const [error, setError] = useState('');
  const handleExport = () => {
    setError('');
    try {
      downloadUsersCsv(users);
    } catch {
      setError('Could not start the download. Please try again.');
    }
  };
  return (
    <div>
      <button type="button" disabled={users.length === 0} onClick={handleExport}>
        Export all users (CSV)
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
};

export default ExportUsersButton;

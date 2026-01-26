import { useSelector } from 'react-redux';

export default function ProfileBar({ onLogout }) {
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <div>
        <p className="text-xs text-gray-500">Logged in</p>
        <p className="font-bold">{user?.name}</p>
      </div>
      <button 
        className="text-red-600 text-sm hover:text-red-800"
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  );
}
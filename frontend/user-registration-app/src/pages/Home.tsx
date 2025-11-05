import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-[9px] shadow-lg p-8 border border-gray-200 text-center space-y-4">
        <h1 className="text-3xl font-bold text-purple-500 tracking-tighter sm:text-4xl md:text-5xl">Home</h1>
        <p className="text-green-600 font-medium">You have logged in successfully.</p>
      </div>
    </div>
  );
}
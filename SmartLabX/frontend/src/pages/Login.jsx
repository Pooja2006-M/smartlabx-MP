import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('faculty@smartlabx.edu');
  const [password, setPassword] = useState('faculty123');
  const [role, setRole] = useState('faculty');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const demoCredentials = {
        admin: { email: 'admin@smartlabx.edu', password: 'admin123', role: 'admin', name: 'System Administrator' },
        faculty: { email: 'faculty@smartlabx.edu', password: 'faculty123', role: 'faculty', name: 'Dr. Alan Turing' },
      };

      const normalizedEmail = email.trim().toLowerCase();
      const selected = demoCredentials[role];
      const selectedMatch = selected && normalizedEmail === selected.email && password === selected.password;

      if (selectedMatch) {
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify(selected));

        if (selected.role === 'admin') {
          navigate('/admin');
        } else if (selected.role === 'faculty') {
          navigate('/faculty');
        } else {
          navigate('/student');
        }
        return;
      }

      const fallbackMatch = Object.values(demoCredentials).find(
        (user) => user.email === normalizedEmail && user.password === password
      );

      if (fallbackMatch) {
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify(fallbackMatch));

        if (fallbackMatch.role === 'admin') {
          navigate('/admin');
        } else if (fallbackMatch.role === 'faculty') {
          navigate('/faculty');
        } else {
          navigate('/student');
        }
        return;
      }

      try {
        const response = await api.post('/auth/login', { email: normalizedEmail, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));

        const userRole = response.data.role;
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'faculty') {
          navigate('/faculty');
        } else {
          navigate('/student');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),transparent_30%),linear-gradient(135deg,_#f8fafc,_#eef2ff)] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_-22px_rgba(15,23,42,0.25)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-700 p-8 text-white sm:p-10">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            SmartLabX
          </div>
          <h1 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">Welcome back to the virtual lab portal.</h1>
          <p className="mt-4 text-sm leading-7 text-indigo-100 sm:text-base">
            Sign in to access your dashboard, manage practical experiments, and monitor student activity with ease.
          </p>
          <div className="mt-8 space-y-3 text-sm text-indigo-50">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3">Secure authentication for admins and faculty</div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3">Live lab insights and hands-on workflow support</div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">Access your SmartLabX workspace</p>
            </div>
            <Link to="/" className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">
              Back home
            </Link>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
                placeholder="faculty@smartlabx.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-700">
              <p className="font-semibold">Portal access</p>
              <p className="mt-1">Use faculty or admin credentials here for the main portal.</p>
              <p>Student login is available inside the lab workspace only.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Login As</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
              >
                <option value="admin">Administrator</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl px-4 py-3 font-semibold text-white transition ${loading ? 'bg-slate-500' : 'bg-slate-900 hover:bg-slate-700'}`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

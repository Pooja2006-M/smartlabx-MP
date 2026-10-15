import React, { useState } from 'react';
import '../index.css';
import DepartmentManagement from '../components/admin/DepartmentManagement';
import LaboratoryManagement from '../components/admin/LaboratoryManagement';
import UserManagement from '../components/admin/UserManagement';
import SubjectManagement from '../components/admin/SubjectManagement';
import AcademicManagement from '../components/admin/AcademicManagement';
import ResourceManagement from '../components/admin/ResourceManagement';
import Announcements from '../components/admin/Announcements';
import ReportsAnalytics from '../components/admin/ReportsAnalytics';
import SystemSettings from '../components/admin/SystemSettings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { key: 'departments', label: 'Departments', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { key: 'users', label: 'Users', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { key: 'subjects', label: 'Subjects', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { key: 'laboratories', label: 'Laboratories', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
    { key: 'academic', label: 'Academic', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { key: 'resources', label: 'Resources', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
    { key: 'announcements', label: 'Announcements', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
    { key: 'reports', label: 'Reports', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { key: 'settings', label: 'Settings', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'departments': return <DepartmentManagement />;
      case 'users': return <UserManagement />;
      case 'subjects': return <SubjectManagement />;
      case 'laboratories': return <LaboratoryManagement />;
      case 'academic': return <AcademicManagement />;
      case 'resources': return <ResourceManagement />;
      case 'announcements': return <Announcements />;
      case 'reports': return <ReportsAnalytics />;
      case 'settings': return <SystemSettings />;
      case 'dashboard':
      default:
        return (
          <div className="p-8">
            <div className="mb-8 rounded-[1.5rem] border border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">Administration overview</p>
              <h3 className="mt-2 text-2xl font-semibold">Everything you need to manage the lab ecosystem is in one place.</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Total Students', value: '1,240', change: '↑ 12%' },
                { title: 'Total Faculty', value: '142', change: '↑ 5%' },
                { title: 'Active Workspaces', value: '56', change: '3 today' },
                { title: 'System Uptime', value: '99.9%', change: 'Healthy' },
              ].map((stat, i) => (
                <div key={i} className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="mt-2 text-sm text-emerald-600">{stat.change}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <h3 className="font-semibold text-slate-800">Recent Activity</h3>
                  <button className="text-sm font-medium text-indigo-600">View all</button>
                </div>
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-sm text-slate-500">
                      <th className="px-6 py-3 font-medium">Action</th>
                      <th className="px-6 py-3 font-medium">Target</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 text-sm text-slate-800">Created New Lab Workspace</td><td className="px-6 py-4 text-sm text-slate-600">DBMS Laboratory</td><td className="px-6 py-4 text-sm text-slate-400">Just now</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 text-sm text-slate-800">Added Faculty Member</td><td className="px-6 py-4 text-sm text-slate-600">Dr. Smith</td><td className="px-6 py-4 text-sm text-slate-400">2 hours ago</td></tr>
                    <tr className="hover:bg-slate-50"><td className="px-6 py-4 text-sm text-slate-800">New Student Batch Imported</td><td className="px-6 py-4 text-sm text-slate-600">CSE 2026 - Section A</td><td className="px-6 py-4 text-sm text-slate-400">5 hours ago</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
                <h3 className="text-lg font-semibold">Today at a glance</h3>
                <div className="mt-6 space-y-4 text-sm text-slate-300">
                  <div className="rounded-2xl border border-slate-800 bg-slate-800/70 p-4">8 lab sessions running</div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-800/70 p-4">3 pending resource approvals</div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-800/70 p-4">2 new announcements queued</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-slate-950 text-white">
        <div className="cursor-pointer p-6" onClick={() => setActiveTab('dashboard')}>
          <h1 className="text-2xl font-bold tracking-wider text-indigo-400">SmartLabX</h1>
          <p className="mt-1 text-xs text-slate-400">Admin Dashboard</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeTab === item.key ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }} className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">
            {activeTab === 'dashboard' ? 'Overview' : sidebarItems.find((i) => i.key === activeTab)?.label}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600">Admin User</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 font-bold text-indigo-600">A</div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </main>
    </div>
  );
}

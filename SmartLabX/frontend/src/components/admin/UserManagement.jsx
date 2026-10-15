import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('faculty');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserRole, setNewUserRole] = useState('faculty');
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  
  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('Computer Science Engineering');
  const [batch, setBatch] = useState('2026');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setFaculty(res.data.filter(u => u.role === 'faculty'));
      setStudents(res.data.filter(u => u.role === 'student'));
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      const payload = {
        name,
        email,
        role: newUserRole,
        dept,
        password: 'password123', // Default password
      };
      
      if (newUserRole === 'student') {
        payload.batch = batch;
        payload.section = section;
      }

      await api.post('/admin/users', payload);
      setShowAddModal(false);
      setName('');
      setEmail('');
      setSection('');
      fetchUsers();
    } catch (err) {
      console.error('Error saving user', err);
      alert('Failed to save user. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage faculty and student accounts.</p>
        </div>
        <div className="space-x-3">
          <button 
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:bg-green-700 transition font-medium text-sm"
          >
            Import CSV
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium flex-inline items-center gap-2"
          >
            + Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('faculty')}
            className={`flex-1 py-4 font-medium text-sm transition ${activeTab === 'faculty' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Faculty Directory
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-4 font-medium text-sm transition ${activeTab === 'students' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Student Directory
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Department</th>
                {activeTab === 'students' && (
                  <>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Batch</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Section</th>
                  </>
                )}
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(activeTab === 'faculty' ? faculty : students).map(user => (
                <tr key={user._id || user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{user.dept}</span>
                  </td>
                  {activeTab === 'students' && (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.batch}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.section}</td>
                    </>
                  )}
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-3">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    <button className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Add New User</h3>
            
            <div className="flex mb-6 space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" value="faculty" checked={newUserRole === 'faculty'} onChange={() => setNewUserRole('faculty')} className="text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Faculty</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" value="student" checked={newUserRole === 'student'} onChange={() => setNewUserRole('student')} className="text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Student</span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@school.edu" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>Computer Science Engineering</option>
                  <option>Information Technology</option>
                </select>
              </div>

              {newUserRole === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                    <select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option>2026</option>
                      <option>2027</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <input type="text" value={section} onChange={(e) => setSection(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. A" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveUser}
                disabled={loading}
                className={`px-4 py-2 ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} rounded-lg text-white font-medium transition`}
              >
                {loading ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

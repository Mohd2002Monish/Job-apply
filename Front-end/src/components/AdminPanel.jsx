import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

const ShieldIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UsersIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CpuIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const BriefcaseIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${BACKEND}/admin/stats`, { withCredentials: true }),
        axios.get(`${BACKEND}/admin/users`, { withCredentials: true })
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.users);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError('');
      setSuccessMsg('');
      const res = await axios.patch(`${BACKEND}/admin/users/${userId}/role`, { role: newRole }, { withCredentials: true });
      if (res.data.success) {
        setSuccessMsg(`Successfully updated user role to ${newRole}`);
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user role.');
    }
  };

  const handleTierChange = async (userId, newTier) => {
    try {
      setError('');
      setSuccessMsg('');
      const res = await axios.patch(`${BACKEND}/admin/users/${userId}/tier`, { subscriptionTier: newTier }, { withCredentials: true });
      if (res.data.success) {
        setSuccessMsg(`Successfully updated user subscription tier to ${newTier}`);
        setUsers(users.map(u => u._id === userId ? { ...u, subscriptionTier: newTier } : u));
        // Refresh stats since subscription tiers count has changed
        const statsRes = await axios.get(`${BACKEND}/admin/stats`, { withCredentials: true });
        if (statsRes.data.success) setStats(statsRes.data.stats);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user subscription tier.');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' ? true : u.subscriptionTier === filterTier;
    return matchesSearch && matchesTier;
  });

  // Calculate highest token usage for responsive progress meters scaling
  const maxTokens = Math.max(...users.map(u => u.tokenUsage?.totalTokens || 0), 1000);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Loading admin console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ShieldIcon className="text-indigo-600 dark:text-indigo-400" />
            Owner Admin Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Monitor system activities, AI token allocations, and manage user memberships.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-700/80 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{stats.totalUsers}</p>
              <div className="flex items-center gap-1.5 pt-1.5">
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {stats.proUsers} Pro
                </span>
                <span className="text-[11px] text-slate-400">
                  ({Math.round((stats.proUsers / (stats.totalUsers || 1)) * 100)}% Conversion)
                </span>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <UsersIcon />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tracked Jobs</span>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{stats.totalJobs}</p>
              <p className="text-[11px] text-slate-400 pt-1.5">
                Average {Math.round(stats.totalJobs / (stats.totalUsers || 1))} jobs / user
              </p>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl">
              <BriefcaseIcon />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Prompt Tokens</span>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {stats.promptTokens.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 pt-1.5">
                Input queries to LLMs
              </p>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-xl">
              <CpuIcon />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Comp / Total</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {stats.completionTokens.toLocaleString()} / {stats.totalTokens.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 pt-1.5">
                Completion / Cumulative Tokens
              </p>
            </div>
            <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
              <CpuIcon />
            </div>
          </div>
        </div>
      )}

      {/* Alert Messaging */}
      {error && (
        <div className="p-4 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 text-sm bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Users Directory Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 self-start">User Directory</h2>
          
          <div className="flex w-full sm:w-auto items-center gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-855 rounded-xl text-sm focus:outline-none focus:border-indigo-500 dark:text-slate-150 transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
              className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free Tier</option>
              <option value="pro">Pro Tier</option>
            </select>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-850">
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">User Info</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Activity</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">AI Tokens Used</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Plan Tier</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const promptT = user.tokenUsage?.promptTokens || 0;
                  const compT = user.tokenUsage?.completionTokens || 0;
                  const totalT = user.tokenUsage?.totalTokens || 0;
                  const pct = Math.min((totalT / maxTokens) * 100, 100);

                  return (
                    <tr key={user._id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-800/10 transition-colors">
                      {/* Column 1: Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.picture ? (
                            <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-zinc-800" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-zinc-400">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">
                                {user.name || 'Anonymous User'}
                              </p>
                              {user.role === 'owner' && (
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 text-[9px] font-bold uppercase tracking-wider px-1 py-0.25 rounded">
                                  Owner
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{user.email}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
                                via {user.activeProvider}
                              </span>
                              <span className="text-slate-300 dark:text-zinc-700 text-[10px]">•</span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Activity */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-600 dark:text-zinc-400">
                            Jobs Tracked: <span className="font-semibold text-slate-800 dark:text-zinc-200">{user.jobCount}</span>
                          </p>
                          <p className="text-xs text-slate-600 dark:text-zinc-400">
                            AI Requests: <span className="font-semibold text-slate-800 dark:text-zinc-200">{user.aiRequestCount}</span>
                          </p>
                        </div>
                      </td>

                      {/* Column 3: Token Usage */}
                      <td className="px-6 py-4">
                        <div className="w-48 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">
                              Total: <span className="font-semibold text-slate-700 dark:text-slate-200">{totalT.toLocaleString()}</span>
                            </span>
                            <span className="text-slate-400">
                              (P: {promptT.toLocaleString()} / C: {compT.toLocaleString()})
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-700/20">
                            <div
                              className="bg-indigo-500 dark:bg-indigo-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Plan Tier */}
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          user.subscriptionTier === 'pro'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/30'
                            : 'bg-slate-50 dark:bg-zinc-800/50 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-700/50'
                        }`}>
                          {user.subscriptionTier === 'pro' ? 'Pro Tier' : 'Free Tier'}
                        </span>
                      </td>

                      {/* Column 5: Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Role Toggle Selector */}
                          <div className="flex flex-col items-start gap-1">
                            <label className="text-[9px] font-bold uppercase text-slate-400 dark:text-zinc-500 tracking-wide text-left">Role</label>
                            <select
                              value={user.role}
                              onChange={e => handleRoleChange(user._id, e.target.value)}
                              className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-semibold px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="user">User</option>
                              <option value="owner">Owner</option>
                            </select>
                          </div>

                          {/* Tier Toggle Switch */}
                          <div className="flex flex-col items-start gap-1">
                            <label className="text-[9px] font-bold uppercase text-slate-400 dark:text-zinc-500 tracking-wide text-left">Tier</label>
                            <button
                              onClick={() => handleTierChange(user._id, user.subscriptionTier === 'pro' ? 'free' : 'pro')}
                              className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${
                                user.subscriptionTier === 'pro'
                                  ? 'bg-red-50 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25'
                                  : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200/50 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/25'
                              }`}
                            >
                              {user.subscriptionTier === 'pro' ? 'Downgrade' : 'Upgrade'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { getReactSelectStyles } from '../utils/reactSelectStyles';

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
    <div className="space-y-8 animate-fade-in text-text-main">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-card pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2.5">
            <ShieldIcon className="text-brand-primary" />
            Owner Admin Console
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Monitor system activities, AI token allocations, and manage user memberships.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="bg-bg-card border border-border-card text-xs font-semibold px-3.5 py-2 rounded-xl text-text-main hover:bg-bg-card-hover transition-all flex items-center gap-2 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-bg-card p-5 rounded-2xl border border-border-card shadow-sm flex items-start justify-between hover:bg-bg-card-hover transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Total Users</span>
              <p className="text-3xl font-extrabold text-text-main tracking-tight">{stats.totalUsers}</p>
              <div className="flex items-center gap-1.5 pt-2">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                  {stats.proUsers} Pro
                </span>
                <span className="text-[10.5px] text-text-muted">
                  ({Math.round((stats.proUsers / (stats.totalUsers || 1)) * 100)}% Conversion)
                </span>
              </div>
            </div>
            <div className="p-3 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xl">
              <UsersIcon />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-bg-card p-5 rounded-2xl border border-border-card shadow-sm flex items-start justify-between hover:bg-bg-card-hover transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Tracked Jobs</span>
              <p className="text-3xl font-extrabold text-text-main tracking-tight">{stats.totalJobs}</p>
              <p className="text-[11px] text-text-muted pt-2.5">
                Average {Math.round(stats.totalJobs / (stats.totalUsers || 1))} jobs / user
              </p>
            </div>
            <div className="p-3 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-xl">
              <BriefcaseIcon />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-bg-card p-5 rounded-2xl border border-border-card shadow-sm flex items-start justify-between hover:bg-bg-card-hover transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">AI Prompt Tokens</span>
              <p className="text-3xl font-extrabold text-text-main tracking-tight">
                {stats.promptTokens.toLocaleString()}
              </p>
              <p className="text-[11px] text-text-muted pt-2.5">
                Input queries to LLMs
              </p>
            </div>
            <div className="p-3 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xl">
              <CpuIcon />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-bg-card p-5 rounded-2xl border border-border-card shadow-sm flex items-start justify-between hover:bg-bg-card-hover transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">AI Comp / Total</span>
              <p className="text-2xl font-extrabold text-text-main tracking-tight leading-none pt-1">
                {stats.completionTokens.toLocaleString()} <span className="text-xs text-text-muted font-normal">/ {stats.totalTokens.toLocaleString()}</span>
              </p>
              <p className="text-[11px] text-text-muted pt-3">
                Completion / Cumulative Tokens
              </p>
            </div>
            <div className="p-3 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-xl">
              <CpuIcon />
            </div>
          </div>
        </div>
      )}

      {/* Alert Messaging */}
      {error && (
        <div className="p-4 text-sm bg-red-500/10 border border-red-500/20 rounded-xl text-red-650 dark:text-red-400 flex items-center gap-2.5 animate-fade-in shadow-sm">
          <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-650 dark:text-emerald-400 flex items-center gap-2.5 animate-fade-in shadow-sm">
          <svg className="w-5 h-5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Users Directory Table */}
      <div className="bg-bg-card border border-border-card rounded-2xl shadow-sm overflow-hidden backdrop-blur-md">
        {/* Table Filters Header */}
        <div className="p-5 border-b border-border-card flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-base font-extrabold text-text-main">User Directory</h2>
          
          <div className="flex w-full sm:w-auto items-center gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border-card bg-bg-app rounded-xl text-sm focus:outline-none focus:border-brand-primary text-text-main placeholder:text-text-muted transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <Select
              value={[
                { value: 'all', label: 'All Tiers' },
                { value: 'free', label: 'Free Tier' },
                { value: 'pro', label: 'Pro Tier' }
              ].find(o => o.value === filterTier)}
              onChange={(opt) => setFilterTier(opt ? opt.value : 'all')}
              options={[
                { value: 'all', label: 'All Tiers' },
                { value: 'free', label: 'Free Tier' },
                { value: 'pro', label: 'Pro Tier' }
              ]}
              styles={getReactSelectStyles()}
              id="admin-filter-tier-select"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-bg-app/40 border-b border-border-card">
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">User Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Activity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">AI Tokens Used</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Referrals</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Plan Tier</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card/30">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-text-muted">
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
                    <tr key={user._id} className="hover:bg-bg-card-hover/40 transition-colors border-b border-border-card/20">
                       {/* Column 1: Info */}
                      <td className="px-6 py-4.5 align-middle">
                        <div className="flex items-center gap-3.5">
                          {user.picture ? (
                            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-border-card" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-sm font-bold text-white shadow-md shadow-brand-primary/10">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-text-main leading-tight">
                                {user.name || 'Anonymous User'}
                              </p>
                              {user.role === 'owner' && (
                                <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/25 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none shrink-0">
                                  Owner
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted mt-1 leading-none">{user.email}</p>
                            <div className="flex items-center gap-1.5 mt-2 leading-none">
                              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                                via {user.activeProvider}
                              </span>
                              <span className="text-text-muted text-[10px]">•</span>
                              <span className="text-[10px] text-text-muted">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Activity */}
                      <td className="px-6 py-4.5 align-middle">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-text-main leading-none">
                            <span className="text-text-muted">Jobs:</span>
                            <span className="bg-brand-accent/10 text-brand-accent border border-brand-accent/20 text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">{user.jobCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-text-main leading-none">
                            <span className="text-text-muted">Requests:</span>
                            <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">{user.aiRequestCount}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Token Usage */}
                      <td className="px-6 py-4.5 align-middle">
                        <div className="w-48 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] leading-none">
                            <span className="text-text-muted">
                              Total: <span className="font-bold text-text-main">{totalT.toLocaleString()}</span>
                            </span>
                            <span className="text-text-muted font-medium">
                              (P: {promptT.toLocaleString()} / C: {compT.toLocaleString()})
                            </span>
                          </div>
                          <div className="w-full bg-bg-app h-2 rounded-full overflow-hidden border border-border-card p-[1px]">
                            <div
                              className="bg-gradient-to-r from-brand-primary to-brand-accent h-full rounded-full transition-all duration-300 shadow-sm"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column: Referrals */}
                      <td className="px-6 py-4.5 align-middle">
                        <div className="space-y-1.5 text-xs">
                          {user.referralCode ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Code:</span>
                                <span className="font-mono text-[10px] font-bold bg-bg-app text-text-main px-2 py-0.5 rounded select-all border border-border-card leading-none">
                                  {user.referralCode}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5 text-[10px] text-text-muted">
                                <span>Clicks: <strong className="text-text-main">{user.referralClicks || 0}</strong></span>
                                <span>Pro Converts: <strong className="text-brand-primary">{user.referralConversions || 0}</strong></span>
                              </div>
                            </>
                          ) : (
                            <span className="text-text-muted italic">No code</span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Plan Tier */}
                      <td className="px-6 py-4.5 align-middle">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.75 rounded-full border leading-none inline-block ${
                          user.subscriptionTier === 'pro'
                            ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                            : 'bg-bg-card-hover text-text-muted border-border-card'
                        }`}>
                          {user.subscriptionTier === 'pro' ? 'Pro Tier' : 'Free Tier'}
                        </span>
                      </td>

                      {/* Column 5: Actions */}
                      <td className="px-6 py-4.5 text-right align-middle">
                        <div className="flex items-center justify-end gap-3.5">
                          {/* Role Selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase text-text-muted tracking-wider">Role</span>
                            <div className="w-28 text-left">
                              <Select
                                value={[
                                  { value: 'user', label: 'User' },
                                  { value: 'owner', label: 'Owner' }
                                ].find(o => o.value === user.role)}
                                onChange={(opt) => { if (opt) handleRoleChange(user._id, opt.value); }}
                                options={[
                                  { value: 'user', label: 'User' },
                                  { value: 'owner', label: 'Owner' }
                                ]}
                                styles={getReactSelectStyles()}
                                id={`admin-user-role-${user._id}`}
                              />
                            </div>
                          </div>

                          {/* Tier Toggle Switch */}
                          <button
                            onClick={() => handleTierChange(user._id, user.subscriptionTier === 'pro' ? 'free' : 'pro')}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all shadow-sm ${
                              user.subscriptionTier === 'pro'
                                ? 'bg-red-500/10 border-red-500/20 text-red-650 dark:text-red-400 hover:bg-red-500/20'
                                : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20'
                            }`}
                          >
                            {user.subscriptionTier === 'pro' ? 'Downgrade' : 'Upgrade'}
                          </button>
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

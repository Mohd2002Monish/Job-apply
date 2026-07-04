import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

const TagIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const PackageIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');

  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgForm, setPkgForm] = useState({
    name: '',
    description: '',
    priceINR: 999,
    priceUSD: 12,
    duration: 'monthly',
    features: '',
    isPopular: false
  });

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 20,
    maxUses: 50,
    expiresAt: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, usersRes, pkgsRes, couponsRes] = await Promise.all([
        axios.get(`${BACKEND}/admin/stats`, { withCredentials: true }),
        axios.get(`${BACKEND}/admin/users`, { withCredentials: true }),
        axios.get(`${BACKEND}/admin/packages`, { withCredentials: true }),
        axios.get(`${BACKEND}/admin/coupons`, { withCredentials: true })
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (pkgsRes.data.success) setPackages(pkgsRes.data.packages);
      if (couponsRes.data.success) setCoupons(couponsRes.data.coupons);
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

  const handleTierChange = async (userId, newTier) => {
    try {
      setError('');
      setSuccessMsg('');
      const res = await axios.patch(`${BACKEND}/admin/users/${userId}/tier`, { subscriptionTier: newTier }, { withCredentials: true });
      if (res.data.success) {
        setSuccessMsg(`Successfully updated user subscription tier to ${newTier}`);
        setUsers(users.map(u => u._id === userId ? { ...u, subscriptionTier: newTier } : u));
        const statsRes = await axios.get(`${BACKEND}/admin/stats`, { withCredentials: true });
        if (statsRes.data.success) setStats(statsRes.data.stats);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user subscription tier.');
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await axios.post(`${BACKEND}/admin/packages`, pkgForm, { withCredentials: true });
      if (res.data.success) {
        setSuccessMsg('Package created successfully!');
        setPackages([res.data.package, ...packages]);
        setShowPkgModal(false);
        setPkgForm({ name: '', description: '', priceINR: 999, priceUSD: 12, duration: 'monthly', features: '', isPopular: false });
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create package.');
    }
  };

  const handleDeletePackage = async (pkgId) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      setError('');
      const res = await axios.delete(`${BACKEND}/admin/packages/${pkgId}`, { withCredentials: true });
      if (res.data.success) {
        setSuccessMsg('Package deleted.');
        setPackages(packages.filter(p => p._id !== pkgId));
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete package.');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await axios.post(`${BACKEND}/admin/coupons`, couponForm, { withCredentials: true });
      if (res.data.success) {
        setSuccessMsg('Coupon created successfully!');
        setCoupons([res.data.coupon, ...coupons]);
        setShowCouponModal(false);
        setCouponForm({ code: '', discountType: 'percentage', discountValue: 20, maxUses: 50, expiresAt: '' });
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create coupon.');
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      setError('');
      const res = await axios.patch(`${BACKEND}/admin/coupons/${couponId}/toggle`, {}, { withCredentials: true });
      if (res.data.success) {
        setCoupons(coupons.map(c => c._id === couponId ? res.data.coupon : c));
        setSuccessMsg(res.data.message);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle coupon.');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      setError('');
      const res = await axios.delete(`${BACKEND}/admin/coupons/${couponId}`, { withCredentials: true });
      if (res.data.success) {
        setSuccessMsg('Coupon deleted.');
        setCoupons(coupons.filter(c => c._id !== couponId));
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete coupon.');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' ? true : u.subscriptionTier === filterTier;
    return matchesSearch && matchesTier;
  });

  const maxTokens = Math.max(...users.map(u => u.tokenUsage?.totalTokens || 0), 1000);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-text-muted">Loading admin console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-text-main w-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border-card pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight flex items-center gap-2.5">
            <ShieldIcon className="text-brand-primary" />
            Owner Admin Console
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Monitor system activities, manage subscription packages, and create discount coupons with usage limits.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="bg-bg-card border border-border-card text-xs font-bold px-3.5 py-2 rounded-xl text-text-main hover:bg-bg-card-hover transition-all flex items-center gap-2 shadow-sm btn-tactile"
        >
          <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border-card pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all btn-tactile ${
            activeTab === 'users'
              ? 'bg-brand-primary text-white shadow-md'
              : 'bg-bg-card text-text-muted hover:text-text-main hover:bg-bg-card-hover border border-border-card'
          }`}
        >
          <UsersIcon size={16} />
          User Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all btn-tactile ${
            activeTab === 'packages'
              ? 'bg-brand-primary text-white shadow-md'
              : 'bg-bg-card text-text-muted hover:text-text-main hover:bg-bg-card-hover border border-border-card'
          }`}
        >
          <PackageIcon size={16} />
          Pricing Packages ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all btn-tactile ${
            activeTab === 'coupons'
              ? 'bg-brand-primary text-white shadow-md'
              : 'bg-bg-card text-text-muted hover:text-text-main hover:bg-bg-card-hover border border-border-card'
          }`}
        >
          <TagIcon size={16} />
          Discount Coupons ({coupons.length})
        </button>
      </div>

      {/* Alert Messaging */}
      {error && (
        <div className="p-4 text-sm bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-2.5 animate-fade-in font-semibold">
          <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 flex items-center gap-2.5 animate-fade-in font-semibold">
          <svg className="w-5 h-5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <>
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-card p-5 rounded-2xl border border-border-card shadow-sm flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Total Users</span>
                  <p className="text-3xl font-extrabold text-text-main tracking-tight">{stats.totalUsers}</p>
                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                      {stats.proUsers} Pro
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xl">
                  <UsersIcon />
                </div>
              </div>

              <div className="bg-bg-card p-5 rounded-2xl border border-border-card shadow-sm flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Tracked Jobs</span>
                  <p className="text-3xl font-extrabold text-text-main tracking-tight">{stats.totalJobs}</p>
                </div>
                <div className="p-3 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-xl">
                  <BriefcaseIcon />
                </div>
              </div>

              <div className="bg-bg-card p-5 rounded-2xl border border-border-card shadow-sm flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">AI Prompt Tokens</span>
                  <p className="text-3xl font-extrabold text-text-main tracking-tight">
                    {stats.promptTokens.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xl">
                  <CpuIcon />
                </div>
              </div>

              <div className="bg-bg-card p-5 rounded-2xl border border-border-card shadow-sm flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Cumulative Tokens</span>
                  <p className="text-2xl font-extrabold text-text-main tracking-tight leading-none pt-1">
                    {stats.completionTokens.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-xl">
                  <CpuIcon />
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-bg-card border border-border-card rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border-card flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="text-base font-extrabold text-text-main">User Directory</h2>
              <div className="flex w-full sm:w-auto items-center gap-3 shrink-0">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-4 py-2 border border-border-card bg-bg-app rounded-xl text-sm text-text-main placeholder:text-text-muted"
                  />
                </div>
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
                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">AI Tokens</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Referrals</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Tier</th>
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
                      const totalT = user.tokenUsage?.totalTokens || 0;
                      const pct = Math.min((totalT / maxTokens) * 100, 100);

                      return (
                        <tr key={user._id} className="hover:bg-bg-card-hover/40 transition-colors border-b border-border-card/20">
                          <td className="px-6 py-4.5 align-middle">
                            <div className="flex items-center gap-3.5">
                              {user.picture ? (
                                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-border-card" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-sm font-bold text-white">
                                  {user.name?.charAt(0) || 'U'}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-text-main">{user.name || 'Anonymous User'}</p>
                                  {user.role === 'owner' && (
                                    <span className="bg-brand-primary/10 text-brand-primary text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">Owner</span>
                                  )}
                                </div>
                                <p className="text-xs text-text-muted mt-1">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 align-middle text-xs">
                            <div>Jobs: <strong className="text-brand-accent">{user.jobCount}</strong></div>
                            <div>Requests: <strong className="text-brand-primary">{user.aiRequestCount}</strong></div>
                          </td>
                          <td className="px-6 py-4.5 align-middle">
                            <div className="w-36 space-y-1">
                              <div className="text-[10px] text-text-muted">Total: {totalT.toLocaleString()}</div>
                              <div className="w-full bg-bg-app h-1.5 rounded-full overflow-hidden border border-border-card">
                                <div className="bg-brand-primary h-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 align-middle text-xs">
                            {user.referralCode ? (
                              <span className="font-mono text-[10px] font-bold bg-bg-app px-2 py-0.5 rounded border border-border-card">
                                {user.referralCode} ({user.referralClicks || 0} clicks)
                              </span>
                            ) : <span className="text-text-muted italic">None</span>}
                          </td>
                          <td className="px-6 py-4.5 align-middle">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.75 rounded-full border ${
                              user.subscriptionTier === 'pro' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-bg-card-hover text-text-muted border-border-card'
                            }`}>
                              {user.subscriptionTier === 'pro' ? 'Pro Tier' : 'Free Tier'}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right align-middle">
                            <button
                              onClick={() => handleTierChange(user._id, user.subscriptionTier === 'pro' ? 'free' : 'pro')}
                              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border bg-brand-primary/10 border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 btn-tactile"
                            >
                              {user.subscriptionTier === 'pro' ? 'Downgrade' : 'Upgrade'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: PACKAGES MANAGER */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-main">Pricing Packages</h2>
              <p className="text-xs text-text-muted">Create custom subscription plans and one-time pricing packages.</p>
            </div>
            <button
              onClick={() => setShowPkgModal(true)}
              className="bg-brand-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md btn-tactile"
            >
              + Create New Package
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-text-muted bg-bg-card rounded-2xl border border-border-card">
                No custom packages created yet.
              </div>
            ) : (
              packages.map(pkg => (
                <div key={pkg._id} className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-primary/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-extrabold text-text-main">{pkg.name}</h3>
                      {pkg.isPopular && (
                        <span className="bg-brand-accent/10 text-brand-accent border border-brand-accent/20 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mb-4 leading-relaxed">{pkg.description || 'No description provided.'}</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-extrabold text-text-main">₹{pkg.priceINR}</span>
                      <span className="text-xs text-text-muted">/ ${pkg.priceUSD}</span>
                      <span className="text-[10px] text-brand-primary font-bold uppercase">({pkg.duration})</span>
                    </div>
                    <ul className="space-y-2 text-xs text-text-muted border-t border-border-card pt-4">
                      {pkg.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between border-t border-border-card pt-4">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      pkg.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {pkg.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => handleDeletePackage(pkg._id)}
                      className="text-xs text-red-500 hover:underline font-bold btn-tactile"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COUPONS MANAGER */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-main">Coupons & Promo Codes</h2>
              <p className="text-xs text-text-muted">Create discount codes with usage limits, redemption caps, and expiration dates.</p>
            </div>
            <button
              onClick={() => setShowCouponModal(true)}
              className="bg-brand-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md btn-tactile"
            >
              + Create New Coupon
            </button>
          </div>

          <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-app/40 border-b border-border-card text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  <th className="px-6 py-4">Coupon Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Usage Limit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-card/30">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-sm text-text-muted">
                      No discount coupons created yet.
                    </td>
                  </tr>
                ) : (
                  coupons.map(coupon => {
                    const isLimitReached = coupon.usedCount >= coupon.maxUses;
                    const pct = Math.min((coupon.usedCount / coupon.maxUses) * 100, 100);

                    return (
                      <tr key={coupon._id} className="hover:bg-bg-card-hover/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-sm text-brand-primary">
                          {coupon.code}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-text-main">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="w-44 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-text-main">
                              <span>Redeemed: {coupon.usedCount} / {coupon.maxUses}</span>
                            </div>
                            <div className="w-full bg-bg-app h-1.5 rounded-full overflow-hidden border border-border-card">
                              <div
                                className={`h-full ${isLimitReached ? 'bg-red-500' : 'bg-brand-primary'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            coupon.isActive && !isLimitReached
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {isLimitReached ? 'Limit Reached' : (coupon.isActive ? 'Active' : 'Disabled')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => handleToggleCoupon(coupon._id)}
                            className="text-xs font-bold text-brand-primary hover:underline btn-tactile"
                          >
                            {coupon.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            className="text-xs font-bold text-red-500 hover:underline btn-tactile"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PACKAGE MODAL */}
      {showPkgModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-md space-y-4 animate-fade-in shadow-2xl origin-aware-popover">
            <h3 className="text-lg font-bold text-text-main">Create New Pricing Package</h3>
            <form onSubmit={handleCreatePackage} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-text-muted mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pro Monthly Plan"
                  value={pkgForm.name}
                  onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })}
                  className="w-full p-2.5 border border-border-card bg-bg-app rounded-xl text-text-main"
                />
              </div>
              <div>
                <label className="block font-bold text-text-muted mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short description..."
                  value={pkgForm.description}
                  onChange={e => setPkgForm({ ...pkgForm, description: e.target.value })}
                  className="w-full p-2.5 border border-border-card bg-bg-app rounded-xl text-text-main"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text-muted mb-1">Price (INR ₹)</label>
                  <input
                    type="number"
                    required
                    value={pkgForm.priceINR}
                    onChange={e => setPkgForm({ ...pkgForm, priceINR: Number(e.target.value) })}
                    className="w-full p-2.5 border border-border-card bg-bg-app rounded-xl text-text-main"
                  />
                </div>
                <div>
                  <label className="block font-bold text-text-muted mb-1">Price (USD $)</label>
                  <input
                    type="number"
                    required
                    value={pkgForm.priceUSD}
                    onChange={e => setPkgForm({ ...pkgForm, priceUSD: Number(e.target.value) })}
                    className="w-full p-2.5 border border-border-card bg-bg-app rounded-xl text-text-main"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-text-muted mb-1">Features (Comma separated)</label>
                <textarea
                  placeholder="Unlimited AI Applications, Full Resume Builder, Email Matching"
                  value={pkgForm.features}
                  onChange={e => setPkgForm({ ...pkgForm, features: e.target.value })}
                  className="w-full p-2.5 border border-border-card bg-bg-app rounded-xl text-text-main"
                  rows="3"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="px-4 py-2 font-bold text-text-muted hover:text-text-main btn-tactile"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-primary rounded-xl shadow-md btn-tactile"
                >
                  Create Package
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE COUPON MODAL */}
      {showCouponModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-md space-y-4 animate-fade-in shadow-2xl origin-aware-popover">
            <h3 className="text-lg font-bold text-text-main">Create Discount Coupon</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-text-muted mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME50"
                  value={couponForm.code}
                  onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 border border-border-card bg-bg-app rounded-xl font-mono text-text-main"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text-muted mb-1">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full p-2.5 border border-border-card bg-bg-app rounded-xl text-text-main"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Flat)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-text-muted mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full p-2.5 border border-border-card bg-bg-app rounded-xl text-text-main"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-text-muted mb-1">Usage Limit (Max Total Redemptions)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="50"
                  value={couponForm.maxUses}
                  onChange={e => setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })}
                  className="w-full p-2.5 border border-border-card bg-bg-app rounded-xl text-text-main"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 font-bold text-text-muted hover:text-text-main btn-tactile"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-primary rounded-xl shadow-md btn-tactile"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

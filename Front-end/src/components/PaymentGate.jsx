import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

const ShieldIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
);

const PaymentGate = ({ user, onUpgradeSuccess, handleLogout }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [showSimulatedSuccess, setShowSimulatedSuccess] = useState(false);
  const [mockOrderDetails, setMockOrderDetails] = useState(null);

  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    let active = true;

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz.startsWith('Asia/')) {
        setCurrency('INR');
      } else {
        setCurrency('USD');
      }
    } catch (e) {}

    fetch('https://ipapi.co/json/')
      .then(res => {
        if (!res.ok) throw new Error('IP API error');
        return res.json();
      })
      .then(data => {
        if (active && data && data.country_code) {
          if (data.country_code === 'IN') {
            setCurrency('INR');
          } else {
            setCurrency('USD');
          }
        }
      })
      .catch(err => {
        console.warn('[IP Geolocation] Fallback to timezone:', err.message);
      });

    axios.get(`${BACKEND}/packages`)
      .then(res => {
        if (res.data.success && res.data.packages?.length > 0) {
          setPackages(res.data.packages);
          const pop = res.data.packages.find(p => p.isPopular) || res.data.packages[0];
          if (pop) setSelectedPackageId(pop._id);
        }
      })
      .catch(err => console.log('Package fetch error:', err.message));

    return () => {
      active = false;
    };
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await axios.post(`${BACKEND}/payment/coupon/validate`, {
        code: couponCodeInput,
        packageId: selectedPackageId,
        currency
      }, { withCredentials: true });

      if (res.data.success && res.data.valid) {
        setAppliedCoupon(res.data);
        setCouponError('');
      } else {
        setCouponError(res.data.error || 'Invalid coupon.');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Failed to validate coupon.');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment gateway script. Please check your internet connection.');
        setLoading(false);
        return;
      }

      const orderRes = await axios.post(`${BACKEND}/payment/razorpay/create-order`, {
        currency,
        packageId: selectedPackageId,
        couponCode: appliedCoupon ? appliedCoupon.coupon.code : (couponCodeInput.trim() || undefined)
      }, { withCredentials: true });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.error || 'Failed to initialize order on server.');
      }

      const orderData = orderRes.data;

      if (orderData.isMock || orderData.orderId.startsWith('order_mock_')) {
        setMockOrderDetails(orderData);
        setShowSimulatedSuccess(true);
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'RecoCareer.ai',
        description: 'Pro Plan Subscription',
        order_id: orderData.orderId,
        handler: async function (response) {
          setLoading(true);
          try {
            const verifyRes = await axios.post(`${BACKEND}/payment/razorpay/verify`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              couponCode: appliedCoupon ? appliedCoupon.coupon.code : (couponCodeInput.trim() || undefined),
              isMock: false
            }, { withCredentials: true });

            if (verifyRes.data.success) {
              onUpgradeSuccess();
            } else {
              setError('Payment verification failed.');
            }
          } catch (err) {
            setError(err.response?.data?.error || 'Verification server error.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Payment initiation failed.');
      setLoading(false);
    }
  };

  const handleSimulatedSuccessConfirm = async () => {
    if (!mockOrderDetails) return;
    setLoading(true);
    try {
      const verifyRes = await axios.post(`${BACKEND}/payment/razorpay/verify`, {
        razorpay_order_id: mockOrderDetails.orderId,
        couponCode: appliedCoupon ? appliedCoupon.coupon.code : (couponCodeInput.trim() || undefined),
        isMock: true
      }, { withCredentials: true });

      if (verifyRes.data.success) {
        setShowSimulatedSuccess(false);
        onUpgradeSuccess();
      } else {
        setError('Simulation verification failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification server error.');
    } finally {
      setLoading(false);
    }
  };

  const formatPriceNum = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    const num = Number(val);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const selectedPkgObj = packages.find(p => p._id === selectedPackageId);
  const basePriceDisplay = selectedPkgObj
    ? (currency === 'INR' ? `₹${selectedPkgObj.priceINR}` : `$${selectedPkgObj.priceUSD}`)
    : (currency === 'INR' ? '₹999' : '$12');

  return (
    <div className="min-h-screen bg-bg-app text-text-main flex items-center justify-center p-5 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[10%] w-[30rem] h-[30rem] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[30rem] h-[30rem] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-bg-card border border-border-card rounded-2xl p-8 md:p-10 relative z-10 flex flex-col items-center text-center shadow-2xl">
        {/* Header Shield */}
        <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6">
          <ShieldIcon />
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-3">
          Pro Plan <span className="text-gradient">Required</span>
        </h1>
        <p className="text-sm text-text-muted max-w-sm leading-relaxed mb-6">
          You are logged in as <strong className="text-text-main">{user?.email}</strong>. Select a plan to unlock full AI application tracking and outreach.
        </p>

        {/* Dynamic Package Selector */}
        {packages.length > 0 && (
          <div className="w-full mb-6 text-left space-y-2">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Select Pricing Plan:</label>
            <div className="grid grid-cols-1 gap-2">
              {packages.map(pkg => {
                const isSelected = pkg._id === selectedPackageId;
                return (
                  <div
                    key={pkg._id}
                    onClick={() => { setSelectedPackageId(pkg._id); setAppliedCoupon(null); }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between btn-tactile ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/10 text-text-main shadow-sm'
                        : 'border-border-card bg-bg-app hover:bg-bg-card-hover'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-text-main">{pkg.name}</span>
                        {pkg.isPopular && (
                          <span className="bg-brand-primary text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Popular</span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-text-main">
                        {currency === 'INR' ? `₹${pkg.priceINR}` : `$${pkg.priceUSD}`}
                      </span>
                      <span className="text-[10px] block text-text-muted font-medium">/{pkg.duration}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing & Discount Details */}
        <div className="mb-6 w-full">
          <div className="flex items-center justify-center gap-3 mb-1 flex-wrap">
            {appliedCoupon ? (
              <div className="flex items-baseline gap-2.5 flex-wrap justify-center">
                <span className="text-lg line-through text-text-muted">
                  {basePriceDisplay}
                </span>
                <span className="text-3xl md:text-4xl font-extrabold text-emerald-500 tracking-tight">
                  {currency === 'INR' ? `₹${formatPriceNum(appliedCoupon.finalPrice)}` : `$${formatPriceNum(appliedCoupon.finalPrice)}`}
                </span>
              </div>
            ) : (
              <span className="text-4xl font-extrabold text-text-main tracking-tight">
                {basePriceDisplay}
              </span>
            )}
            <span className="text-xs text-text-muted">/month</span>
          </div>

          {appliedCoupon && (
            <p className="text-xs text-emerald-500 font-bold mt-2 bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-3 rounded-xl inline-block">
              Coupon <strong>{appliedCoupon.coupon.code}</strong> applied! Saved {currency === 'INR' ? `₹${formatPriceNum(appliedCoupon.discountAmount)}` : `$${formatPriceNum(appliedCoupon.discountAmount)}`}
            </p>
          )}

          <p className="text-xs text-brand-primary font-bold mt-2">Secure checkout via Razorpay</p>
        </div>

        {/* Coupon Input Form */}
        <div className="w-full mb-6 border-t border-border-card pt-4">
          {!appliedCoupon ? (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code (e.g. WELCOME50)"
                value={couponCodeInput}
                onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border border-border-card bg-bg-app text-text-main focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                disabled={validatingCoupon || !couponCodeInput.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 transition-all shadow-sm btn-tactile"
              >
                {validatingCoupon ? 'Checking...' : 'Apply'}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500">
              <span>Code: <strong>{appliedCoupon.coupon.code}</strong> (Applied)</span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-xs text-rose-500 hover:underline font-bold btn-tactile"
              >
                Remove
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-rose-500 mt-2 font-bold text-left">{couponError}</p>
          )}
        </div>

        {/* Features Checklist */}
        <ul className="w-full max-w-xs text-left space-y-2.5 mb-8 border-t border-border-card pt-6">
          {[
            'Unlimited job application tracking',
            'Full AI Outreach email & cover letter matching',
            'All premium resume builder templates',
            'AI voice interview practice simulator',
            'AI salary negotiation assistant',
          ].map((feat, i) => (
            <li key={i} className="flex items-start gap-3 text-xs text-text-muted">
              <span className="mt-0.5 flex-shrink-0">
                <CheckIcon />
              </span>
              {feat}
            </li>
          ))}
        </ul>

        {error && (
          <p className="text-xs text-rose-500 mb-4 animate-fade-in font-bold">{error}</p>
        )}

        {/* CTA Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-extrabold text-sm text-white bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 btn-tactile"
          >
            {loading ? <LoaderIcon /> : 'Subscribe Now'}
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl font-bold text-xs border border-border-card bg-bg-app text-text-muted hover:text-rose-500 transition-colors btn-tactile"
          >
            Sign Out of Account
          </button>
        </div>
      </div>

      {/* Simulated Sandbox Success Modal */}
      {showSimulatedSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-bg-card border border-border-card rounded-2xl p-6 md:p-8 z-10 text-center animate-fade-in shadow-2xl origin-aware-popover">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Razorpay Simulator</h3>
            <p className="text-xs text-text-muted mb-6 leading-relaxed">
              No Razorpay API keys are configured in your <code>.env</code>. We created a simulated order: <code className="block bg-bg-app p-1.5 rounded mt-1.5 font-mono">{mockOrderDetails?.orderId}</code>
            </p>
            {mockOrderDetails?.couponCode && (
              <div className="p-2.5 mb-4 rounded-xl bg-emerald-500/10 text-xs font-bold text-emerald-500">
                Applied Coupon: {mockOrderDetails.couponCode} (Discounted Price: {mockOrderDetails.currency === 'USD' ? `$${formatPriceNum(mockOrderDetails.finalPrice)}` : `₹${formatPriceNum(mockOrderDetails.finalPrice)}`})
              </div>
            )}
            <div className="space-y-2">
              <button
                onClick={handleSimulatedSuccessConfirm}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 btn-tactile"
              >
                {loading ? <LoaderIcon /> : 'Simulate Success Payment'}
              </button>
              <button
                onClick={() => setShowSimulatedSuccess(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs border border-border-card bg-bg-app text-text-muted hover:text-text-main btn-tactile"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentGate;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

const ShieldIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
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
  const [currency, setCurrency] = useState('INR'); // Default to INR
  const [showSimulatedSuccess, setShowSimulatedSuccess] = useState(false);
  const [mockOrderDetails, setMockOrderDetails] = useState(null);

  // Automatically detect location by IP address with timezone fallback
  useEffect(() => {
    let active = true;

    // Apply timezone guess as an instant fallback
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz.startsWith('Asia/')) {
        setCurrency('INR');
      } else {
        setCurrency('USD');
      }
    } catch (e) {}

    // Detect location by public IP
    fetch('https://ipapi.co/json/')
      .then(res => {
        if (!res.ok) throw new Error('IP API error');
        return res.json();
      })
      .then(data => {
        if (active && data && data.country_code) {
          console.log(`[IP Geolocation] Country detected: ${data.country_code}`);
          if (data.country_code === 'IN') {
            setCurrency('INR');
          } else {
            setCurrency('USD');
          }
        }
      })
      .catch(err => {
        console.warn('[IP Geolocation] Failed, using timezone fallback:', err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  // Dynamically load Razorpay SDK script
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

      // 1. Create order on backend
      const orderRes = await axios.post(`${BACKEND}/payment/razorpay/create-order`, {
        currency
      }, { withCredentials: true });

      if (!orderRes.data.success) {
        throw new Error('Failed to initialize order on server.');
      }

      const orderData = orderRes.data;

      // 2. If it is simulated mode (mock key), show a simulated success modal directly
      if (orderData.isMock || orderData.orderId.startsWith('order_mock_')) {
        setMockOrderDetails(orderData);
        setShowSimulatedSuccess(true);
        setLoading(false);
        return;
      }

      // 3. Open real Razorpay modal
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'RecoCareer.ai',
        description: 'Pro Plan Monthly Subscription',
        order_id: orderData.orderId,
        handler: async function (response) {
          setLoading(true);
          try {
            const verifyRes = await axios.post(`${BACKEND}/payment/razorpay/verify`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
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

  return (
    <div className="min-h-screen bg-bg-app text-text-main flex items-center justify-center p-5 relative overflow-hidden">
      {/* Background neon blobs */}
      <div className="absolute top-[-10%] left-[10%] w-[30rem] h-[30rem] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[30rem] h-[30rem] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg neo-card p-8 md:p-10 relative z-10 flex flex-col items-center text-center">
        {/* Header Shield */}
        <div className="w-16 h-16 rounded-2xl neo-card flex items-center justify-center mb-6">
          <ShieldIcon />
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-3">
          Pro Plan <span className="text-gradient">Required</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-6">
          You are currently logged in as <strong>{user?.email}</strong>. Upgrade to our premium Pro tier to unlock the entire outreach pipeline, CV builder, and interview prep.
        </p>



        {/* Pricing details */}
        <div className="mb-6">
          <div className="flex items-end justify-center gap-1.5 mb-1">
            <span className="text-4xl font-extrabold text-slate-950 dark:text-slate-50">
              {currency === 'INR' ? '₹999' : '$12'}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">/month</span>
          </div>
          <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold">Secure checkout via Razorpay</p>
        </div>

        {/* Features Checklist */}
        <ul className="w-full max-w-xs text-left space-y-2.5 mb-8 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
          {[
            'Unlimited job application tracking',
            'Full AI Outreach email & cover letter matching',
            'All premium resume builder templates',
            'AI voice interview practice simulator',
            'AI salary negotiation assistant',
          ].map((feat, i) => (
            <li key={i} className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-350">
              <span className="mt-0.5 flex-shrink-0">
                <CheckIcon />
              </span>
              {feat}
            </li>
          ))}
        </ul>

        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 mb-4 animate-fade-in">{error}</p>
        )}

        {/* CTA Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <LoaderIcon /> : 'Subscribe Now'}
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl font-bold text-xs neo-btn text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors"
          >
            Sign Out of Account
          </button>
        </div>
      </div>

      {/* Simulated Sandbox Success Modal */}
      {showSimulatedSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-[4px]" />
          <div className="relative w-full max-w-sm neo-card p-6 md:p-8 z-10 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-4 animate-float">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Razorpay Simulator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              No Razorpay API keys are configured in your <code>.env</code>. We created a simulated order: <code className="block bg-slate-100 dark:bg-zinc-800 p-1.5 rounded mt-1.5">{mockOrderDetails?.orderId}</code>
            </p>
            <div className="space-y-2">
              <button
                onClick={handleSimulatedSuccessConfirm}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {loading ? <LoaderIcon /> : 'Simulate Success Payment'}
              </button>
              <button
                onClick={() => setShowSimulatedSuccess(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs neo-btn text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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

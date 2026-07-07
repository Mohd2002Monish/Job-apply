import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const GATEWAY_DEFAULTS = {
  razorpay: {
    displayName: 'Razorpay',
    countries: ['IN'],
    supportedCurrencies: ['INR'],
    fields: [
      { key: 'keyId',         label: 'Key ID',               placeholder: 'rzp_live_xxxxxxxxxxxx', hint: 'Your Razorpay Key ID (Dashboard → Settings → API Keys)' },
      { key: 'keySecret',     label: 'Key Secret',           placeholder: 'Leave blank to keep existing', hint: 'Your Razorpay Key Secret (shown once)' },
      { key: 'webhookSecret', label: 'Webhook Secret',       placeholder: 'Leave blank to keep existing', hint: 'Dashboard → Webhooks → Secret' },
      { key: 'planIdINR',     label: 'Subscription Plan INR',placeholder: 'plan_xxxxxxxxxxxxxx',    hint: 'For autopay in INR (Dashboard → Subscriptions → Plans)' },
      { key: 'planIdUSD',     label: 'Subscription Plan USD',placeholder: 'plan_xxxxxxxxxxxxxx',    hint: 'For autopay in USD (optional)' },
    ],
  },
  stripe: {
    displayName: 'Stripe',
    countries: ['US', 'GB', 'AU', 'CA', 'DE', 'FR'],
    supportedCurrencies: ['USD', 'GBP', 'EUR'],
    fields: [
      { key: 'keyId',         label: 'Publishable Key',      placeholder: 'pk_live_xxxxxxxxxxxx',  hint: 'Dashboard → Developers → API Keys → Publishable key' },
      { key: 'keySecret',     label: 'Secret Key',           placeholder: 'Leave blank to keep existing', hint: 'Dashboard → Developers → API Keys → Secret key' },
      { key: 'webhookSecret', label: 'Webhook Secret',       placeholder: 'Leave blank to keep existing', hint: 'Dashboard → Developers → Webhooks → Signing secret' },
      { key: 'priceId',       label: 'Price ID',             placeholder: 'price_xxxxxxxxxxxxxx',  hint: 'Subscription price ID from Stripe Products' },
    ],
  },
};

const COUNTRY_OPTIONS = [
  { code: 'IN', label: 'India' }, { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' }, { code: 'AU', label: 'Australia' },
  { code: 'CA', label: 'Canada' }, { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' }, { code: 'AE', label: 'UAE' },
  { code: 'SG', label: 'Singapore' }, { code: 'NZ', label: 'New Zealand' },
];

export default function PaymentGatewayPanel() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [testing, setTesting] = useState({});
  const [testResult, setTestResult] = useState({});
  const [editingGateway, setEditingGateway] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/payment-config`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setConfigs(data.configs);
    } catch (err) {
      setError('Failed to load payment configs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const startEdit = (gateway) => {
    const existing = configs.find(c => c.gateway === gateway);
    const defaults = GATEWAY_DEFAULTS[gateway];
    setFormData({
      gateway,
      displayName: existing?.displayName || defaults.displayName,
      isEnabled: existing?.isEnabled ?? false,
      isLive: existing?.isLive ?? false,
      isDefault: existing?.isDefault ?? false,
      countries: existing?.countries || defaults.countries,
      supportedCurrencies: existing?.supportedCurrencies || defaults.supportedCurrencies,
      credentials: { keyId: '', keySecret: '', webhookSecret: '', planIdINR: '', planIdUSD: '', priceId: '' },
    });
    setEditingGateway(gateway);
    setTestResult({});
  };

  const handleSave = async () => {
    setSaving(s => ({ ...s, [editingGateway]: true }));
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/payment-config`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        await fetchConfigs();
        setEditingGateway(null);
      } else {
        setError(data.error || 'Save failed.');
      }
    } catch (err) {
      setError('Save failed: ' + err.message);
    } finally {
      setSaving(s => ({ ...s, [editingGateway]: false }));
    }
  };

  const handleTest = async (configId, gateway) => {
    setTesting(t => ({ ...t, [gateway]: true }));
    setTestResult(r => ({ ...r, [gateway]: null }));
    try {
      const res = await fetch(`${API_BASE}/admin/payment-config/${configId}/test`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      setTestResult(r => ({ ...r, [gateway]: data }));
    } catch (err) {
      setTestResult(r => ({ ...r, [gateway]: { success: false, error: err.message } }));
    } finally {
      setTesting(t => ({ ...t, [gateway]: false }));
    }
  };

  const handleDelete = async (configId, gateway) => {
    if (!confirm(`Remove ${gateway} gateway configuration?`)) return;
    try {
      await fetch(`${API_BASE}/admin/payment-config/${configId}`, {
        method: 'DELETE', credentials: 'include',
      });
      await fetchConfigs();
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const toggleCountry = (code) => {
    setFormData(f => ({
      ...f,
      countries: f.countries.includes(code)
        ? f.countries.filter(c => c !== code)
        : [...f.countries, code],
    }));
  };

  const configuredGateways = configs.map(c => c.gateway);
  const availableToAdd = Object.keys(GATEWAY_DEFAULTS).filter(g => !configuredGateways.includes(g));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Payment Gateways</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.6 }}>
            Configure Razorpay (India) and Stripe (International). Credentials are AES-256 encrypted.
          </p>
        </div>
        {availableToAdd.length > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {availableToAdd.map(gw => (
              <button key={gw} onClick={() => startEdit(gw)} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                + Add {GATEWAY_DEFAULTS[gw].displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'oklch(0.95 0.05 25)', border: '1px solid oklch(0.8 0.1 25)', borderRadius: '10px', fontSize: '13px', color: 'oklch(0.45 0.15 25)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Loading gateway configs...</div>
      ) : (
        <>
          {/* Configured Gateways */}
          {configs.map(cfg => {
            const isEditing = editingGateway === cfg.gateway;
            const fields = GATEWAY_DEFAULTS[cfg.gateway]?.fields || [];
            const result = testResult[cfg.gateway];

            return (
              <div key={cfg.gateway} className="card" style={{ padding: '20px', borderRadius: '16px' }}>
                {/* Gateway Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: cfg.gateway === 'razorpay' ? 'oklch(0.55 0.22 30)' : 'oklch(0.55 0.22 260)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '14px'
                    }}>
                      {cfg.gateway === 'razorpay' ? 'Rp' : 'St'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '16px' }}>{cfg.displayName || cfg.gateway}</div>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>
                        Countries: {cfg.countries.join(', ') || 'None'} &nbsp;|&nbsp; Currencies: {cfg.supportedCurrencies.join(', ') || 'None'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                      background: cfg.isEnabled ? 'oklch(0.9 0.1 140)' : 'oklch(0.9 0.02 250)',
                      color: cfg.isEnabled ? 'oklch(0.4 0.15 140)' : 'oklch(0.5 0.02 250)',
                    }}>
                      {cfg.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                      background: cfg.isLive ? 'oklch(0.9 0.1 140)' : 'oklch(0.95 0.1 60)',
                      color: cfg.isLive ? 'oklch(0.4 0.15 140)' : 'oklch(0.55 0.15 60)',
                    }}>
                      {cfg.isLive ? 'Live' : 'Sandbox'}
                    </span>
                    {cfg.isDefault && (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'oklch(0.9 0.1 260)', color: 'oklch(0.45 0.2 260)' }}>
                        Default
                      </span>
                    )}
                  </div>
                </div>

                {/* Masked credentials display */}
                {!isEditing && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    {fields.map(f => (
                      <div key={f.key} style={{ fontSize: '12px', padding: '8px 12px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                        <div style={{ opacity: 0.6, marginBottom: '2px' }}>{f.label}</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {cfg.credentials[f.key] || <span style={{ opacity: 0.4 }}>Not set</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Form */}
                {isEditing && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px', padding: '16px', background: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, display: 'block', marginBottom: '6px' }}>Display Name</label>
                        <input className="input" value={formData.displayName} onChange={e => setFormData(f => ({ ...f, displayName: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', paddingBottom: '2px' }}>
                        {['isEnabled', 'isLive', 'isDefault'].map(key => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData[key] || false} onChange={e => setFormData(f => ({ ...f, [key]: e.target.checked }))} />
                            {key === 'isEnabled' ? 'Enabled' : key === 'isLive' ? 'Live Mode' : 'Default'}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Credentials */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {fields.map(f => (
                        <div key={f.key}>
                          <label style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, display: 'block', marginBottom: '4px' }}>{f.label}</label>
                          <input
                            className="input"
                            type={f.key.includes('Secret') || f.key.includes('Webhook') ? 'password' : 'text'}
                            placeholder={f.placeholder}
                            value={formData.credentials?.[f.key] || ''}
                            onChange={e => setFormData(f2 => ({ ...f2, credentials: { ...f2.credentials, [f.key]: e.target.value } }))}
                            style={{ fontSize: '12px', fontFamily: 'monospace' }}
                          />
                          <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '3px' }}>{f.hint}</div>
                        </div>
                      ))}
                    </div>

                    {/* Country selector */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, display: 'block', marginBottom: '8px' }}>Active Countries</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {COUNTRY_OPTIONS.map(({ code, label }) => (
                          <button
                            key={code}
                            onClick={() => toggleCountry(code)}
                            style={{
                              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                              background: formData.countries?.includes(code) ? 'oklch(0.55 0.22 260)' : 'transparent',
                              color: formData.countries?.includes(code) ? 'white' : 'inherit',
                              borderColor: formData.countries?.includes(code) ? 'oklch(0.55 0.22 260)' : 'var(--border-card)',
                            }}
                          >
                            {code} — {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Test result */}
                {result && (
                  <div style={{
                    padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px',
                    background: result.success ? 'oklch(0.92 0.08 140)' : 'oklch(0.95 0.05 25)',
                    color: result.success ? 'oklch(0.4 0.15 140)' : 'oklch(0.45 0.15 25)',
                    border: `1px solid ${result.success ? 'oklch(0.8 0.12 140)' : 'oklch(0.8 0.1 25)'}`,
                  }}>
                    {result.success ? result.message : (result.error || 'Connection test failed.')}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {isEditing ? (
                    <>
                      <button onClick={handleSave} disabled={saving[cfg.gateway]} className="btn-primary" style={{ fontSize: '13px' }}>
                        {saving[cfg.gateway] ? 'Saving...' : 'Save Configuration'}
                      </button>
                      <button onClick={() => setEditingGateway(null)} className="btn-ghost" style={{ fontSize: '13px' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(cfg.gateway)} className="btn-ghost" style={{ fontSize: '13px' }}>Edit</button>
                      <button
                        onClick={() => handleTest(cfg._id, cfg.gateway)}
                        disabled={testing[cfg.gateway]}
                        className="btn-ghost"
                        style={{ fontSize: '13px' }}
                      >
                        {testing[cfg.gateway] ? 'Testing...' : 'Test Connection'}
                      </button>
                      <button
                        onClick={() => handleDelete(cfg._id, cfg.gateway)}
                        style={{ marginLeft: 'auto', fontSize: '13px', padding: '8px 16px', borderRadius: '10px', border: '1px solid oklch(0.8 0.1 25)', background: 'transparent', color: 'oklch(0.5 0.15 25)', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add New Gateway cards (unconfigured) */}
          {availableToAdd.map(gw => {
            const isEditing = editingGateway === gw;
            const defaults = GATEWAY_DEFAULTS[gw];
            const fields = defaults.fields;

            if (!isEditing) return (
              <div key={gw} className="card" style={{ padding: '20px', borderRadius: '16px', opacity: 0.6, border: '2px dashed var(--border-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: gw === 'razorpay' ? 'oklch(0.55 0.22 30)' : 'oklch(0.55 0.22 260)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '14px'
                  }}>
                    {gw === 'razorpay' ? 'Rp' : 'St'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{defaults.displayName}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Not configured — click "Add {defaults.displayName}" to set up</div>
                  </div>
                  <button onClick={() => startEdit(gw)} className="btn-primary" style={{ marginLeft: 'auto', fontSize: '13px' }}>
                    + Configure
                  </button>
                </div>
              </div>
            );

            // Edit form for new gateway
            return (
              <div key={gw} className="card" style={{ padding: '20px', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>Configure {defaults.displayName}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', background: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border-card)', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, display: 'block', marginBottom: '6px' }}>Display Name</label>
                      <input className="input" value={formData.displayName || ''} onChange={e => setFormData(f => ({ ...f, displayName: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', paddingBottom: '2px' }}>
                      {['isEnabled', 'isLive', 'isDefault'].map(key => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={formData[key] || false} onChange={e => setFormData(f => ({ ...f, [key]: e.target.checked }))} />
                          {key === 'isEnabled' ? 'Enabled' : key === 'isLive' ? 'Live Mode' : 'Default'}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {fields.map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, display: 'block', marginBottom: '4px' }}>{f.label}</label>
                        <input
                          className="input"
                          type={f.key.includes('Secret') || f.key.includes('Webhook') ? 'password' : 'text'}
                          placeholder={f.placeholder}
                          value={formData.credentials?.[f.key] || ''}
                          onChange={e => setFormData(f2 => ({ ...f2, credentials: { ...f2.credentials, [f.key]: e.target.value } }))}
                          style={{ fontSize: '12px', fontFamily: 'monospace' }}
                        />
                        <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '3px' }}>{f.hint}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, display: 'block', marginBottom: '8px' }}>Active Countries</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {COUNTRY_OPTIONS.map(({ code, label }) => (
                        <button
                          key={code}
                          onClick={() => toggleCountry(code)}
                          style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                            background: formData.countries?.includes(code) ? 'oklch(0.55 0.22 260)' : 'transparent',
                            color: formData.countries?.includes(code) ? 'white' : 'inherit',
                            borderColor: formData.countries?.includes(code) ? 'oklch(0.55 0.22 260)' : 'var(--border-card)',
                          }}
                        >
                          {code} — {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSave} disabled={saving[gw]} className="btn-primary" style={{ fontSize: '13px' }}>
                    {saving[gw] ? 'Saving...' : 'Save Configuration'}
                  </button>
                  <button onClick={() => setEditingGateway(null)} className="btn-ghost" style={{ fontSize: '13px' }}>Cancel</button>
                </div>
              </div>
            );
          })}

          {configs.length === 0 && availableToAdd.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No payment gateways configured.</div>
          )}
        </>
      )}
    </div>
  );
}

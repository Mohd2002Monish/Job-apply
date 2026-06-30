/**
 * Shared styling generator for react-select components matching the custom Gen Z theme.
 * Dynamically adapts to light/dark themes by querying the class on the html element.
 */
export const getReactSelectStyles = () => {
  const isDark = document.documentElement.classList.contains('dark');
  
  return {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: isDark ? '#0f172a' : '#ffffff', // bg-bg-card
      borderColor: state.isFocused 
        ? '#3b82f6' // brand-primary (blue-500)
        : (isDark ? '#1e293b' : '#e2e8f0'), // border-card / border-slate-200
      borderRadius: '0.75rem', // rounded-xl
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
      minHeight: '38px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      borderWidth: '1px',
      '&:hover': {
        borderColor: '#3b82f6'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: '0.75rem',
      border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      zIndex: 99,
      overflow: 'hidden'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : (state.isFocused ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent'),
      color: state.isSelected 
        ? '#ffffff' 
        : (isDark ? '#f1f5f9' : '#020617'),
      cursor: 'pointer',
      fontSize: '0.8125rem', // text-xs/sm
      padding: '8px 12px',
      '&:active': {
        backgroundColor: '#3b82f6',
        color: '#ffffff'
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDark ? '#f1f5f9' : '#020617',
      fontSize: '0.8125rem'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: '0.8125rem'
    }),
    input: (provided) => ({
      ...provided,
      color: isDark ? '#f1f5f9' : '#020617'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: isDark ? '#94a3b8' : '#64748b',
      padding: '6px'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    })
  };
};

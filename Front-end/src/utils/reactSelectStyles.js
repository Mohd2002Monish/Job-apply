/**
 * Shared styling generator for react-select components matching the custom premium theme.
 * Dynamically adapts to light/dark themes by querying the class on the html element.
 */
export const getReactSelectStyles = () => {
  const isDark = document.documentElement.classList.contains('dark');
  
  return {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: isDark ? 'rgba(39, 39, 42, 0.4)' : '#f8fafc', // slate-50 and zinc-800/40
      borderColor: state.isFocused 
        ? '#6366f1' // indigo-500
        : (isDark ? '#27272a' : '#e2e8f0'), // zinc-800 / slate-200
      borderRadius: '0.75rem', // rounded-xl
      boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.15)' : 'none',
      minHeight: '38px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      borderWidth: '1px',
      '&:hover': {
        borderColor: '#6366f1'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDark ? '#18181b' : '#ffffff', // zinc-900 / white
      borderRadius: '0.75rem',
      border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      zIndex: 99,
      overflow: 'hidden',
      padding: '4px 0'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? (isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)')
        : (state.isFocused ? (isDark ? 'rgba(39, 39, 42, 0.6)' : '#f8fafc') : 'transparent'),
      color: state.isSelected 
        ? '#6366f1' // indigo-500
        : (isDark ? '#f4f4f5' : '#1e293b'),
      cursor: 'pointer',
      fontSize: '0.75rem', // text-xs
      fontWeight: state.isSelected ? '700' : '500',
      padding: '8px 14px',
      transition: 'all 0.15s ease',
      '&:active': {
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        color: '#6366f1'
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDark ? '#f4f4f5' : '#1e293b',
      fontSize: '0.75rem',
      fontWeight: '600'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDark ? '#71717a' : '#94a3b8',
      fontSize: '0.75rem'
    }),
    input: (provided) => ({
      ...provided,
      color: isDark ? '#f4f4f5' : '#1e293b',
      fontSize: '0.75rem'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: isDark ? '#71717a' : '#94a3b8',
      padding: '6px',
      transition: 'color 0.2s ease',
      '&:hover': {
        color: '#6366f1'
      }
    }),
    indicatorSeparator: () => ({
      display: 'none'
    })
  };
};

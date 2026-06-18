import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const stored = localStorage.getItem('jaa_theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('jaa_user');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const initialState = {
  user: getStoredUser(),
  authenticated: !!getStoredUser(),
  resumeName: null,
  resumeData: null,
  resumes: [],
  activeResumeId: '',
  isDark: getInitialTheme(),
  activeTab: 'jobs',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.authenticated = action.payload.authenticated;
      state.user = action.payload.user;
      state.resumeName = action.payload.resumeName;
      state.resumeData = action.payload.resumeData;
      if (action.payload.user) {
        localStorage.setItem('jaa_user', JSON.stringify(action.payload.user));
      } else {
        localStorage.removeItem('jaa_user');
      }
    },
    setResumeInfo: (state, action) => {
      state.resumeName = action.payload.resumeName;
      state.resumeData = action.payload.resumeData;
    },
    setResumesInfo: (state, action) => {
      state.resumes = action.payload.resumes;
      state.activeResumeId = action.payload.activeResumeId;
    },
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
      localStorage.setItem('jaa_theme', state.isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', state.isDark);
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    logoutUser: (state) => {
      state.authenticated = false;
      state.user = null;
      state.resumeName = null;
      state.resumeData = null;
      state.resumes = [];
      state.activeResumeId = '';
      localStorage.removeItem('jaa_user');
    }
  }
});

export const { setAuth, setResumeInfo, setResumesInfo, toggleTheme, setActiveTab, logoutUser } = authSlice.actions;
export default authSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  jobs: [],
  selected: [], // Array of job IDs
  sortConfig: { key: 'createdAt', direction: 'desc' },
  filterText: '',
  formOpen: false,
  applying: false,
  checkingReplies: false,
  toasts: [],
  // New properties
  atsScoreLoading: false,
  coverLetterLoading: false,
  followUpLoading: false,
  analytics: {
    total: 0,
    applied: 0,
    pending: 0,
    replied: 0,
    responseRate: 0,
    avgReplyTimeHours: 0
  }
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action) => {
      state.jobs = action.payload;
    },
    toggleSelectJob: (state, action) => {
      const id = action.payload;
      const index = state.selected.indexOf(id);
      if (index > -1) {
        state.selected.splice(index, 1);
      } else {
        state.selected.push(id);
      }
    },
    setSelectedJobs: (state, action) => {
      state.selected = action.payload;
    },
    setSortConfig: (state, action) => {
      state.sortConfig = action.payload;
    },
    setFilterText: (state, action) => {
      state.filterText = action.payload;
    },
    setFormOpen: (state, action) => {
      state.formOpen = action.payload;
    },
    setApplying: (state, action) => {
      state.applying = action.payload;
    },
    setCheckingReplies: (state, action) => {
      state.checkingReplies = action.payload;
    },
    addToast: (state, action) => {
      state.toasts.push(action.payload);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    // New reducers
    setAtsScoreLoading: (state, action) => {
      state.atsScoreLoading = action.payload;
    },
    setCoverLetterLoading: (state, action) => {
      state.coverLetterLoading = action.payload;
    },
    setFollowUpLoading: (state, action) => {
      state.followUpLoading = action.payload;
    },
    setAnalytics: (state, action) => {
      state.analytics = action.payload;
    }
  }
});

export const {
  setJobs,
  toggleSelectJob,
  setSelectedJobs,
  setSortConfig,
  setFilterText,
  setFormOpen,
  setApplying,
  setCheckingReplies,
  addToast,
  removeToast,
  // New exports
  setAtsScoreLoading,
  setCoverLetterLoading,
  setFollowUpLoading,
  setAnalytics
} = jobsSlice.actions;
export default jobsSlice.reducer;

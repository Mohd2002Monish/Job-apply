import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  exporting: false,
  previewHtml: '',
  activeTemplate: 'classic',
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setExporting: (state, action) => {
      state.exporting = action.payload;
    },
    setPreviewHtml: (state, action) => {
      state.previewHtml = action.payload;
    },
    setActiveTemplate: (state, action) => {
      state.activeTemplate = action.payload;
    }
  }
});

export const { setLoading, setExporting, setPreviewHtml, setActiveTemplate } = resumeSlice.actions;
export default resumeSlice.reducer;

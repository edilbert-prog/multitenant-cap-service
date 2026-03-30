import { createSlice } from '@reduxjs/toolkit'
import { fetchUnits, fetchProjects } from './menuThunks'

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    units: [],
    projects: [],
    currentMenuItem: null,
    currentRoute: '/',
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentMenuItem: (state, action) => {
      state.currentMenuItem = action.payload
    },
    setCurrentRoute: (state, action) => {
      state.currentRoute = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUnits.pending, state => { state.loading = true })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.units = action.payload
        state.loading = false
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        state.error = action.error.message
        state.loading = false
      })
      .addCase(fetchProjects.pending, state => { state.loading = true })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload
        state.loading = false
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.error = action.error.message
        state.loading = false
      })
  }
})

export const { setCurrentMenuItem, setCurrentRoute } = menuSlice.actions
export default menuSlice.reducer

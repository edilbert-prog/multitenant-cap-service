import { configureStore } from '@reduxjs/toolkit'
import menuReducer from './Menu/menuSlice'

export const store = configureStore({
  reducer: {
    menu: menuReducer,
  },
})

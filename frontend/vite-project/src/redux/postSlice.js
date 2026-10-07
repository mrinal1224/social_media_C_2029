import { createSlice } from '@reduxjs/toolkit';

// 1. Set up the initial state
const initialState = {
   items : []
};

// 2. Create the slice
const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
     
  },
});

// 3. Export the auto-generated action creators
export const { increment, decrement, incrementByAmount } = counterSlice.actions;

// 4. Export the reducer function to hook up to the store
export default counterSlice.reducer;
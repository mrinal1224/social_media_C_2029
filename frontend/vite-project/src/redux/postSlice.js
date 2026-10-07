import { createSlice } from '@reduxjs/toolkit';



const initialState = {
      items : []  // this is the initail state for posts


};

  const postSlice = createSlice({
    name: 'post',
    initialState,
    reducers: {
       setPostAction : (state ,action)=>{
              state.items = action.payload
       } 
    },
  });
  
  // Export auto-generated action creators for use in components
  export const { setPostAction } = postSlice.actions;
  
  // Export the reducer to register it in the store
  export default postSlice.reducer;
  

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: { firstname: null, email: null, token: null },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      state.value.token = action.payload.token;
      state.value.email = action.payload.email;
      state.value.firstname = action.payload.firstname ?? null;
    },
    logout: (state) => {
      state.value.firstname = null;
      state.value.email = null;
      state.value.token = null;
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;

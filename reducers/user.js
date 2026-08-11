import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: { firstname: null, email: null, token: null, socialSecurityNumber: null, isFirstResponder: false },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      state.value.token = action.payload.token;
      state.value.email = action.payload.email;
      state.value.firstname = action.payload.firstname ?? null;
      state.value.socialSecurityNumber = action.payload.socialSecurityNumber ?? null;
      state.value.isFirstResponder = action.payload.isFirstResponder ?? false;
    },
    logout: (state) => {
      state.value.firstname = null;
      state.value.email = null;
      state.value.token = null;
      state.value.socialSecurityNumber = null;
      state.value.isFirstResponder = false;
    },
    updateSocialSecurityNumber: (state, action) => {
      state.value.socialSecurityNumber = action.payload;
    },
  },
});

export const { login, logout, updateSocialSecurityNumber } = userSlice.actions;
export default userSlice.reducer;

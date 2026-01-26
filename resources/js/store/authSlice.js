import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";


const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/register", userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/login", credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/logout");
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
  registerErrors: null,
  loginErrors: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.token) localStorage.setItem("token", action.payload.token);
      state.error = null;
      state.registerErrors = null;
      state.loginErrors = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.registerErrors = null;
      state.loginErrors = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      state.error = null;
      state.registerErrors = null;
      state.loginErrors = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.registerErrors = null;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
        state.registerErrors = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.registerErrors = action.payload?.errors || { 
          general: action.error.message 
        };
      })


      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.loginErrors = null;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
        state.loginErrors = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.loginErrors = action.payload?.errors || { 
          general: action.payload?.message || "Invalid credentials" 
        };
      })


      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
        state.error = action.payload?.message || "Logout failed";
      });
  },
});


export const { setAuth, logout, clearErrors } = authSlice.actions;


export { loginUser, logoutUser, registerUser };

export default authSlice.reducer;
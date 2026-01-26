import axios from "axios";
import { navigateTo } from "./navigation";
import { logout } from "./store/authSlice";
import { store } from "./store/store";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
      navigateTo("/login");
    }
    return Promise.reject(error);
  }
);

export default api;

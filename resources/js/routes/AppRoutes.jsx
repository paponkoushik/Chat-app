import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import api from "../api";
import { logout, setAuth } from "../store/authSlice";

import Chat from "../pages/Chat";
import Login from "../pages/Login";
import Register from "../pages/Register";

export default function AppRoutes() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    async function loadMe() {
      if (!token) return;
      try {
        const res = await api.get("/me");
        dispatch(setAuth({ user: res.data, token }));
      } catch {
        dispatch(logout());
      }
    }
    loadMe();
  }, [token]);

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/chat" replace />} />
      <Route path="/register" element={!token ? <Register /> : <Navigate to="/chat" replace />} />
      <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={token ? "/chat" : "/login"} replace />} />
    </Routes>
  );
}

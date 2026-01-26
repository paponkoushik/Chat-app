import React, { useState } from "react";
import api from "../api";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/authSlice";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    const res = await api.post("/login", { email, password });
    dispatch(setAuth(res.data));
    navigate("/chat");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={submit} className="bg-white p-6 rounded-2xl shadow w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        <input className="w-full border p-3 rounded-xl mb-3"
          placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <input className="w-full border p-3 rounded-xl mb-4"
          placeholder="Password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} />

        <button className="w-full bg-black text-white p-3 rounded-xl">Login</button>

        <p className="mt-4 text-sm">
          No account? <Link className="text-blue-600" to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

import "../css/app.css";

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { store } from "./store/store";

import { useNavigate } from "react-router-dom";
import { setNavigator } from "./navigation";

function NavigationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  return null;
}

function RootApp() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <NavigationHandler />
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

createRoot(document.getElementById("app")).render(<RootApp />);

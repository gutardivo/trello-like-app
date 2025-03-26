import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardPage from "./Dashboard";
import LoginPage from "./Login";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardPage />} />
    </Routes>
  );
};

export default App;

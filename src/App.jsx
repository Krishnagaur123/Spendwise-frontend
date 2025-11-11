import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home.jsx";
import Income from "./pages/Income.jsx";
import Expense from "./pages/Expense.jsx";
import Category from "./pages/Category.jsx";
import Filter from "./pages/Filter.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ProtectRoute from "./hooks/ProtectRoute.jsx";    


const App = () => {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root/>} />
          <Route path="/dashboard" element={<ProtectRoute><Home /></ProtectRoute>} />
          <Route path="/income" element={<ProtectRoute><Income /></ProtectRoute>} />
          <Route path="/expense" element={<ProtectRoute><Expense /></ProtectRoute>} />
          <Route path="/category" element={<ProtectRoute><Category /></ProtectRoute>} />
          <Route path="/filter" element={<ProtectRoute><Filter /></ProtectRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};


const Root = () => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};


export default App;

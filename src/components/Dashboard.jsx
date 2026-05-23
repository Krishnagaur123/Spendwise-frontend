import React, { Children, useContext } from "react";
import Menubar from "../components/Menubar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useAppContext } from "../context/AppContext.jsx";

const Dashboard = ({ children }) => {
  const { user } = useAppContext();

  return (
    <div className="min-h-screen bg-[#fcfbfc]">
      {/* Top bar */}
      <Menubar />

      {/* Body: sidebar + main */}
      {user && (
        <div className="flex">
          {/* Sidebar only on xl and above, sticky under a 61px header */}
          <div className="hidden xl:block">
            <Sidebar />
          </div>

          {/* Main content area */}
          <main className="grow px-4 py-4">
            {/* Right side content goes here */}
            {children}
          </main>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

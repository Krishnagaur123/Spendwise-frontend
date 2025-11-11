import React, { useRef, useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  LayoutDashboard,
  Wallet,
  Receipt,
  FolderOpen,
  Filter as FilterIcon,
} from "lucide-react";
import { useAppContext } from "../context/AppContext.jsx";

const base =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";
const active = "bg-indigo-50 text-indigo-700";
const idle = "text-gray-700 hover:bg-gray-50";
const linkClass = ({ isActive }) => `${base} ${isActive ? active : idle}`;

const Menubar = () => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { user, setUser } = useAppContext();
  const navigate = useNavigate();

  // close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (
        showDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [showDropdown]);

  return (
    <div className="flex items-center justify-between gap-5 bg-white border-b border-gray-200/50 px-4 py-3">
      {/* Burger (mobile only) */}
      <button
        type="button"
        onClick={() => setOpenSideMenu((v) => !v)}
        className="block lg:hidden text-black hover:bg-gray-100 p-1 rounded transition-colors"
        aria-label="Toggle menu"
      >
        {openSideMenu ? (
          <span className="text-2xl leading-none">✕</span>
        ) : (
          <span className="text-2xl leading-none">☰</span>
        )}
      </button>

      {/* Brand */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="group flex items-center gap-2"
        aria-label="Go to dashboard"
      >
        <img
          src="/assets/logo.png"
          alt="SpendWise logo"
          className="h-8 w-8 rounded-md shadow-sm ring-1 ring-black/5 group-hover:scale-105 transition-transform"
          loading="eager"
          decoding="async"
        />
        <span className="text-xl font-semibold tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
          SpendWise
        </span>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((v) => !v)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full ring-1 ring-indigo-200/60 hover:ring-indigo-300 bg-indigo-500/5 transition"
              aria-haspopup="menu"
              aria-expanded={showDropdown}
              aria-label="Open user menu"
            >
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="avatar"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="absolute inset-0 h-full w-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-5 w-5 text-indigo-600" />
              )}
            </button>

            {showDropdown && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {user?.fullName || user?.name || user?.username || "User"}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {user?.email || ""}
                  </p>
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    localStorage.removeItem("token");
                    setUser?.(null);
                    setShowDropdown(false);
                    navigate("/login");
                    window.location.reload();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              Sign up
            </button>
          </div>
        )}
      </div>

      {/* Mobile side menu */}
      {openSideMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenSideMenu(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 rounded-full ring-1 ring-indigo-200/60 bg-indigo-500/5">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="avatar"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="absolute inset-0 h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-indigo-600">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <span className="text-lg font-semibold">Menu</span>
              </div>

              <button
                className="h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50"
                onClick={() => setOpenSideMenu(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              <NavLink
                to="/dashboard"
                end
                className={linkClass}
                onClick={() => setOpenSideMenu(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/income"
                className={linkClass}
                onClick={() => setOpenSideMenu(false)}
              >
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span>Income</span>
              </NavLink>

              <NavLink
                to="/expense"
                className={linkClass}
                onClick={() => setOpenSideMenu(false)}
              >
                <Receipt className="h-4 w-4 text-rose-600" />
                <span>Expense</span>
              </NavLink>

              <NavLink
                to="/category"
                className={linkClass}
                onClick={() => setOpenSideMenu(false)}
              >
                <FolderOpen className="h-4 w-4" />
                <span>Category</span>
              </NavLink>

              <NavLink
                to="/filter"
                className={linkClass}
                onClick={() => setOpenSideMenu(false)}
              >
                <FilterIcon className="h-4 w-4" />
                <span>Filter</span>
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menubar;

import { User as UserIcon, LayoutDashboard, Wallet, Receipt, FolderOpen, Filter as FilterIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../context/AppContext.jsx";

const base = "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";
const active = "bg-indigo-50 text-indigo-700";
const idle = "text-gray-700 hover:bg-gray-50";
const linkClass = ({ isActive }) => `${base} ${isActive ? active : idle}`;

const Sidebar = () => {
  const { user } = useAppContext();

  return (
    <aside className="w-64 h-[calc(100vh-61px)] bg-white border-r border-gray-200/50 p-5 sticky top-[61px]">
      <div className="flex flex-col items-center justify-center gap-3 mt-3 mb-7">
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-100 grid place-items-center ring-2 ring-gray-100">
            <UserIcon className="w-8 h-8 text-gray-500" />
          </div>
        )}
        <h5 className="text-gray-950 font-medium leading-6 line-clamp-1">
          {user?.fullName || user?.name || user?.username || ""}
        </h5>
        <p className="text-xs text-gray-500 line-clamp-1">{user?.email || ""}</p>
      </div>

      <nav className="space-y-1">
        <NavLink to="/dashboard" end className={linkClass}>
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/category" className={linkClass}>
          <FolderOpen className="h-4 w-4" />
          <span>Categories</span>
        </NavLink>

        <NavLink to="/income" className={linkClass}>
          <Wallet className="h-4 w-4 text-emerald-600" />
          <span>Income</span>
        </NavLink>

        <NavLink to="/expense" className={linkClass}>
          <Receipt className="h-4 w-4 text-rose-600" />
          <span>Expense</span>
        </NavLink>

        <NavLink to="/filter" className={linkClass}>
          <FilterIcon className="h-4 w-4" />
          <span>Filters</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;

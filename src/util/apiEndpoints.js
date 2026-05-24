export const BASE_URL = "https://spendwise-ofnc.onrender.com/api/v1.0";

const CLOUDINARY_CLOUD_NAME = "dwdiu3487";

export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  LOGOUT: "/logout",

  // Profile
  UPLOAD_IMAGE: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  GET_USER_INFO: "/profile",

  // Transactions (unified — backend maps type INCOME/EXPENSE)
  GET_ALL_TRANSACTIONS: "/transactions",
  CREATE_TRANSACTION: "/transactions",
  UPDATE_TRANSACTION: (id) => `/transactions/${id}`,
  DELETE_TRANSACTION: (id) => `/transactions/${id}`,

  // Legacy per-type helpers (kept so Income/Expense pages don't break)
  GET_ALL_INCOMES: "/transactions",
  ADD_INCOME: "/transactions",
  DELETE_INCOME: (id) => `/transactions/${id}`,
  GET_ALL_EXPENSES: "/transactions",
  ADD_EXPENSE: "/transactions",
  DELETE_EXPENSE: (id) => `/transactions/${id}`,

  // Categories (new unified endpoint)
  GET_ALL_CATEGORIES: "/categories",
  ADD_CATEGORY: "/categories",
  DELETE_CATEGORY: (name) => `/categories/${name}`,
  // UPDATE_CATEGORY is not supported by evaluator API; kept for legacy
  UPDATE_CATEGORY: (name) => `/categories/${name}`,

  // Goals
  GET_ALL_GOALS: "/goals",
  CREATE_GOAL: "/goals",
  UPDATE_GOAL: (id) => `/goals/${id}`,
  DELETE_GOAL: (id) => `/goals/${id}`,

  // Reports
  MONTHLY_REPORT: (year, month) => `/reports/monthly/${year}/${month}`,
  YEARLY_REPORT: (year) => `/reports/yearly/${year}`,
};

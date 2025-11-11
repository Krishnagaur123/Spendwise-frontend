export const BASE_URL = "https://spendwise-ofnc.onrender.com/api/v1.0";

const CLOUDINARY_CLOUD_NAME = "dwdiu3487";


export const API_ENDPOINTS = {
    LOGIN: "/login",
    REGISTER: "/register",
    UPLOAD_IMAGE: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    GET_USER_INFO: "/profile",
    GET_ALL_CATEGORIES: "/categories",
    ADD_CATEGORY: "/categories",
    UPDATE_CATEGORY: (categoryId) => `/categories/${categoryId}`,
    GET_ALL_INCOMES: "/incomes",
    ADD_INCOME: "/incomes",
    DELETE_INCOME: (incomeId) => `/incomes/${incomeId}`,
    GET_ALL_EXPENSES: "/expenses",
    ADD_EXPENSE: "/expenses",
    DELETE_EXPENSE: (expenseId) => `/expenses/${expenseId}`,
    
}   


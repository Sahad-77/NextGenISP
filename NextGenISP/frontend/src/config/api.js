import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Add interceptors for token management
api.interceptors.request.use((config) => {
    let userStr = sessionStorage.getItem("user") || localStorage.getItem("user");
    const user = JSON.parse(userStr);
    if (user && user.token) {
        config.headers.Authorization = `Token ${user.token}`;
    }
    return config;
});

export default api;

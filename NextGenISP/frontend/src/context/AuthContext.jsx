import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check session storage or validate token
        const storedUser = sessionStorage.getItem("user");

        // Clean up old legacy local storage if it exists to avoid cross-tab confusion
        if (localStorage.getItem("user")) {
            localStorage.removeItem("user");
        }

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && parsedUser.role) {
                    // Normalize role to Uppercase to prevent mismatch
                    parsedUser.role = parsedUser.role.toUpperCase();
                    setUser(parsedUser);
                } else {
                    sessionStorage.removeItem("user");
                }
            } catch (e) {
                console.error("Failed to parse user from session storage", e);
                sessionStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        sessionStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../../config/api";
import { Lock, User, Wifi, ArrowRight } from "lucide-react";
import loginBg from "../../assets/login-bg.png"; 

export default function Login() {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await api.post("/auth/login/", credentials);
            const { token, user } = response.data;
            const userWithToken = { ...user, token };

            login(userWithToken); 

            switch (user.role) {
                case "ADMIN": navigate("/admin"); break;
                case "TECHNICAL_STAFF": navigate("/staff/tech"); break;
                case "FIELD_STAFF": navigate("/staff/field"); break;
                case "CUSTOMER": navigate("/customer"); break;
                default: navigate("/");
            }
        } catch (err) {
            console.error(err);
            setError("Invalid username or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center bg-black overflow-hidden font-sans">
            {/* Background Image */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
                style={{ backgroundImage: `url(${loginBg})` }}
            ></div>
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-transparent to-black/80"></div>

            {/* Login Card (Glassmorphism) */}
            <div className="relative z-10 w-full max-w-[420px] mx-4 p-8 sm:p-10 backdrop-blur-2xl bg-white/10 border border-white/20 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-700">
                
                {/* Brand Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                        <Wifi className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Headers */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-wide mb-2">NextGen ISP</h2>
                    <p className="text-xs text-cyan-200/80 font-medium tracking-[0.2em] uppercase">Authentication Portal</p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                            <Lock className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-cyan-200/50 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                name="username"
                                type="text"
                                required
                                className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all backdrop-blur-sm shadow-inner text-sm font-medium"
                                placeholder="Username"
                                value={credentials.username}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-cyan-200/50 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                name="password"
                                type="password"
                                required
                                className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all backdrop-blur-sm shadow-inner text-sm font-medium"
                                placeholder="Password"
                                value={credentials.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="peer appearance-none w-4 h-4 border border-white/20 rounded bg-black/30 checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer shadow-inner"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                            </div>
                            <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">Remember me</span>
                        </label>
                        
                        <Link to="/forgot-password" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors hover:underline underline-offset-4">
                            Forgot Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-6 w-full group relative flex justify-center items-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 overflow-hidden ${loading ? 'opacity-80 cursor-not-allowed' : 'active:scale-[0.98] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'}`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <span className="tracking-wide">Access Console</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6">
                    <p className="text-sm text-white/50">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors hover:underline underline-offset-4 ml-1">
                            Register now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

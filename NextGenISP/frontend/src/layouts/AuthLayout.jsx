import { Outlet, Link } from "react-router-dom";
import { Wifi } from "lucide-react";

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
                <Link to="/" className="flex justify-center items-center gap-2 mb-6 group">
                    <div className="bg-white p-2 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <Wifi className="text-indigo-600 h-8 w-8" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 tracking-tight">NextGen ISP</span>
                </Link>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Outlet />
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { User, Lock, Save, MapPin, Phone, Mail, Camera } from "lucide-react";

export default function Profile() {
    const { user, login } = useAuth(); // login is used to update context
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone_number: "",
        address: "",
        email: "",
        password: "" // Optional change
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [profileFile, setProfileFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                phone_number: user.phone_number || "",
                address: user.address || "",
                email: user.email || "",
                password: ""
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        try {
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('first_name', formData.first_name);
            formDataToSubmit.append('last_name', formData.last_name);
            formDataToSubmit.append('phone_number', formData.phone_number);
            formDataToSubmit.append('address', formData.address);
            formDataToSubmit.append('email', formData.email);
            if (formData.password) {
                formDataToSubmit.append('password', formData.password);
            }
            if (profileFile) {
                formDataToSubmit.append('profile_picture', profileFile);
            }

            const res = await api.patch(`/users/${user.id}/`, formDataToSubmit, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update Auth Context with new data (merge with token from existing)
            const updatedUser = { ...user, ...res.data };
            login(updatedUser); // This updates local storage too

            setMsg({ type: "success", text: "Profile Updated Successfully!" });
        } catch (err) {
            console.error(err);
            setMsg({ type: "error", text: "Failed to update profile." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-50">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500 mt-2">Manage your account settings and preferences.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ID Card / Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => document.getElementById('profile-upload').click()}>
                            <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                                {previewUrl || user?.profile_picture ? (
                                    <img src={previewUrl || user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user?.username?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={24} className="text-white" />
                            </div>
                            <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{user?.username}</h2>
                        <div className="text-sm text-gray-500 mb-4">{user?.email}</div>
                        <div className="inline-flex px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                            {user?.role}
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <User size={20} className="text-indigo-600" /> Personal Details
                        </h3>

                        {msg && (
                            <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {msg.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                                <input name="first_name" value={formData.first_name} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                                <input name="last_name" value={formData.last_name} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Mail size={16} /> Email Address</label>
                                <input name="email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Phone size={16} /> Phone Number</label>
                                <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><MapPin size={16} /> Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24"></textarea>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6 mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Lock size={20} className="text-indigo-600" /> Security
                            </h3>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">New Password (Optional)</label>
                                <input type="password" name="password" placeholder="Leave empty to keep current" value={formData.password} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                            {loading ? "Saving..." : <><Save size={20} /> Save Changes</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

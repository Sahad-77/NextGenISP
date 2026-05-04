import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Upload, MapPin, CheckCircle, AlertCircle, ArrowRight, User, Mail, Phone, Lock, X } from "lucide-react";
import api from "../../config/api";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


// Simple Point in Polygon Algorithm (Ray Casting)
const isPointInPolygon = (point, vs) => {
  // point = [lat, lng], vs = [[lat, lng], ...]
  var x = point[0], y = point[1];
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0], yi = vs[i][1];
    var xj = vs[j][0], yj = vs[j][1];
    var intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Fix Leaflet Icons (Crucial)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1); // 1: Location Check, 2: Details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [showMap, setShowMap] = useState(false);

  // Parse Initial State from Home.jsx if navigated via Coverage Map
  useEffect(() => {
    if (location.state && location.state.prefillAreaId) {
      setSelectedArea(location.state.prefillAreaId);
      if (location.state.prefillLocation) {
        setUserLocation(location.state.prefillLocation);
        setMapZoom(15);
      }
      setStep(2); // Auto-advance to details step!
    }
  }, [location.state]);

  // Custom Map Events to handle clicks
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const clickedPoint = [e.latlng.lat, e.latlng.lng];
        setUserLocation(clickedPoint);

        // Find which area polygon contains this point
        const foundArea = areas.find(area => {
          if (!area.coordinates) return false;
          try {
            const polygon = JSON.parse(area.coordinates);
            return isPointInPolygon(clickedPoint, polygon);
          } catch (err) { return false; }
        });

        if (foundArea) {
          setSelectedArea(foundArea.id);
          setError(null);
        } else {
          setSelectedArea("");
          setError("Sorry, we don't serve this location yet.");
        }
      },
    });
    return null;
  };
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    password: "",
    confirm_password: "",
    id_proof: null
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const res = await api.get("/public/areas/");
      setAreas(res.data);
    } catch (err) {
      console.error("Failed to load areas");
    }
  };

  const handleAreaSelect = (e) => {
    setSelectedArea(e.target.value);
    setError(null);
  };

  const checkLocation = () => {
    if (!selectedArea) {
      setError("Please select your area first.");
      return;
    }
    setStep(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, id_proof: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match!");
      return;
    }
    if (!formData.id_proof) {
      setError("Please upload an ID Proof.");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("username", formData.username);
    data.append("first_name", formData.first_name);
    data.append("last_name", formData.last_name);
    data.append("email", formData.email);
    data.append("phone_number", formData.phone_number);
    data.append("address", formData.address);
    data.append("password", formData.password);
    data.append("area", selectedArea);
    data.append("id_proof", formData.id_proof);

    try {
      await api.post("/register/", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Registration Successful! An admin will verify your details.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.username ? "Username already exists." : "Registration Failed. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Join NextGen ISP</h2>
          <p className="text-indigo-200 text-sm mt-1">Fast & Reliable Internet Connection</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Step 1: Location Check */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Check Availability</h3>
                <p className="text-gray-500 text-sm">Select your area to see if we are available.</p>
              </div>

              <div className="space-y-4">

                {/* Map Toggle */}
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <div className="p-3 bg-indigo-50 border-b flex justify-between items-center cursor-pointer" onClick={() => setShowMap(!showMap)}>
                    <span className="text-sm font-bold text-indigo-900 flex items-center gap-2"><MapPin size={16} /> Select Location on Map (Recommended)</span>
                    <span className="text-xs text-indigo-500">{showMap ? "Hide Map" : "Show Map"}</span>
                  </div>

                  {showMap && (
                    <div className="h-[300px] relative">
                      <MapContainer center={[9.9312, 76.2673]} zoom={12} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapClickHandler />
                        {userLocation && <Marker position={userLocation} />}
                        {areas.map(area => {
                          if (!area.coordinates) return null;
                          try {
                            return <Polygon key={area.id} positions={JSON.parse(area.coordinates)} pathOptions={{ color: selectedArea == area.id ? 'green' : 'blue', fillOpacity: 0.2 }} />
                          } catch (e) { return null; }
                        })}
                      </MapContainer>
                      <div className="absolute bottom-2 left-2 bg-white/90 p-2 text-xs rounded shadow z-[1000]">
                        {userLocation ? (selectedArea ? <span className="text-green-600 font-bold">Service Available!</span> : <span className="text-red-600 font-bold">No Service Here</span>) : "Click your home location"}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Area Manually</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedArea}
                    onChange={handleAreaSelect}
                  >
                    <option value="">-- Choose your location --</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name} ({area.city})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={checkLocation}
                  disabled={!selectedArea}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedArea ? "Proceed with Selected Area" : "Select Area to Proceed"} <ArrowRight size={18} />
                </button>
              </div>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-indigo-600 hover:underline">Already have an account? Login</Link>
              </div>
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">First Name</label>
                  <input name="first_name" required onChange={handleChange} className="w-full p-2 border rounded-lg mt-1 text-sm" placeholder="John" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">Last Name</label>
                  <input name="last_name" required onChange={handleChange} className="w-full p-2 border rounded-lg mt-1 text-sm" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input name="username" required onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg mt-1 text-sm" placeholder="johndoe123" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input type="email" name="email" required onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg mt-1 text-sm" placeholder="john@example.com" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input name="phone_number" required onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg mt-1 text-sm" placeholder="+91 9876543210" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Address</label>
                <textarea name="address" required onChange={handleChange} className="w-full p-2 border rounded-lg mt-1 text-sm" placeholder="House No, Street, Landmark..." rows="2"></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">ID Proof (Government ID)</label>
                <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                  <input type="file" required onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" />
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <span className="text-xs text-gray-500">{formData.id_proof ? formData.id_proof.name : "Click to upload ID Proof"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input type="password" name="password" required onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg mt-1 text-sm" placeholder="••••••" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">Confirm</label>
                  <input type="password" name="confirm_password" required onChange={handleChange} className="w-full p-2 border rounded-lg mt-1 text-sm" placeholder="••••••" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg transform active:scale-95 transition-all flex justify-center items-center gap-2"
                >
                  {loading ? "Registering..." : (
                    <>
                      Register for Connection <CheckCircle size={18} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full mt-2 text-gray-500 text-xs hover:text-gray-700"
                >
                  Back to Location Check
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

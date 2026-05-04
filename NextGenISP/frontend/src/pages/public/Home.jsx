import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../config/api";
import { Check, X, Shield, Wifi, User, Cog, Monitor, MapPin, ArrowRight } from "lucide-react";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Simple Point in Polygon Algorithm
const isPointInPolygon = (point, vs) => {
  var x = point[0], y = point[1];
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0], yi = vs[i][1];
    var xj = vs[j][0], yj = vs[j][1];
    var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Fix Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function Home() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  // Map Handler
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const clickedPoint = [e.latlng.lat, e.latlng.lng];
        setUserLocation(clickedPoint);

        const foundArea = areas.find(area => {
          if (!area.coordinates) return false;
          try { return isPointInPolygon(clickedPoint, JSON.parse(area.coordinates)); }
          catch (err) { return false; }
        });
        setSelectedZone(foundArea || null);
      },
    });
    return null;
  };

  useEffect(() => {
    // Fetch generic data
    api.get("/areas/").then(res => setAreas(res.data)).catch(console.error);
    api.get("/plans/").then(res => setAvailablePlans(res.data)).catch(console.error);
    api.get("/hardware/").then(res => setHardware(res.data)).catch(console.error);
  }, []);

  const handleBookClick = (plan) => {
    // Redirect to login/register instead of direct booking
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">

      {/* 1. NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-5 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg"><Wifi className="text-white" size={24} /></div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">NextGen ISP</div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#plans" className="text-gray-600 hover:text-indigo-600 font-medium">Plans & Pricing</a>
          <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium">Why Us</a>

          {/* Login Options - Separated as requested */}
          <div className="flex items-center gap-2 border-l pl-6 border-gray-200">
            <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              <User size={16} /> Customer
            </Link>
            <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              <Monitor size={16} /> Staff
            </Link>
            <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-md transition-colors">
              <Cog size={16} /> Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header className="px-6 pt-20 pb-32 text-center relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
        <div className="relative z-10 max-w-5xl mx-auto">
          <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm bg-indigo-100 px-3 py-1 rounded-full mb-6 inline-block">The Future of Connectivity</span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight text-gray-900">
            Internet that moves as <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Fast as You</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience ultra-low latency, 99.9% uptime, and dedicated support. Join thousands of happy subscribers today.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => document.getElementById('coverage-map').scrollIntoView({ behavior: 'smooth' })}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-1"
            >
              Check Availability
            </button>
            <button
              onClick={() => {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    const userPoint = [latitude, longitude];

                    // Trigger existing logic
                    setUserLocation(userPoint);
                    const foundArea = areas.find(area => {
                      if (!area.coordinates) return false;
                      try { return isPointInPolygon(userPoint, JSON.parse(area.coordinates)); }
                      catch (err) { return false; }
                    });
                    setSelectedZone(foundArea || null);

                    // Scroll to map
                    document.getElementById('coverage-map').scrollIntoView({ behavior: 'smooth' });
                  }, () => alert("Location access denied. Please click on the map manually."));
                } else {
                  alert("Geolocation not supported");
                }
              }}
              className="bg-white text-indigo-600 border border-indigo-200 px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-50 transition-all shadow-xl hover:-translate-y-1 flex items-center gap-2"
            >
              <MapPin size={20} /> Use My Location
            </button>
            <button
              onClick={() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all shadow-sm hover:-translate-y-1"
            >
              View Plans
            </button>
          </div>
        </div>
      </header>

      {/* 2.5 COVERAGE MAP SECTION */}
      <div id="coverage-map" className="py-20 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-purple-600 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-600 blur-[150px] rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 grid md:grid-cols-3 gap-12 items-center">
          <div className="md:col-span-1 space-y-6">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <h2 className="text-3xl font-bold">We are expanding fast!</h2>
            <p className="text-slate-400 leading-relaxed">
              Check if NextGen Fiber is available in your area. Click on the map to verify coverage instantly.
            </p>

            {userLocation && (
              <div className={`p-6 rounded-2xl border ${selectedZone ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} transition-all animate-in fade-in slide-in-from-bottom-4`}>
                <h4 className={`font-bold text-lg mb-2 ${selectedZone ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedZone ? "Great News! 🎉" : "Not Available Yet 😔"}
                </h4>
                <p className="text-sm text-slate-300 mb-4">
                  {selectedZone
                    ? `Make the switch today! Service is fully operational in ${selectedZone.name}.`
                    : "We haven't reached this spot yet. Check back soon!"}
                </p>
                {selectedZone && (
                  <Link to="/register" state={{
                    prefillAreaId: selectedZone.id,
                    prefillLocation: userLocation
                  }} className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                    Get Connected <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group">
            <MapContainer center={[9.9312, 76.2673]} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              <MapClickHandler />
              {userLocation && <Marker position={userLocation} />}
              {areas.map(area => {
                if (!area.coordinates) return null;
                try {
                  const isSelected = selectedZone && selectedZone.id === area.id;
                  return <Polygon
                    key={area.id}
                    positions={JSON.parse(area.coordinates)}
                    pathOptions={{
                      color: isSelected ? '#10b981' : '#3b82f6',
                      fillColor: isSelected ? '#10b981' : '#3b82f6',
                      fillOpacity: 0.3,
                      weight: isSelected ? 3 : 1
                    }}
                  />
                } catch (e) { return null; }
              })}
            </MapContainer>

            {!userLocation && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow-lg z-[1000] pointer-events-none animate-pulse">
                Click map to check coverage
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. PLANS SECTION (Directly Visible) */}
      <div id="plans" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-500 text-lg">Choose the perfect speed for your needs. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {availablePlans.length > 0 ? availablePlans.map((plan) => (
              <div key={plan.id} className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col hover:border-indigo-100 transition-all duration-300">
                <div className="p-8 pb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 mt-2 text-sm">Perfect for HD streaming & gaming</p>
                </div>
                <div className="px-8 py-2 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 font-medium">/month</span>
                </div>

                <div className="p-8 flex-1">
                  <div className="w-full h-px bg-gray-100 mb-6"></div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-gray-700 font-medium">
                      <Check size={20} className="text-indigo-600" />
                      {plan.speed_mbps} Mbps Speed
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 font-medium">
                      <Check size={20} className="text-indigo-600" />
                      Unlimited Data
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 font-medium">
                      <Check size={20} className="text-indigo-600" />
                      24/7 Priority Support
                    </li>
                  </ul>
                  <div className="flex flex-col gap-3">
                    <Link
                      to={`/plans/${plan.id}`}
                      className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      View Full Details <ArrowRight size={18} />
                    </Link>
                    <button
                      onClick={() => handleBookClick(plan)}
                      className="w-full text-indigo-600 font-semibold py-2 hover:underline text-sm"
                    >
                      Quick Book without Details
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500">Loading plans... (Ensure Backend is running)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3.b HARDWARE SECTION */}
      {hardware.length > 0 && (
        <div id="hardware" className="py-20 px-6 bg-gray-50 border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm">Hardware Solutions</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-2">Certified Devices for Max Speed</h2>
              <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Choose the right gear for your plan. One-time purchase, yours to keep.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {hardware.map(dev => (
                <Link to={`/hardware/${dev.id}`} key={dev.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-300 transition-all flex flex-col group block">
                  {dev.image ? (
                    <div className="h-48 w-full mb-4 rounded-xl overflow-hidden bg-gray-100">
                      <img src={dev.image} alt={dev.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4"><Wifi size={24} /></div>
                  )}
                  <h3 className="text-lg font-bold">{dev.name}</h3>
                  <p className="text-gray-500 text-sm">₹ {dev.price}</p>
                  <div className="mt-4 flex-1">
                    <p className="text-sm text-gray-600 line-clamp-3">{dev.hero_tagline || dev.description}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-indigo-600 font-semibold text-sm group-hover:text-indigo-700">
                    View Specifications <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ENQUIRY SECTION */}
      <footer id="contact" className="bg-gray-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-400 mb-8">Not sure which plan is right for you? Our experts are here to help.</p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
              await api.post('/enquiries/', {
                name: fd.get('name'),
                email: fd.get('email'),
                phone: fd.get('phone'),
                message: fd.get('message') || "Please call me back regarding new connection plans."
              });
              alert("Request Sent! We will call you shortly.");
              e.target.reset();
            } catch (err) { alert("Failed to send request."); }
          }} className="max-w-lg mx-auto bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-4">
            <input name="name" type="text" placeholder="Your Name" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-indigo-500" required />
            <input name="email" type="email" placeholder="Email Address" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-indigo-500" required />
            <input name="phone" type="tel" placeholder="Phone Number" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-indigo-500" required />
            <textarea name="message" rows="2" placeholder="Any specific requirements? (Optional)" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-indigo-500"></textarea>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors">Request Callback</button>
          </form>

          <p className="mt-12 text-gray-600 text-sm">© 2026 NextGen ISP. All rights reserved.</p>
        </div>
      </footer>
    </div >
  );
}

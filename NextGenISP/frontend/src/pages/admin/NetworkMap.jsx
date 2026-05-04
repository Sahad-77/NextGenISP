import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../config/api";
import L from "leaflet";
import { Wifi, AlertTriangle, ShieldAlert } from "lucide-react";

// Fix for default Leaflet icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const yellowIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function NetworkMap() {
    const [users, setUsers] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAreas = async () => {
        try {
            const res = await api.get('/areas/');
            // Parse coordinates from text to arrays for Leaflet
            const parsedAreas = res.data.map(area => {
                let coords = [];
                try {
                    coords = JSON.parse(area.coordinates || "[]");
                } catch (e) { console.error("Bad coords", area.name); }
                return { ...area, parsedCoords: coords };
            });
            setAreas(parsedAreas);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchAreas();
                const res = await api.get("/users/");
                // Mocking coordinates for demo since DB might be empty of geo data
                // Center around Kochi: 9.9312, 76.2673
                const mockedData = res.data.map((u) => {
                    let lat = null;
                    let lng = null;

                    // ALWAYS dynamically generate pins inside their designated Area poly-box to prevent legacy outlier rendering 
                    if (u.area_details && u.area_details.coordinates) {
                        try {
                            const coords = JSON.parse(u.area_details.coordinates);
                            if (coords && coords.length > 0) {
                                // Simple Bounding Box Placement
                                const lats = coords.map(p => p[0]);
                                const lngs = coords.map(p => p[1]);
                                const minLat = Math.min(...lats);
                                const maxLat = Math.max(...lats);
                                const minLng = Math.min(...lngs);
                                const maxLng = Math.max(...lngs);

                                // Place them strictly within the polygon box
                                lat = minLat + Math.random() * (maxLat - minLat);
                                lng = minLng + Math.random() * (maxLng - minLng);
                            }
                        } catch (e) {
                            console.error("Failed to parse area coords", e);
                            return null;
                        }
                    }

                    // Ultimate fallback: If STILL no lat/lng but somehow passed above (shouldn't happen), discard.
                    if (!lat || !lng) return null;

                    return {
                        ...u,
                        lat: lat,
                        lng: lng,
                        // Map ticket status dynamically
                        hasOpenTicket: Boolean(u.has_open_ticket)
                    };
                }).filter(u => u !== null); // Remove discarded users
                setUsers(mockedData.filter(u => u.role === 'CUSTOMER'));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getIcon = (user) => {
        if (user.hasOpenTicket) return redIcon; // Critical Issue
        if (user.status === 'SUSPENDED') return yellowIcon; // Payment Pending
        return greenIcon; // All Systems Go
    };

    const toggleMaintenance = async (areaId, currentState) => {
        try {
            await api.patch(`/areas/${areaId}/`, {
                is_under_maintenance: !currentState,
                maintenance_message: !currentState ? "Emergency Network Maintenance in Progress" : ""
            });
            alert(`Maintenance mode ${!currentState ? 'ENABLED' : 'DISABLED'} for area.`);
            fetchAreas(); // Refresh map
        } catch (error) {
            console.error(error);
            alert("Failed to toggle maintenance mode");
        }
    };

    if (loading) return <div className="p-8">Loading Network Grid...</div>;

    return (
        <div className="h-screen flex flex-col">
            <div className="bg-slate-900 text-white p-4 shadow-md z-10 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2"><Wifi size={24} className="text-indigo-400" /> Network Operations Center</h1>
                    <p className="text-xs text-slate-400">Real-time infrastructure monitoring</p>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Online</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Suspended</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> OUTAGE</span>
                </div>
            </div>

            <div className="flex-1 relative">
                <MapContainer center={[9.9312, 76.2673]} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Render Area Polygons */}
                    {areas.map(area => {
                        if (area.parsedCoords && area.parsedCoords.length > 2) {
                            return (
                                <Polygon
                                    key={`area-${area.id}`}
                                    positions={area.parsedCoords}
                                    pathOptions={{
                                        color: area.is_under_maintenance ? '#f97316' : '#3b82f6',
                                        fillColor: area.is_under_maintenance ? '#f97316' : '#3b82f6',
                                        fillOpacity: area.is_under_maintenance ? 0.4 : 0.1,
                                        weight: area.is_under_maintenance ? 3 : 2,
                                        dashArray: area.is_under_maintenance ? '5, 5' : ''
                                    }}
                                >
                                    <Popup>
                                        <div className="p-2 min-w-[200px]">
                                            <h3 className="font-bold text-lg">{area.name}</h3>
                                            <p className="text-xs text-gray-500 font-mono mb-3">Zone: {area.code}</p>

                                            {area.is_under_maintenance && (
                                                <div className="bg-orange-100 text-orange-800 p-2 rounded-lg text-xs font-bold mb-3 border border-orange-200 flex items-start gap-2">
                                                    <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                                                    <span>{area.maintenance_message || "Under Maintenance"}</span>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => toggleMaintenance(area.id, area.is_under_maintenance)}
                                                className={`w-full py-2 text-xs font-bold rounded text-white ${area.is_under_maintenance ? 'bg-gray-800 hover:bg-gray-700' : 'bg-orange-600 hover:bg-orange-500'}`}
                                            >
                                                {area.is_under_maintenance ? 'DISABLE MAINTENANCE' : 'ENABLE MAINTENANCE MODE'}
                                            </button>
                                        </div>
                                    </Popup>
                                </Polygon>
                            );
                        }
                        return null;
                    })}

                    {/* Render User Markers */}
                    {users.map(user => (
                        <Marker
                            key={user.id}
                            position={[user.lat, user.lng]}
                            icon={getIcon(user)}
                        >
                            <Popup>
                                <div className="p-2 min-w-[200px]">
                                    <h3 className="font-bold text-lg mb-1">{user.username}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{user.address || "No Address"}</p>

                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Status:</span>
                                            <span className={`font-bold ${user.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>{user.status}</span>
                                        </div>
                                        {user.hasOpenTicket && (
                                            <div className="bg-red-50 text-red-700 p-2 rounded mt-2 text-xs font-bold flex items-center gap-2 border border-red-100">
                                                <AlertTriangle size={14} /> ACTIVE TICKET
                                            </div>
                                        )}
                                        <div className="border-t pt-2 mt-2 font-mono text-xs text-gray-400">
                                            Signal: -{Math.floor(Math.random() * 20 + 40)}dBm
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Floating Stats Panel */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-2xl z-[1000] border border-gray-200 w-64">
                    <h4 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider">Zone Metrics</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Nodes</span>
                            <span className="font-bold text-gray-900">{users.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Critical Alerts</span>
                            <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{users.filter(u => u.hasOpenTicket).length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <p className="text-xs text-center text-green-600 font-medium">Network Health: 98.4%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

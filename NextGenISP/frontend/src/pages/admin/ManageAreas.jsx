import { useState, useEffect, useRef } from "react";
import api from "../../config/api";
import { Plus, Trash, Edit2, MapPin, Save, X } from "lucide-react";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function ManageAreas() {
    const [areas, setAreas] = useState([]);
    const [form, setForm] = useState({ name: "", code: "", city: "Kochi", coordinates: "[]" });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [mapPoints, setMapPoints] = useState([]);
    const [showMap, setShowMap] = useState(false);

    // Map Click Handler Component
    const MapClickHandler = () => {
        useMapEvents({
            click: (e) => {
                setMapPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
            },
        });
        return null;
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        try {
            const res = await api.get("/areas/");
            setAreas(res.data);
        } catch (err) {
            console.error("Failed to fetch areas", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, coordinates: JSON.stringify(mapPoints) };

            if (isEditing) {
                await api.put(`/areas/${editId}/`, payload);
            } else {
                await api.post("/areas/", payload);
            }
            setForm({ name: "", code: "", city: "Kochi", coordinates: "[]" });
            setMapPoints([]);
            setShowMap(false);
            setIsEditing(false);
            setEditId(null);
            fetchAreas();
        } catch (err) {
            alert("Error saving area");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure?")) {
            await api.delete(`/areas/${id}/`);
            fetchAreas();
        }
    };

    const handleEdit = (area) => {
        setForm({ name: area.name, code: area.code, city: area.city, coordinates: area.coordinates || "[]" });
        setMapPoints(area.coordinates ? JSON.parse(area.coordinates) : []);
        setIsEditing(true);
        setEditId(area.id);
        setShowMap(true);
    };

    const clearMap = () => setMapPoints([]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Manage Service Areas (Zones)</h1>

            {/* Form */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                {!showMap ? (
                    <button onClick={() => setShowMap(true)} className="mb-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200">
                        <MapPin size={18} /> {isEditing ? "Edit Zone Map" : "Define New Zone Map"}
                    </button>
                ) : (
                    <div className="mb-6 border rounded-xl overflow-hidden">
                        <div className="bg-gray-50 p-2 border-b flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-600">Click on map to draw polygon points ({mapPoints.length} points)</span>
                            <div className="flex gap-2">
                                <button onClick={clearMap} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">Reset Points</button>
                                <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="h-[400px]">
                            <MapContainer center={[9.9312, 76.2673]} zoom={12} style={{ height: "100%", width: "100%" }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <MapClickHandler />
                                {mapPoints.length > 0 && (
                                    <>
                                        <Polygon positions={mapPoints} pathOptions={{ color: 'blue' }} />
                                        {mapPoints.map((pos, idx) => (
                                            <Marker key={idx} position={pos} />
                                        ))}
                                    </>
                                )}
                            </MapContainer>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Zone Name</label>
                        <input
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="e.g. Marine Drive"
                            required
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-sm font-medium mb-1">Zone Code</label>
                        <input
                            value={form.code}
                            onChange={e => setForm({ ...form, code: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="KOC-01"
                            required
                        />
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-indigo-700">
                        {isEditing ? <Save size={16} /> : <Plus size={16} />}
                        {isEditing ? "Save Changes" : "Create Zone"}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {areas.map(area => (
                            <tr key={area.id}>
                                <td className="px-6 py-4">{area.name}</td>
                                <td className="px-6 py-4">{area.code}</td>
                                <td className="px-6 py-4">{area.city}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleEdit(area)} className="text-indigo-600 hover:text-indigo-900"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(area.id)} className="text-red-600 hover:text-red-900"><Trash size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";

type LocationPickerProps = {
    onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
    initialLocation?: { latitude: number; longitude: number; address: string };
};

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
    const [address, setAddress] = useState(initialLocation?.address || "");
    const [latitude, setLatitude] = useState(initialLocation?.latitude || 0);
    const [longitude, setLongitude] = useState(initialLocation?.longitude || 0);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [error, setError] = useState("");

    // Get user's current location
    const getCurrentLocation = () => {
        setIsGettingLocation(true);
        setError("");

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setIsGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setLatitude(lat);
                setLongitude(lng);

                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
                    );
                    const data = await response.json();
                    const addr = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    setAddress(addr);
                    onLocationSelect({ latitude: lat, longitude: lng, address: addr });
                } catch (err) {
                    const addr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    setAddress(addr);
                    onLocationSelect({ latitude: lat, longitude: lng, address: addr });
                }
                setIsGettingLocation(false);
            },
            (err) => {
                setError("Failed to get your location. Please enter manually.");
                setIsGettingLocation(false);
            }
        );
    };

    // Handle manual address input
    const handleAddressChange = async (value: string) => {
        setAddress(value);
        if (value.length > 10) {
            // Geocode address to get coordinates
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=1`
                );
                const data = await response.json();
                if (data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    setLatitude(lat);
                    setLongitude(lon);
                    onLocationSelect({ latitude: lat, longitude: lon, address: value });
                }
            } catch (err) {
                // Silently fail, user can still submit
            }
        }
    };

    useEffect(() => {
        if (initialLocation) {
            setAddress(initialLocation.address);
            setLatitude(initialLocation.latitude);
            setLongitude(initialLocation.longitude);
        }
    }, [initialLocation]);

    return (
        <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                Location
                <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-slate-500">(Required for community sharing)</span>
            </label>

            <div className="flex gap-3">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        placeholder="Enter your full address or click 'Use My Location'"
                        required
                        className="w-full px-4 py-3.5 pl-11 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-white text-slate-900 placeholder:text-slate-400"
                    />
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="px-5 py-3.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2 shadow-md shadow-purple-500/20"
                >
                    {isGettingLocation ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Locating...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Use My Location</span>
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-lg border border-red-100">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {latitude !== 0 && longitude !== 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="font-medium">Coordinates:</span>
                    <span className="font-mono text-slate-700">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                </div>
            )}
        </div>
    );
}


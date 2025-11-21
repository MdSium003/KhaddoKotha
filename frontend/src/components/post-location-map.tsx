"use client";

import { useEffect, useRef } from "react";

type PostLocationMapProps = {
    latitude: number;
    longitude: number;
    address: string;
};

export function PostLocationMap({ latitude, longitude, address }: PostLocationMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || !latitude || !longitude) return;

        // Load Leaflet CSS and JS dynamically
        const loadLeaflet = async () => {
            // Load CSS
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                link.crossOrigin = '';
                document.head.appendChild(link);
            }

            // Load JS
            if (!(window as any).L) {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
                script.crossOrigin = '';
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const L = (window as any).L;
            if (!L) return;

            // Clear previous map
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }

            // Create map
            const map = L.map(mapRef.current).setView([latitude, longitude], 13);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            // Add marker
            L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup(`<b>${address}</b>`)
                .openPopup();

            mapInstanceRef.current = map;
        };

        loadLeaflet();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [latitude, longitude, address]);

    if (!latitude || !longitude) {
        return (
            <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                <p className="text-slate-400 text-sm">Location not available</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-semibold text-slate-700">Location</span>
            </div>
            <div className="text-xs text-slate-600 mb-2 px-1">{address}</div>
            <div 
                ref={mapRef} 
                className="w-full h-48 rounded-xl border-2 border-slate-200 overflow-hidden"
                style={{ zIndex: 0 }}
            />
        </div>
    );
}


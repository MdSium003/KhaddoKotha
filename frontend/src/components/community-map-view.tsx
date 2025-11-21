"use client";

import { useEffect, useRef, useState } from "react";
import { CommunityPost } from "@/lib/api";

type CommunityMapViewProps = {
    posts: CommunityPost[];
    userLocation?: { latitude: number; longitude: number } | null;
    onPostClick: (post: CommunityPost) => void;
};

export function CommunityMapView({ posts, userLocation, onPostClick }: CommunityMapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    useEffect(() => {
        if (!mapRef.current) return;

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
                markersRef.current.forEach(marker => marker.remove());
                markersRef.current = [];
                if (userMarkerRef.current) {
                    userMarkerRef.current.remove();
                }
            }

            // Determine center - use user location if available, otherwise use first post or default
            let centerLat = 23.8103; // Default: Dhaka, Bangladesh
            let centerLng = 90.4125;
            let zoom = 12;

            if (userLocation) {
                centerLat = userLocation.latitude;
                centerLng = userLocation.longitude;
                zoom = 13;
            } else if (posts.length > 0) {
                centerLat = posts[0].latitude;
                centerLng = posts[0].longitude;
            }

            // Create map
            const map = L.map(mapRef.current).setView([centerLat, centerLng], zoom);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            // Add user location marker if available
            if (userLocation) {
                const userIcon = L.divIcon({
                    className: 'custom-user-marker',
                    html: `<div style="
                        width: 20px;
                        height: 20px;
                        background: #3b82f6;
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    "></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                });

                userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
                    .addTo(map)
                    .bindPopup('<b>Your Location</b>')
                    .openPopup();
            }

            // Add markers for each post
            posts.forEach((post) => {
                if (!post.latitude || !post.longitude) return;

                // Create custom icon based on post type
                const iconColor = post.post_type === 'donate' ? '#10b981' : '#3b82f6';
                const iconEmoji = post.post_type === 'donate' ? '🎁' : '🙏';
                
                const customIcon = L.divIcon({
                    className: 'custom-post-marker',
                    html: `<div style="
                        width: 36px;
                        height: 36px;
                        background: ${iconColor};
                        border: 3px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        cursor: pointer;
                    ">${iconEmoji}</div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                });

                // Create popup content
                const popupContent = `
                    <div style="min-width: 200px; padding: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="font-size: 20px;">${iconEmoji}</span>
                            <span style="font-weight: bold; color: #1e293b;">${post.food_name}</span>
                        </div>
                        <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">
                            <strong>${post.quantity}${post.unit ? ' ' + post.unit : ' units'}</strong>
                        </div>
                        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
                            ${post.post_type === 'donate' ? 'Expires:' : 'Needed by:'} ${new Date(post.target_date).toLocaleDateString()}
                        </div>
                        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                            📍 ${post.address.length > 50 ? post.address.substring(0, 50) + '...' : post.address}
                        </div>
                        <div style="font-size: 11px; color: #64748b;">
                            Click marker for details
                        </div>
                    </div>
                `;

                const marker = L.marker([post.latitude, post.longitude], { icon: customIcon })
                    .addTo(map)
                    .bindPopup(popupContent);

                // Add click handler to open post details modal
                marker.on('click', (e) => {
                    // Open popup first
                    marker.openPopup();
                    // Then open details modal
                    setTimeout(() => {
                        onPostClick(post);
                    }, 300);
                });

                markersRef.current.push(marker);
            });

            // Listen for custom event from popup button
            const handleOpenPostDetails = (e: any) => {
                const postId = e.detail;
                const post = posts.find(p => p.id === postId);
                if (post) {
                    onPostClick(post);
                }
            };
            window.addEventListener('openPostDetails', handleOpenPostDetails as EventListener);

            mapInstanceRef.current = map;
            setIsMapReady(true);
        };

        loadLeaflet();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            markersRef.current = [];
            userMarkerRef.current = null;
        };
    }, [posts, userLocation, onPostClick]);

    return (
        <div className="w-full h-[600px] rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg relative">
            {!isMapReady && (
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4 mx-auto"></div>
                        <p className="text-slate-600 font-medium">Loading map...</p>
                    </div>
                </div>
            )}
            <div 
                ref={mapRef} 
                className="w-full h-full"
                style={{ zIndex: 0 }}
            />
        </div>
    );
}


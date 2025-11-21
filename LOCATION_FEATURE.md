# Location Feature for Community Posts

## Overview
Added location sharing functionality to community posts. Every post now requires a location that is stored in the database and displayed on an interactive map.

## Database Migration

**IMPORTANT**: Run the migration script to add location columns to the existing `community_posts` table:

```sql
-- File: backend/src/db/add-location-to-posts.sql
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT;

CREATE INDEX IF NOT EXISTS idx_community_posts_location ON community_posts(latitude, longitude);
```

You can run this SQL directly in your database or execute the migration script.

## Changes Made

### Backend (`backend/src/server.ts`)
- Updated POST `/api/community/posts` endpoint to require and store:
  - `latitude` (number, -90 to 90)
  - `longitude` (number, -180 to 180)
  - `address` (string)

### Frontend Types (`frontend/src/lib/api.ts`)
- Updated `CommunityPost` type to include:
  - `latitude: number`
  - `longitude: number`
  - `address: string`
- Updated `createCommunityPost` function signature to require location data

### New Components

1. **LocationPicker** (`frontend/src/components/location-picker.tsx`)
   - Allows users to:
     - Enter address manually
     - Use browser geolocation API to get current location
     - Automatically geocodes addresses to get coordinates
   - Uses OpenStreetMap Nominatim API for geocoding (free, no API key required)

2. **PostLocationMap** (`frontend/src/components/post-location-map.tsx`)
   - Displays an interactive map using Leaflet
   - Shows a marker at the post location
   - Includes a popup with the address
   - Dynamically loads Leaflet library (no npm install needed)

### Updated Components

1. **CreatePostModal** (`frontend/src/app/community/page.tsx`)
   - Added `LocationPicker` component
   - Location is now required for all posts
   - Form validation ensures location is provided before submission

2. **PostCard** (`frontend/src/app/community/page.tsx`)
   - Displays `PostLocationMap` component for each post
   - Shows location below post details

## Features

- **Location Collection**:
  - Manual address entry with auto-geocoding
  - One-click "Use My Location" button using browser geolocation
  - Real-time coordinate display

- **Map Display**:
  - Interactive Leaflet map
  - Marker at post location
  - Address popup on marker click
  - Responsive design

- **Data Storage**:
  - Latitude and longitude stored as NUMERIC for precision
  - Full address stored as TEXT
  - Indexed for location-based queries

## Technical Details

- **Geocoding Service**: OpenStreetMap Nominatim (free, no API key)
- **Map Library**: Leaflet (loaded via CDN, no npm install required)
- **Coordinate System**: WGS84 (standard GPS coordinates)

## Usage

1. When creating a post, users must provide a location
2. They can either:
   - Click "Use My Location" to automatically get their current location
   - Type an address manually (will be geocoded automatically)
3. The location is stored with the post
4. When viewing posts, a map is displayed showing the exact location

## Future Enhancements

- Filter posts by location/distance
- Show nearby posts on a map view
- Directions to post location
- Location privacy settings


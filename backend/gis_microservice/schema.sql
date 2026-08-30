-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create farms table
CREATE TABLE IF NOT EXISTS farms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geom GEOMETRY(Polygon, 4326) NOT NULL
);

-- Create a GIST index on the geometry column for spatial queries
CREATE INDEX IF NOT EXISTS farms_geom_idx ON farms USING GIST (geom);



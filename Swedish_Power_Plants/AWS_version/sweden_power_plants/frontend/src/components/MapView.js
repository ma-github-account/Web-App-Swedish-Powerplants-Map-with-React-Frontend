import React from 'react'
import { MapContainer, TileLayer, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import ClusterLayer from './ClusterLayer'
import GeocoderControl from './GeocoderControl'
import PrintControl from './PrintControl'

// Leaflet resolves its default marker images by inspecting the <script> URL,
// which webpack breaks. Point the default icon at the bundled copies so plants
// without a type icon still get a pin.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
})

// Same view the GeoDjango original opened on.
const SWEDEN_CENTER = [62.50, 16.35]
const DEFAULT_ZOOM = 5

const OSM_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const CARTO_ATTRIBUTION =
    `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`

function MapView({ places, onSelect, height = '78vh' }) {
    return (
        <MapContainer
            center={SWEDEN_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={true}
            style={{ height, width: '100%', borderRadius: '10px' }}
        >
            {/* The upstream Swedish map had a single hardcoded OSM layer. These
                five come from the Ethiopian Infrastructure Map's switcher, with
                its two dead Stamen entries replaced - Stamen retired those tile
                URLs in 2023 and they now return 503. Every provider below was
                checked live. */}
            <LayersControl position='topright'>
                <LayersControl.BaseLayer checked name='OpenStreetMap'>
                    <TileLayer
                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        attribution={OSM_ATTRIBUTION}
                        maxZoom={19}
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name='Carto Light'>
                    <TileLayer
                        url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                        attribution={CARTO_ATTRIBUTION}
                        subdomains='abcd'
                        maxZoom={20}
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name='Carto Dark'>
                    <TileLayer
                        url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                        attribution={CARTO_ATTRIBUTION}
                        subdomains='abcd'
                        maxZoom={20}
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name='OpenTopoMap'>
                    <TileLayer
                        url='https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
                        attribution={`${OSM_ATTRIBUTION}, <a href="https://opentopomap.org">OpenTopoMap</a>`}
                        subdomains='abc'
                        maxZoom={17}
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name='Esri Satellite'>
                    <TileLayer
                        url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        maxZoom={19}
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            <PrintControl position='topright' />
            <GeocoderControl position='topright' />

            <ClusterLayer places={places} onSelect={onSelect} />
        </MapContainer>
    )
}

export default MapView

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

// Place names and categories come from the database, so anything injected into
// a popup's HTML gets escaped first.
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}[c]))

/**
 * Renders every place into a single leaflet.markercluster group.
 *
 * The GeoDjango original built one cluster group per category and hit four
 * separate endpoints to fill them. One group over all places clusters correctly
 * across categories and still gives each marker its own category icon.
 */
function ClusterLayer({ places, onSelect }) {
    const map = useMap()

    useEffect(() => {
        const group = L.markerClusterGroup({ showCoverageOnHover: false })

        places.forEach((place) => {
            if (place.latitude == null || place.longitude == null) return

            const icon = place.category_icon
                ? L.icon({
                    iconUrl: place.category_icon,
                    iconSize: [31, 31],
                    iconAnchor: [15, 31],
                    popupAnchor: [0, -28],
                })
                : new L.Icon.Default()

            const marker = L.marker([place.latitude, place.longitude], { icon })

            marker.bindPopup(
                `<div style="text-align:center">
                    <strong>${escapeHtml(place.place_name)}</strong><br/>
                    <small>${escapeHtml(place.category_name)}</small>
                 </div>`
            )
            marker.on('click', () => onSelect(place))

            group.addLayer(marker)
        })

        map.addLayer(group)

        return () => {
            map.removeLayer(group)
        }
    }, [map, places, onSelect])

    return null
}

export default ClusterLayer

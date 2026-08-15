import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-control-geocoder'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

/** Place search. Sits top-right alongside the layer switcher and the print
 *  button so the three map controls form one column. */
function GeocoderControl({ position = 'topright' }) {
    const map = useMap()

    useEffect(() => {
        if (!L.Control || typeof L.Control.geocoder !== 'function') return undefined

        const control = L.Control.geocoder({
            position,
            defaultMarkGeocode: true,
            placeholder: 'Search for a place…',
        }).addTo(map)

        return () => {
            control.remove()
        }
    }, [map, position])

    return null
}

export default GeocoderControl

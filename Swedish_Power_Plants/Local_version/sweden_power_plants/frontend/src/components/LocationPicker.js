import React from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const SWEDEN_CENTER = [62.50, 16.35]

function ClickHandler({ onPick }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

/** Small map beside the lat/lng inputs: click or drag the pin to set them.
 *  Beats typing coordinates by hand, and matches what the Django admin's
 *  GISModelAdmin widget offers. */
function LocationPicker({ latitude, longitude, onPick }) {
    const hasPoint = latitude !== '' && longitude !== '' &&
        !Number.isNaN(Number(latitude)) && !Number.isNaN(Number(longitude))

    const position = hasPoint ? [Number(latitude), Number(longitude)] : null

    return (
        <MapContainer
            center={position || SWEDEN_CENTER}
            zoom={position ? 9 : 5}
            style={{ height: '280px', width: '100%', borderRadius: '6px' }}
        >
            <TileLayer
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <ClickHandler onPick={onPick} />
            {position && (
                <Marker
                    position={position}
                    draggable={true}
                    eventHandlers={{
                        dragend: (e) => {
                            const { lat, lng } = e.target.getLatLng()
                            onPick(lat, lng)
                        },
                    }}
                />
            )}
        </MapContainer>
    )
}

export default LocationPicker

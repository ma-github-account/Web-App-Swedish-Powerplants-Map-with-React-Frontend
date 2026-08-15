import React from 'react'
import { Card, Badge, Button } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

const FALLBACK_IMAGE = '/images/place_images/Sweden.png'
const NO_IMAGE = '/images/place_images/no_image_available.jpg'

/** The right-hand column of the original map: picture, name and the three
 *  description lines, filled in when a marker is clicked. */
function PlaceInfoPanel({ place, canEdit }) {
    if (!place) {
        return (
            <Card className='h-100'>
                <Card.Img variant='top' src={FALLBACK_IMAGE} alt='Sweden' />
                <Card.Body>
                    <Card.Title>Swedish Powerplants Map</Card.Title>
                    <Card.Text className='text-muted'>
                        Click a marker to see details of a fossil fuel, nuclear,
                        hydroelectric or wind farm power plant.
                    </Card.Text>
                </Card.Body>
            </Card>
        )
    }

    return (
        <Card className='h-100'>
            <Card.Img
                variant='top'
                src={place.image || NO_IMAGE}
                alt={place.place_name}
                onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE }}
            />
            <Card.Body>
                <Card.Title>{place.place_name}</Card.Title>

                <Badge variant='info' className='mb-2'>{place.category_name}</Badge>

                {place.site && <Card.Text className='mb-1'>{place.site}</Card.Text>}
                {place.coordinates && (
                    <Card.Text className='mb-1 text-muted'>{place.coordinates}</Card.Text>
                )}
                {place.info && <Card.Text>{place.info}</Card.Text>}

                <Card.Text className='text-muted small mb-0'>
                    {Number(place.latitude).toFixed(5)}, {Number(place.longitude).toFixed(5)}
                </Card.Text>

                {canEdit && (
                    <LinkContainer to={`/places/${place._id}/edit`}>
                        <Button variant='warning' size='sm' className='mt-3'>
                            <i className='fas fa-edit mr-1'></i> Edit this power plant
                        </Button>
                    </LinkContainer>
                )}
            </Card.Body>
        </Card>
    )
}

export default PlaceInfoPanel

import React from 'react'
import { Form, Button, Row, Col, Image } from 'react-bootstrap'

import LocationPicker from './LocationPicker'

/** Shared by the create and edit screens - the only difference between them is
 *  which action they dispatch on submit. */
function PlaceForm({ values, setValues, categories, onSubmit, submitLabel, onCancel }) {
    const set = (field) => (e) => setValues({ ...values, [field]: e.target.value })

    const pickLocation = (lat, lng) => {
        setValues({ ...values, latitude: lat.toFixed(6), longitude: lng.toFixed(6) })
    }

    return (
        <Form onSubmit={onSubmit}>
            <Form.Group controlId='place_name'>
                <Form.Label>Power plant name</Form.Label>
                <Form.Control
                    type='text'
                    required
                    placeholder='e.g. Forsmark'
                    value={values.place_name}
                    onChange={set('place_name')}
                />
            </Form.Group>

            <Form.Group controlId='category'>
                <Form.Label>Power plant type</Form.Label>
                <Form.Control
                    as='select'
                    required
                    value={values.category}
                    onChange={set('category')}
                >
                    <option value=''>-- select a type --</option>
                    {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                    ))}
                </Form.Control>
            </Form.Group>

            <Row>
                <Col md={6}>
                    <Form.Group controlId='latitude'>
                        <Form.Label>Latitude</Form.Label>
                        <Form.Control
                            type='number'
                            step='any'
                            required
                            value={values.latitude}
                            onChange={set('latitude')}
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group controlId='longitude'>
                        <Form.Label>Longitude</Form.Label>
                        <Form.Control
                            type='number'
                            step='any'
                            required
                            value={values.longitude}
                            onChange={set('longitude')}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Form.Group>
                <Form.Label>Pick the location</Form.Label>
                <LocationPicker
                    latitude={values.latitude}
                    longitude={values.longitude}
                    onPick={pickLocation}
                />
                <Form.Text className='text-muted'>
                    Click the map or drag the pin to set the coordinates.
                </Form.Text>
            </Form.Group>

            <Form.Group controlId='site'>
                <Form.Label>Location line</Form.Label>
                <Form.Control
                    type='text'
                    placeholder='e.g. Location: Uppsala County'
                    value={values.site}
                    onChange={set('site')}
                />
            </Form.Group>

            <Form.Group controlId='coordinates'>
                <Form.Label>Coordinates line</Form.Label>
                <Form.Control
                    type='text'
                    placeholder="e.g. Coordinates: 60°24′10″N 18°10′30″E"
                    value={values.coordinates}
                    onChange={set('coordinates')}
                />
                <Form.Text className='text-muted'>
                    Free text shown in the info panel - the actual geometry comes from
                    the latitude/longitude above.
                </Form.Text>
            </Form.Group>

            <Form.Group controlId='info'>
                <Form.Label>Info</Form.Label>
                <Form.Control
                    as='textarea'
                    rows={4}
                    value={values.info}
                    onChange={set('info')}
                />
            </Form.Group>

            <Form.Group controlId='image'>
                <Form.Label>Photo</Form.Label>
                {values.currentImage && (
                    <div className='mb-2'>
                        <Image src={values.currentImage} alt='' thumbnail width='160' />
                    </div>
                )}
                <Form.Control
                    type='file'
                    accept='image/*'
                    onChange={(e) => setValues({ ...values, imageFile: e.target.files[0] || null })}
                />
            </Form.Group>

            <Form.Group controlId='active'>
                <Form.Check
                    type='checkbox'
                    label='Active (shown on the map)'
                    checked={values.active}
                    onChange={(e) => setValues({ ...values, active: e.target.checked })}
                />
            </Form.Group>

            <Button type='submit' variant='primary'>{submitLabel}</Button>
            <Button variant='secondary' className='ml-2' onClick={onCancel}>Cancel</Button>
        </Form>
    )
}

export default PlaceForm

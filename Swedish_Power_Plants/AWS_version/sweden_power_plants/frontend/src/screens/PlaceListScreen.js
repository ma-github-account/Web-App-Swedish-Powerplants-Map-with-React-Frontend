import React, { useEffect, useState } from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import { Table, Button, Row, Col, Form, Modal, Image } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import Loader from '../components/Loader'
import Message from '../components/Message'
import { listPlaces, deletePlace } from '../actions/placeActions'
// Bundled with the app rather than fetched from MEDIA_URL - see PlaceInfoPanel.
import NO_IMAGE from '../assets/no-image-available.jpg'

const COLUMNS = [
    { key: '_id', label: 'ID' },
    { key: 'place_name', label: 'POWER PLANT' },
    { key: 'category_name', label: 'TYPE' },
    { key: 'latitude', label: 'LAT' },
    { key: 'longitude', label: 'LNG' },
]

function SortIcon({ direction }) {
    if (!direction) return <span style={{ opacity: 0.3, marginLeft: 4 }}>⇅</span>
    return <span style={{ marginLeft: 4 }}>{direction === 'asc' ? '↑' : '↓'}</span>
}

/** The row that unfolds under a power plant when its row is clicked. */
function PlaceDetailRow({ place, colSpan }) {
    return (
        <tr className='spp-detail-row'>
            <td colSpan={colSpan}>
                <div className='spp-detail'>
                    <div className='spp-detail-media'>
                        {/* No `fluid`: that sets height:auto, which would undo the
                            fixed 260x170 box every photo now shares. */}
                        <Image
                            src={place.image || NO_IMAGE}
                            alt={place.place_name}
                            onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE }}
                            rounded
                        />
                    </div>

                    <div className='spp-detail-body'>
                        <h3 className='spp-detail-title'>
                            {place.category_icon && (
                                <img src={place.category_icon} alt='' width='26' height='26' />
                            )}
                            {place.place_name}
                        </h3>

                        <dl className='spp-detail-grid'>
                            <dt>Type</dt>
                            <dd>{place.category_name}</dd>

                            <dt>Location</dt>
                            <dd>{place.site || '—'}</dd>

                            <dt>Coordinates</dt>
                            <dd>{place.coordinates || '—'}</dd>

                            <dt>Latitude / Longitude</dt>
                            <dd>
                                {Number(place.latitude).toFixed(5)}, {Number(place.longitude).toFixed(5)}
                            </dd>

                            <dt>Shown on map</dt>
                            <dd>{place.active ? 'Yes' : 'No'}</dd>
                        </dl>

                        {place.info && <p className='spp-detail-info'>{place.info}</p>}
                    </div>
                </div>
            </td>
        </tr>
    )
}

function PlaceListScreen() {
    const [filterText, setFilterText] = useState('')
    const [sortKey, setSortKey] = useState(null)
    const [sortDir, setSortDir] = useState('asc')
    const [confirmPlace, setConfirmPlace] = useState(null)
    const [expandedId, setExpandedId] = useState(null)

    const dispatch = useDispatch()

    const placeList = useSelector(state => state.placeList)
    const { loading, error, places } = placeList

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    const placeDelete = useSelector(state => state.placeDelete)
    const { success: successDelete, error: errorDelete } = placeDelete

    useEffect(() => {
        dispatch(listPlaces())
    }, [dispatch, successDelete])

    const confirmDelete = () => {
        dispatch(deletePlace(confirmPlace._id))
        setConfirmPlace(null)
    }

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    const filtered = places.filter(p => {
        const q = filterText.toLowerCase()
        return (
            String(p._id).toLowerCase().includes(q) ||
            (p.place_name || '').toLowerCase().includes(q) ||
            (p.category_name || '').toLowerCase().includes(q) ||
            (p.site || '').toLowerCase().includes(q)
        )
    })

    const sortedPlaces = sortKey
        ? [...filtered].sort((a, b) => {
            const av = a[sortKey]
            const bv = b[sortKey]
            // Lat/lng and id are numeric - comparing them as strings puts 10 before 2.
            if (typeof av === 'number' && typeof bv === 'number') {
                return sortDir === 'asc' ? av - bv : bv - av
            }
            const as = String(av ?? '').toLowerCase()
            const bs = String(bv ?? '').toLowerCase()
            if (as < bs) return sortDir === 'asc' ? -1 : 1
            if (as > bs) return sortDir === 'asc' ? 1 : -1
            return 0
        })
        : filtered

    const colSpan = COLUMNS.length + 2 + (userInfo ? 1 : 0)

    return (
        <div>
            <Row className='align-items-center'>
                <Col>
                    <h1>Power Plants</h1>
                </Col>
                <Col className='text-right'>
                    {userInfo && (
                        <LinkContainer to='/places/create'>
                            <Button className='my-3'>
                                <i className='fas fa-plus mr-1'></i> Add Power Plant
                            </Button>
                        </LinkContainer>
                    )}
                </Col>
            </Row>

            {errorDelete && <Message variant='danger'>{errorDelete}</Message>}

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant='danger'>{error}</Message>
            ) : (
                <>
                    <Form.Control
                        type='text'
                        placeholder='Filter by name, type, location…'
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className='mb-3'
                    />

                    <Table striped bordered hover responsive className='table-sm spp-table'>
                        <thead>
                            <tr>
                                <th style={{ width: 34 }}></th>
                                <th style={{ width: 40 }}></th>
                                {COLUMNS.map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                                    >
                                        {col.label}
                                        <SortIcon direction={sortKey === col.key ? sortDir : null} />
                                    </th>
                                ))}
                                {userInfo && <th>ACTIONS</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPlaces.map(place => {
                                const expanded = expandedId === place._id
                                return (
                                    <React.Fragment key={place._id}>
                                        <tr
                                            className={`spp-clickable-row ${expanded ? 'is-expanded' : ''}`}
                                            onClick={() => setExpandedId(expanded ? null : place._id)}
                                            aria-expanded={expanded}
                                        >
                                            <td className='spp-chevron'>
                                                <i className={`fas fa-chevron-${expanded ? 'down' : 'right'}`}></i>
                                            </td>
                                            <td>
                                                {place.category_icon && (
                                                    <Image src={place.category_icon} alt='' width='24' height='24' />
                                                )}
                                            </td>
                                            <td>{place._id}</td>
                                            <td>{place.place_name}</td>
                                            <td>{place.category_name}</td>
                                            <td>{Number(place.latitude).toFixed(4)}</td>
                                            <td>{Number(place.longitude).toFixed(4)}</td>
                                            {userInfo && (
                                                <td
                                                    style={{ whiteSpace: 'nowrap' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <LinkContainer to={`/places/${place._id}/edit`}>
                                                        <Button variant='warning' className='btn-sm mr-1'>
                                                            <i className='fas fa-edit mr-1'></i> Edit
                                                        </Button>
                                                    </LinkContainer>

                                                    <Button
                                                        variant='danger'
                                                        className='btn-sm'
                                                        onClick={() => setConfirmPlace(place)}
                                                    >
                                                        <i className='fas fa-trash mr-1'></i> Delete
                                                    </Button>
                                                </td>
                                            )}
                                        </tr>

                                        {expanded && <PlaceDetailRow place={place} colSpan={colSpan} />}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </Table>
                </>
            )}

            <Modal centered show={!!confirmPlace} onHide={() => setConfirmPlace(null)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {confirmPlace && (
                        <p>
                            Are you sure you want to remove{' '}
                            <strong>{confirmPlace.place_name}</strong> from the map?
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={() => setConfirmPlace(null)}>
                        Cancel
                    </Button>
                    <Button variant='danger' onClick={confirmDelete}>
                        <i className='fas fa-trash mr-1'></i> Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default PlaceListScreen

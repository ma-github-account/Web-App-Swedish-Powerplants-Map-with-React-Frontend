import React, { useEffect, useState } from 'react'
import { Table, Button, Row, Col, Form, Modal, Image } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import Loader from '../components/Loader'
import Message from '../components/Message'
import { listCategories, createCategory, deleteCategory } from '../actions/categoryActions'
import { listPlaces } from '../actions/placeActions'
import { CATEGORY_CREATE_RESET } from '../constants/categoryConstants'

/** The row that unfolds under a type when its row is clicked. Lists the plants
 *  that belong to it, which is the thing the table itself cannot show. */
function CategoryDetailRow({ category, places, colSpan }) {
    const own = places.filter(p => p.category_name === category.category_name)

    return (
        <tr className='spp-detail-row'>
            <td colSpan={colSpan}>
                <div className='spp-detail'>
                    <div className='spp-detail-media spp-detail-media--icon'>
                        {category.icon
                            ? <img src={category.icon} alt='' width='96' height='96' />
                            : <div className='spp-detail-noicon'>no icon</div>}
                    </div>

                    <div className='spp-detail-body'>
                        <h3 className='spp-detail-title'>{category.category_name}</h3>

                        <p className='spp-detail-description'>
                            {category.description || 'No description for this type yet.'}
                        </p>

                        {own.length > 0 && (
                            <div className='spp-detail-plants'>
                                <span className='spp-detail-plants-label'>Plants of this type:</span>
                                <ul>
                                    {own.map(p => (
                                        <li key={p._id}>
                                            {p.place_name}
                                            <span className='text-muted'>
                                                {' '}— {Number(p.latitude).toFixed(3)}, {Number(p.longitude).toFixed(3)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    )
}

function CategoryListScreen() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [iconFile, setIconFile] = useState(null)
    const [confirmCategory, setConfirmCategory] = useState(null)
    const [expandedId, setExpandedId] = useState(null)

    const dispatch = useDispatch()

    const categoryList = useSelector(state => state.categoryList)
    const { loading, error, categories } = categoryList

    const placeList = useSelector(state => state.placeList)
    const { places } = placeList

    const categoryCreate = useSelector(state => state.categoryCreate)
    const { error: errorCreate, success: successCreate } = categoryCreate

    const categoryDelete = useSelector(state => state.categoryDelete)
    const { error: errorDelete, success: successDelete } = categoryDelete

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    useEffect(() => {
        dispatch(listCategories())
        // Needed so an unfolded type can list the plants that belong to it.
        dispatch(listPlaces())
    }, [dispatch, successCreate, successDelete])

    useEffect(() => {
        if (successCreate) {
            dispatch({ type: CATEGORY_CREATE_RESET })
            setName('')
            setDescription('')
            setIconFile(null)
        }
    }, [dispatch, successCreate])

    const submitHandler = (e) => {
        e.preventDefault()

        const formData = new FormData()
        formData.append('category_name', name)
        formData.append('description', description)
        if (iconFile) {
            formData.append('icon', iconFile)
        }

        dispatch(createCategory(formData))
    }

    const confirmDelete = () => {
        dispatch(deleteCategory(confirmCategory._id))
        setConfirmCategory(null)
    }

    const colSpan = 5 + (userInfo ? 1 : 0)

    return (
        <div>
            <h1>Power Plant Types</h1>

            {errorCreate && <Message variant='danger'>{errorCreate}</Message>}
            {errorDelete && <Message variant='danger'>{errorDelete}</Message>}

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant='danger'>{error}</Message>
            ) : (
                <Table striped bordered hover responsive className='table-sm spp-table'>
                    <thead>
                        <tr>
                            <th style={{ width: 34 }}></th>
                            <th style={{ width: 50 }}>ICON</th>
                            <th>ID</th>
                            <th>NAME</th>
                            <th>PLANTS</th>
                            {userInfo && <th>ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => {
                            const expanded = expandedId === cat._id
                            return (
                                <React.Fragment key={cat._id}>
                                    <tr
                                        className={`spp-clickable-row ${expanded ? 'is-expanded' : ''}`}
                                        onClick={() => setExpandedId(expanded ? null : cat._id)}
                                        aria-expanded={expanded}
                                    >
                                        <td className='spp-chevron'>
                                            <i className={`fas fa-chevron-${expanded ? 'down' : 'right'}`}></i>
                                        </td>
                                        <td>
                                            {cat.icon
                                                ? <Image src={cat.icon} alt='' width='28' height='28' />
                                                : <span className='text-muted'>—</span>}
                                        </td>
                                        <td>{cat._id}</td>
                                        <td>{cat.category_name}</td>
                                        <td>{cat.placeCount}</td>
                                        {userInfo && (
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant='danger'
                                                    className='btn-sm'
                                                    onClick={() => setConfirmCategory(cat)}
                                                >
                                                    <i className='fas fa-trash mr-1'></i> Delete
                                                </Button>
                                            </td>
                                        )}
                                    </tr>

                                    {expanded && (
                                        <CategoryDetailRow
                                            category={cat}
                                            places={places}
                                            colSpan={colSpan}
                                        />
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </Table>
            )}

            {userInfo && (
                <>
                    <h2>Add a power plant type</h2>
                    <Form onSubmit={submitHandler}>
                        <Row className='align-items-end'>
                            <Col md={5}>
                                <Form.Group controlId='category_name'>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type='text'
                                        required
                                        placeholder='e.g. Geothermal Power Plant'
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group controlId='icon'>
                                    <Form.Label>Marker icon</Form.Label>
                                    <Form.Control
                                        type='file'
                                        accept='image/*'
                                        onChange={(e) => setIconFile(e.target.files[0] || null)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Button type='submit' variant='primary' block>
                                        <i className='fas fa-plus mr-1'></i> Add
                                    </Button>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group controlId='description'>
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as='textarea'
                                rows={3}
                                placeholder='What this kind of power plant is, and its role in Sweden'
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </>
            )}

            <Modal centered show={!!confirmCategory} onHide={() => setConfirmCategory(null)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {confirmCategory && (
                        <p>
                            Delete type <strong>{confirmCategory.category_name}</strong>?
                            {confirmCategory.placeCount > 0 && (
                                <> It still has {confirmCategory.placeCount} plant(s), so the
                                server will refuse.</>
                            )}
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={() => setConfirmCategory(null)}>
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

export default CategoryListScreen

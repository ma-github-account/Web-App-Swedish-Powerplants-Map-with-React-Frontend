import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import FormContainer from '../components/FormContainer'
import PlaceForm from '../components/PlaceForm'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { createPlace } from '../actions/placeActions'
import { listCategories } from '../actions/categoryActions'
import { PLACE_CREATE_RESET } from '../constants/placeConstants'

const EMPTY = {
    place_name: '',
    category: '',
    latitude: '',
    longitude: '',
    site: '',
    coordinates: '',
    info: '',
    active: true,
    imageFile: null,
    currentImage: '',
}

function PlaceCreateScreen({ history }) {
    const [values, setValues] = useState(EMPTY)

    const dispatch = useDispatch()

    const placeCreate = useSelector(state => state.placeCreate)
    const { loading, error, success } = placeCreate

    const categoryList = useSelector(state => state.categoryList)
    const { categories } = categoryList

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    useEffect(() => {
        if (!userInfo) {
            history.push('/login')
            return
        }
        dispatch(listCategories())
    }, [dispatch, history, userInfo])

    useEffect(() => {
        if (success) {
            dispatch({ type: PLACE_CREATE_RESET })
            history.push('/places')
        }
    }, [dispatch, history, success])

    const submitHandler = (e) => {
        e.preventDefault()

        // Always multipart: the photo is optional but the endpoint handles both
        // shapes, and one code path is easier to reason about than two.
        const formData = new FormData()
        formData.append('place_name', values.place_name)
        formData.append('category', values.category)
        formData.append('latitude', values.latitude)
        formData.append('longitude', values.longitude)
        formData.append('site', values.site)
        formData.append('coordinates', values.coordinates)
        formData.append('info', values.info)
        formData.append('active', values.active)
        if (values.imageFile) {
            formData.append('image', values.imageFile)
        }

        dispatch(createPlace(formData))
    }

    return (
        <FormContainer>
            <Link to='/places' className='btn btn-light my-3'>Go Back</Link>

            <h1>Add Power Plant</h1>

            {error && <Message variant='danger'>{error}</Message>}
            {loading && <Loader />}

            <PlaceForm
                values={values}
                setValues={setValues}
                categories={categories}
                onSubmit={submitHandler}
                submitLabel='Create'
                onCancel={() => history.push('/places')}
            />
        </FormContainer>
    )
}

export default PlaceCreateScreen

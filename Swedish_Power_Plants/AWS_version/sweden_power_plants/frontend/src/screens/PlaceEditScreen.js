import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import FormContainer from '../components/FormContainer'
import PlaceForm from '../components/PlaceForm'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { getPlaceDetails, updatePlace } from '../actions/placeActions'
import { listCategories } from '../actions/categoryActions'
import { PLACE_UPDATE_RESET, PLACE_DETAILS_RESET } from '../constants/placeConstants'

function PlaceEditScreen({ match, history }) {
    const placeId = match.params.id

    const [values, setValues] = useState({
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
    })

    const dispatch = useDispatch()

    const placeDetails = useSelector(state => state.placeDetails)
    const { loading, error, place } = placeDetails

    const placeUpdate = useSelector(state => state.placeUpdate)
    const { loading: loadingUpdate, error: errorUpdate, success: successUpdate } = placeUpdate

    const categoryList = useSelector(state => state.categoryList)
    const { categories } = categoryList

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    // Fetch once per id. Deliberately does NOT depend on `place`: the details
    // reducer hands back a fresh object on every action, so depending on it
    // would re-trigger the fetch forever.
    useEffect(() => {
        if (!userInfo) {
            history.push('/login')
            return
        }
        dispatch(listCategories())
        dispatch(getPlaceDetails(placeId))
    }, [dispatch, history, userInfo, placeId])

    // Copy the loaded record into the form exactly once, when it arrives.
    useEffect(() => {
        if (place && String(place._id) === String(placeId)) {
            setValues({
                place_name: place.place_name || '',
                category: place.category || '',
                latitude: place.latitude != null ? String(place.latitude) : '',
                longitude: place.longitude != null ? String(place.longitude) : '',
                site: place.site || '',
                coordinates: place.coordinates || '',
                info: place.info || '',
                active: place.active !== false,
                imageFile: null,
                currentImage: place.image || '',
            })
        }
    }, [place, placeId])

    useEffect(() => {
        if (successUpdate) {
            dispatch({ type: PLACE_UPDATE_RESET })
            dispatch({ type: PLACE_DETAILS_RESET })
            history.push('/places')
        }
    }, [dispatch, history, successUpdate])

    const submitHandler = (e) => {
        e.preventDefault()

        const formData = new FormData()
        formData.append('_id', placeId)
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

        dispatch(updatePlace(formData))
    }

    return (
        <FormContainer>
            <Link to='/places' className='btn btn-light my-3'>Go Back</Link>

            <h1>Edit Power Plant</h1>

            {errorUpdate && <Message variant='danger'>{errorUpdate}</Message>}
            {loadingUpdate && <Loader />}

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant='danger'>{error}</Message>
            ) : (
                <PlaceForm
                    values={values}
                    setValues={setValues}
                    categories={categories}
                    onSubmit={submitHandler}
                    submitLabel='Save changes'
                    onCancel={() => history.push('/places')}
                />
            )}
        </FormContainer>
    )
}

export default PlaceEditScreen

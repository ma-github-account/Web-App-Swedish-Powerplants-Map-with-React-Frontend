import axios from 'axios'
import {
    PLACE_LIST_REQUEST,
    PLACE_LIST_SUCCESS,
    PLACE_LIST_FAIL,

    PLACE_DETAILS_REQUEST,
    PLACE_DETAILS_SUCCESS,
    PLACE_DETAILS_FAIL,

    PLACE_CREATE_REQUEST,
    PLACE_CREATE_SUCCESS,
    PLACE_CREATE_FAIL,

    PLACE_UPDATE_REQUEST,
    PLACE_UPDATE_SUCCESS,
    PLACE_UPDATE_FAIL,

    PLACE_DELETE_REQUEST,
    PLACE_DELETE_SUCCESS,
    PLACE_DELETE_FAIL,
} from '../constants/placeConstants'


// The API returns DRF field errors as {field: [msg, ...]}; flatten so the
// Message component can show something readable instead of "[object Object]".
const readError = (error) => {
    const data = error.response && error.response.data
    if (!data) return error.message
    if (data.detail) return data.detail
    if (typeof data === 'string') return data
    return Object.entries(data)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
        .join(' | ')
}


export const listPlaces = () => async (dispatch) => {
    try {
        dispatch({ type: PLACE_LIST_REQUEST })

        // Public endpoint - the map must work for logged-out visitors.
        const { data } = await axios.get('/api/places/')

        dispatch({ type: PLACE_LIST_SUCCESS, payload: data })

    } catch (error) {
        dispatch({ type: PLACE_LIST_FAIL, payload: readError(error) })
    }
}


export const getPlaceDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: PLACE_DETAILS_REQUEST })

        const { data } = await axios.get(`/api/places/${id}/`)

        dispatch({ type: PLACE_DETAILS_SUCCESS, payload: data })

    } catch (error) {
        dispatch({ type: PLACE_DETAILS_FAIL, payload: readError(error) })
    }
}


export const createPlace = (place) => async (dispatch, getState) => {
    try {
        dispatch({ type: PLACE_CREATE_REQUEST })

        const { userLogin: { userInfo } } = getState()

        const isFormData = place instanceof FormData

        const config = {
            headers: {
                // Let axios set Content-Type for FormData - it has to include
                // the multipart boundary in the header value.
                ...(isFormData ? {} : { 'Content-type': 'application/json' }),
                Authorization: `Bearer ${userInfo.token}`
            }
        }

        const { data } = await axios.post('/api/places/create/', place, config)

        dispatch({ type: PLACE_CREATE_SUCCESS, payload: data })

    } catch (error) {
        dispatch({ type: PLACE_CREATE_FAIL, payload: readError(error) })
    }
}


export const updatePlace = (place) => async (dispatch, getState) => {
    try {
        dispatch({ type: PLACE_UPDATE_REQUEST })

        const { userLogin: { userInfo } } = getState()

        const isFormData = place instanceof FormData
        const id = isFormData ? place.get('_id') : place._id

        const config = {
            headers: {
                ...(isFormData ? {} : { 'Content-type': 'application/json' }),
                Authorization: `Bearer ${userInfo.token}`
            }
        }

        const { data } = await axios.put(`/api/places/update/${id}/`, place, config)

        dispatch({ type: PLACE_UPDATE_SUCCESS, payload: data })

    } catch (error) {
        dispatch({ type: PLACE_UPDATE_FAIL, payload: readError(error) })
    }
}


export const deletePlace = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: PLACE_DELETE_REQUEST })

        const { userLogin: { userInfo } } = getState()

        const config = {
            headers: {
                'Content-type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }

        await axios.delete(`/api/places/delete/${id}/`, config)

        dispatch({ type: PLACE_DELETE_SUCCESS })

    } catch (error) {
        dispatch({ type: PLACE_DELETE_FAIL, payload: readError(error) })
    }
}

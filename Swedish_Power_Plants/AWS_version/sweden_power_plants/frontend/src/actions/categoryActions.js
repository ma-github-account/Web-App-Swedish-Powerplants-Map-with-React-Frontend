import axios from 'axios'
import {
    CATEGORY_LIST_REQUEST,
    CATEGORY_LIST_SUCCESS,
    CATEGORY_LIST_FAIL,

    CATEGORY_CREATE_REQUEST,
    CATEGORY_CREATE_SUCCESS,
    CATEGORY_CREATE_FAIL,

    CATEGORY_DELETE_REQUEST,
    CATEGORY_DELETE_SUCCESS,
    CATEGORY_DELETE_FAIL,
} from '../constants/categoryConstants'


const readError = (error) => {
    const data = error.response && error.response.data
    if (!data) return error.message
    if (data.detail) return data.detail
    if (typeof data === 'string') return data
    return Object.entries(data)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
        .join(' | ')
}


export const listCategories = () => async (dispatch) => {
    try {
        dispatch({ type: CATEGORY_LIST_REQUEST })

        const { data } = await axios.get('/api/categories/')

        dispatch({ type: CATEGORY_LIST_SUCCESS, payload: data })

    } catch (error) {
        dispatch({ type: CATEGORY_LIST_FAIL, payload: readError(error) })
    }
}


export const createCategory = (category) => async (dispatch, getState) => {
    try {
        dispatch({ type: CATEGORY_CREATE_REQUEST })

        const { userLogin: { userInfo } } = getState()

        const isFormData = category instanceof FormData

        const config = {
            headers: {
                ...(isFormData ? {} : { 'Content-type': 'application/json' }),
                Authorization: `Bearer ${userInfo.token}`
            }
        }

        const { data } = await axios.post('/api/categories/create/', category, config)

        dispatch({ type: CATEGORY_CREATE_SUCCESS, payload: data })

    } catch (error) {
        dispatch({ type: CATEGORY_CREATE_FAIL, payload: readError(error) })
    }
}


export const deleteCategory = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: CATEGORY_DELETE_REQUEST })

        const { userLogin: { userInfo } } = getState()

        const config = {
            headers: {
                'Content-type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        }

        await axios.delete(`/api/categories/delete/${id}/`, config)

        dispatch({ type: CATEGORY_DELETE_SUCCESS })

    } catch (error) {
        dispatch({ type: CATEGORY_DELETE_FAIL, payload: readError(error) })
    }
}

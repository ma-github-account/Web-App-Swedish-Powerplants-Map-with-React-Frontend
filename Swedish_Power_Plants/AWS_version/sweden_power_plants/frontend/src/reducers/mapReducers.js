import {
    MAP_TOGGLE_CATEGORY,
    MAP_SET_ALL_CATEGORIES,
    MAP_SELECT_PLACE,
} from '../constants/mapConstants'

/** Which power plant types the user has switched OFF, plus the marker they
 *  last clicked. Kept in the store because the Display Settings dropdown lives
 *  in the top bar while the markers live in the map screen. Storing the hidden
 *  set (rather than the visible one) means a newly added type is shown by
 *  default without the reducer having to know the type list up front. */
const initialState = {
    hiddenCategories: [],
    selectedPlace: null,
}

export const mapReducer = (state = initialState, action) => {
    switch (action.type) {
        case MAP_TOGGLE_CATEGORY: {
            const name = action.payload
            const hidden = state.hiddenCategories.includes(name)
                ? state.hiddenCategories.filter(c => c !== name)
                : [...state.hiddenCategories, name]
            return { ...state, hiddenCategories: hidden }
        }
        case MAP_SET_ALL_CATEGORIES: {
            const { categoryNames, visible } = action.payload
            return { ...state, hiddenCategories: visible ? [] : [...categoryNames] }
        }
        case MAP_SELECT_PLACE:
            return { ...state, selectedPlace: action.payload }
        default:
            return state
    }
}

import {
    MAP_TOGGLE_CATEGORY,
    MAP_SET_ALL_CATEGORIES,
    MAP_SELECT_PLACE,
} from '../constants/mapConstants'

/** Show/hide one power plant type on the map. */
export const toggleCategory = (categoryName) => ({
    type: MAP_TOGGLE_CATEGORY,
    payload: categoryName,
})

/** Tick or untick every type at once. */
export const setAllCategories = (categoryNames, visible) => ({
    type: MAP_SET_ALL_CATEGORIES,
    payload: { categoryNames, visible },
})

export const selectPlace = (place) => ({
    type: MAP_SELECT_PLACE,
    payload: place,
})

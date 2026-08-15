import React, { useCallback, useEffect, useMemo } from 'react'
import { Row, Col } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import Loader from '../components/Loader'
import Message from '../components/Message'
import MapView from '../components/MapView'
import PlaceInfoPanel from '../components/PlaceInfoPanel'
import DisplaySettings from '../components/DisplaySettings'
import { listPlaces } from '../actions/placeActions'
import { selectPlace } from '../actions/mapActions'

function MapScreen() {
    const dispatch = useDispatch()

    const placeList = useSelector(state => state.placeList)
    const { loading, error, places } = placeList

    // Which types are ticked lives in the store: the Display Settings control
    // floats over the map while the markers are rendered inside MapView.
    const mapState = useSelector(state => state.map)
    const { hiddenCategories, selectedPlace } = mapState

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    // Types are fetched once in App for the top bar's Display Settings menu.
    useEffect(() => {
        dispatch(listPlaces())
    }, [dispatch])

    // ClusterLayer rebuilds its markers whenever this identity changes, so it
    // has to be memoised rather than recreated on every render.
    const onSelect = useCallback((place) => dispatch(selectPlace(place)), [dispatch])

    const visiblePlaces = useMemo(
        () => places.filter(p => !hiddenCategories.includes(p.category_name)),
        [places, hiddenCategories]
    )

    return (
        <div className='spp-mapscreen'>
            {error && <Message variant='danger'>{error}</Message>}

            {loading ? (
                <Loader />
            ) : (
                <Row noGutters className='spp-maprow'>
                    <Col lg={9} className='pr-lg-3 spp-mapcol'>
                        {/* Fills the viewport below the top bar - the map is the page.
                            Display Settings only ever affects the map, so it floats over
                            it rather than living in the global top bar. It is a sibling of
                            the map, not a Leaflet control, so opening it cannot drag or
                            zoom the map underneath. */}
                        <div className='spp-map-shell'>
                            <div className='spp-map-overlay'>
                                <DisplaySettings />
                            </div>
                            <MapView places={visiblePlaces} onSelect={onSelect} height='100%' />
                        </div>
                    </Col>
                    <Col lg={3} className='spp-panelcol'>
                        <PlaceInfoPanel place={selectedPlace} canEdit={!!userInfo} />
                    </Col>
                </Row>
            )}
        </div>
    )
}

export default MapScreen

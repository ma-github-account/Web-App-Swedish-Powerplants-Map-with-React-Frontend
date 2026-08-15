import { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { HashRouter as Router, Route, Switch, useLocation } from 'react-router-dom'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { useDispatch } from 'react-redux'

import TopBar from './components/TopBar'
import MapScreen from './screens/MapScreen'
import PlaceListScreen from './screens/PlaceListScreen'
import PlaceCreateScreen from './screens/PlaceCreateScreen'
import PlaceEditScreen from './screens/PlaceEditScreen'
import CategoryListScreen from './screens/CategoryListScreen'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ProfileScreen from './screens/ProfileScreen'
import { listCategories } from './actions/categoryActions'


function AppRoutes() {
  const location = useLocation()

  return (
    <TransitionGroup component={null}>
      <CSSTransition key={location.pathname} classNames='page' timeout={220} unmountOnExit>
        <Switch location={location}>
          <Route path='/' component={MapScreen} exact />
          <Route path='/login' component={LoginScreen} />
          <Route path='/register' component={RegisterScreen} />
          <Route path='/profile' component={ProfileScreen} />

          <Route path='/places' component={PlaceListScreen} exact />
          <Route path='/places/create' component={PlaceCreateScreen} />
          <Route path='/places/:id/edit' component={PlaceEditScreen} />

          <Route path='/categories' component={CategoryListScreen} />
        </Switch>
      </CSSTransition>
    </TransitionGroup>
  )
}

function App() {
  const dispatch = useDispatch()

  // The Display Settings dropdown lives in the always-mounted top bar, so the
  // type list is fetched once here rather than per screen.
  useEffect(() => {
    dispatch(listCategories())
  }, [dispatch])

  return (
    <Router>
      <TopBar />
      {/* No footer: the map and its info panel run all the way to the bottom
          of the window. */}
      <main className='spp-main'>
        <Container fluid style={{ position: 'relative' }}>
          <AppRoutes />
        </Container>
      </main>
    </Router>
  );
}

export default App;

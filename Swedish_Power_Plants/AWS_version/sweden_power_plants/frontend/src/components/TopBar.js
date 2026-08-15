import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import BrandLogo from './BrandLogo'
import { logout } from '../actions/userActions'

/** Komoot-style top bar: brand mark and wordmark hard left, navigation and
 *  controls right, one thin bottom border and nothing else. Replaces the
 *  Bootstrap navbar the Ethiopian port used. */
function TopBar() {
    const [darkMode, setDarkMode] = useState(() =>
        localStorage.getItem('theme') === 'dark'
    )
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [navOpen, setNavOpen] = useState(false)
    const userRef = useRef(null)

    const dispatch = useDispatch()

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.body.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [darkMode])

    useEffect(() => {
        if (!userMenuOpen) return undefined
        const onPointerDown = (e) => {
            if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false)
        }
        document.addEventListener('mousedown', onPointerDown)
        return () => document.removeEventListener('mousedown', onPointerDown)
    }, [userMenuOpen])

    /** The brand does a real document reload back to the map rather than a
     *  router navigation, so it doubles as a "start over" - and it picks up a
     *  freshly built bundle, which an in-app route change never would. */
    const reloadApp = (e) => {
        e.preventDefault()
        const home = window.location.origin + window.location.pathname
        if (window.location.href === home) {
            window.location.reload()
        } else {
            window.location.href = home
        }
    }

    return (
        <header className='spp-topbar'>
            <div className='spp-topbar-inner'>

                <a href='/' className='spp-brand' onClick={reloadApp}>
                    <BrandLogo size={34} />
                    <span className='spp-brand-text'>Swedish Powerplants Map</span>
                </a>

                <button
                    type='button'
                    className='spp-burger'
                    onClick={() => setNavOpen(o => !o)}
                    aria-label='Toggle navigation'
                >
                    <i className='fas fa-bars'></i>
                </button>

                <div className={`spp-topbar-right ${navOpen ? 'is-open' : ''}`}>
                    <nav className='spp-nav'>
                        <NavLink exact to='/' className='spp-navlink' activeClassName='is-active'>
                            Map
                        </NavLink>
                        <NavLink to='/places' className='spp-navlink' activeClassName='is-active'>
                            Power Plants
                        </NavLink>
                        <NavLink to='/categories' className='spp-navlink' activeClassName='is-active'>
                            Types
                        </NavLink>
                    </nav>

                    {/* Display Settings lives on the map screen itself - it only
                        affects the map, so it has no business in a global bar. */}

                    <button
                        type='button'
                        className='spp-iconbtn'
                        onClick={() => setDarkMode(d => !d)}
                        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        aria-label='Toggle colour theme'
                    >
                        <i className={darkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
                    </button>

                    {/* No Login button: signing in is reached via /#/login directly.
                        The account menu only appears once someone is signed in. */}
                    {userInfo && (
                        <div className='spp-dropdown' ref={userRef}>
                            <button
                                type='button'
                                className={`spp-dropdown-toggle ${userMenuOpen ? 'is-open' : ''}`}
                                onClick={() => setUserMenuOpen(o => !o)}
                                aria-expanded={userMenuOpen}
                            >
                                <i className='fas fa-user-circle mr-2'></i>
                                {userInfo.name || userInfo.username}
                                <i className={`fas fa-chevron-down spp-caret ${userMenuOpen ? 'is-open' : ''}`}></i>
                            </button>

                            {userMenuOpen && (
                                <div className='spp-dropdown-panel spp-dropdown-panel--narrow'>
                                    <Link
                                        to='/profile'
                                        className='spp-menuitem'
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <i className='fas fa-id-card mr-2'></i> Profile
                                    </Link>
                                    <button
                                        type='button'
                                        className='spp-menuitem'
                                        onClick={() => { setUserMenuOpen(false); dispatch(logout()) }}
                                    >
                                        <i className='fas fa-sign-out-alt mr-2'></i> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default TopBar

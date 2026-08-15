import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { toggleCategory, setAllCategories } from '../actions/mapActions'

/** The "Display Settings" dropdown in the top bar, modelled on komoot's
 *  "Zawartość mapy" panel: a labelled group of checkboxes, one per power plant
 *  type, each with its own marker icon. Everything is ticked by default -
 *  the store tracks which types are hidden, so a type nobody has touched is
 *  visible. */
function DisplaySettings() {
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef(null)

    const dispatch = useDispatch()

    const categoryList = useSelector(state => state.categoryList)
    const { categories } = categoryList

    const mapState = useSelector(state => state.map)
    const { hiddenCategories } = mapState

    // Close on outside click and on Escape, like a native menu.
    useEffect(() => {
        if (!open) return undefined

        const onPointerDown = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    const visibleCount = categories.length - hiddenCategories.length
    const allVisible = categories.length > 0 && hiddenCategories.length === 0

    const toggleAll = () => {
        dispatch(setAllCategories(categories.map(c => c.category_name), !allVisible))
    }

    return (
        <div className='spp-dropdown' ref={wrapperRef}>
            <button
                type='button'
                className={`spp-dropdown-toggle ${open ? 'is-open' : ''}`}
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                aria-haspopup='true'
            >
                <i className='fas fa-sliders-h mr-2' aria-hidden='true'></i>
                Display Settings
                <i className={`fas fa-chevron-down spp-caret ${open ? 'is-open' : ''}`} aria-hidden='true'></i>
            </button>

            {open && (
                <div className='spp-dropdown-panel' role='menu'>
                    <div className='spp-dropdown-header'>
                        <span>Power Plant Types</span>
                        <button type='button' className='spp-linkbtn' onClick={toggleAll}>
                            {allVisible ? 'Hide all' : 'Show all'}
                        </button>
                    </div>

                    {categories.length === 0 ? (
                        <p className='spp-dropdown-empty'>No power plant types yet.</p>
                    ) : (
                        <ul className='spp-checklist'>
                            {categories.map(cat => {
                                const checked = !hiddenCategories.includes(cat.category_name)
                                return (
                                    <li key={cat._id}>
                                        <label className='spp-check'>
                                            <input
                                                type='checkbox'
                                                checked={checked}
                                                onChange={() => dispatch(toggleCategory(cat.category_name))}
                                            />
                                            <span className='spp-check-box' aria-hidden='true'>
                                                <i className='fas fa-check'></i>
                                            </span>
                                            {cat.icon && (
                                                <img
                                                    className='spp-check-icon'
                                                    src={cat.icon}
                                                    alt=''
                                                    width='22'
                                                    height='22'
                                                />
                                            )}
                                            <span className='spp-check-label'>{cat.category_name}</span>
                                            <span className='spp-check-count'>{cat.placeCount}</span>
                                        </label>
                                    </li>
                                )
                            })}
                        </ul>
                    )}

                    <div className='spp-dropdown-footer'>
                        {visibleCount} of {categories.length} types shown
                    </div>
                </div>
            )}
        </div>
    )
}

export default DisplaySettings

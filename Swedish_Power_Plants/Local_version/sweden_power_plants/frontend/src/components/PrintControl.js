import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

// leaflet.browser.print is a classic Leaflet plugin: it assigns onto a bare
// global `L` rather than exporting anything, so the global has to exist before
// the module body runs. Its package.json has an empty "main", so the dist
// bundle has to be requested by path.
window.L = L
require('leaflet.browser.print/dist/leaflet.browser.print.min.js')

const PRINT_STYLE_ID = 'spp-print-overrides'

/* The plugin injects its own <style> when the control is added, and that sheet
 * ends with `@page :first { page-break-after: always; }` plus its own @page
 * size. Later rules win for @page, so ours has to be appended *after* the
 * control is on the map - putting these rules in index.css would lose.
 *
 * Between them these close both ways the map could spill onto a second sheet:
 * the forced break after page one, and a horizontal overflow when the user
 * prints at 100% scale instead of fit-to-width. */
const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 8mm; }
  /* Undo the plugin's forced break - it is what produces a blank second page. */
  @page :first { page-break-after: auto; }

  html, body {
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #fff !important;
  }

  /* Only the map belongs on paper. */
  .spp-topbar,
  .spp-panelcol,
  .spp-map-overlay,
  .leaflet-control-zoom,
  .leaflet-control-layers,
  .leaflet-control-browser-print,
  .leaflet-control-geocoder { display: none !important; }

  /* OpenStreetMap and Esri require attribution, so that one stays. */
  .leaflet-control-attribution { display: block !important; }

  .leaflet-print-overlay {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    max-width: 100% !important;
    page-break-before: avoid !important;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .leaflet-print-overlay * {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
`

/** Print button, matching the one the Ethiopian Infrastructure Map had.
 *
 *  A single print mode is deliberate: with more than one the plugin renders a
 *  hover-out menu and the button changes width, which would break the equal
 *  sizing of the three top-right controls.
 */
function PrintControl({ position = 'topright' }) {
    const map = useMap()

    useEffect(() => {
        if (!L.control || typeof L.control.browserPrint !== 'function') return undefined

        // An explicit Mode object rather than the string 'Auto'. 'Auto' sizes the
        // printed map to the browser window's aspect ratio, so a tall window
        // yields a tall image that does not fit one landscape sheet. Landscape
        // A4 makes the plugin lay the map out - and fetch tiles - at page shape.
        const mode = (L.BrowserPrint && L.BrowserPrint.Mode)
            ? L.BrowserPrint.Mode.Landscape('A4', { title: 'Print map' })
            : 'Landscape'

        const control = L.control.browserPrint({
            position,
            title: 'Print map',
            printModes: [mode],
        }).addTo(map)

        let style = document.getElementById(PRINT_STYLE_ID)
        if (!style) {
            style = document.createElement('style')
            style.id = PRINT_STYLE_ID
            style.textContent = PRINT_CSS
            document.head.appendChild(style)
        }

        // Note on ordering: the plugin builds its own print sheet inside the
        // print call and removes it afterwards, so its @page block always lands
        // after ours and wins - its 12.71mm margin and A4 landscape size are the
        // ones that apply. That is fine; ours sets the same orientation, and the
        // rules that actually matter here (hiding the page chrome, capping the
        // overlay width, forbidding page breaks) are ordinary declarations with
        // !important and apply regardless of which sheet comes last.

        return () => {
            control.remove()
            const existing = document.getElementById(PRINT_STYLE_ID)
            if (existing) existing.remove()
        }
    }, [map, position])

    return null
}

export default PrintControl

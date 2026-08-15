import React from 'react'

/** Brand mark for the top bar: a lightning bolt over a cooling-tower / pylon
 *  silhouette, in a dark rounded badge - the same visual weight as komoot's
 *  circular logo sitting at the left of its bar. Inline SVG so it stays crisp
 *  at any size and needs no extra network request. */
function BrandLogo({ size = 34 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            role="img"
            aria-label="Swedish Powerplants Map logo"
            focusable="false"
        >
            <defs>
                <linearGradient id="sppBoltGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffd747" />
                    <stop offset="100%" stopColor="#ff9d2e" />
                </linearGradient>
            </defs>

            <rect x="0" y="0" width="48" height="48" rx="14" fill="#12321f" />

            {/* cooling towers */}
            <path
                d="M11 36c0-4 1.6-6.4 1.6-9.2 0-1.5-.5-2.4-.5-3.4h7.8c0 1-.5 1.9-.5 3.4 0 2.8 1.6 5.2 1.6 9.2z"
                fill="#2f7d52"
            />
            <path
                d="M27.5 36c0-3.2 1.3-5.2 1.3-7.4 0-1.2-.4-1.9-.4-2.7h6.2c0 .8-.4 1.5-.4 2.7 0 2.2 1.3 4.2 1.3 7.4z"
                fill="#245f3f"
            />

            {/* ground line */}
            <rect x="8" y="36" width="32" height="2.6" rx="1.3" fill="#3fb950" />

            {/* lightning bolt */}
            <path
                d="M26.4 8.5 15.6 25.2h6.9L19.9 39l12.4-18.6h-7.6z"
                fill="url(#sppBoltGradient)"
            />
        </svg>
    )
}

export default BrandLogo

/** Layered, hand-drawn geometric skyline with a warm backlit edge. */
export function DubaiSkyline() {
  const foreground = [
    { x: 12, y: 432, w: 92, h: 218 }, { x: 112, y: 374, w: 102, h: 276 },
    { x: 222, y: 458, w: 75, h: 192 }, { x: 306, y: 318, w: 118, h: 332 },
    { x: 432, y: 393, w: 86, h: 257 }, { x: 526, y: 246, w: 126, h: 404 },
    { x: 661, y: 367, w: 91, h: 283 }, { x: 760, y: 294, w: 110, h: 356 },
    { x: 879, y: 410, w: 83, h: 240 }, { x: 971, y: 343, w: 105, h: 307 },
    { x: 1084, y: 450, w: 104, h: 200 },
  ];
  const distant = [
    { x: 0, y: 390, w: 70, h: 260 }, { x: 82, y: 342, w: 74, h: 308 },
    { x: 177, y: 405, w: 66, h: 245 }, { x: 260, y: 345, w: 80, h: 305 },
    { x: 359, y: 385, w: 74, h: 265 }, { x: 454, y: 304, w: 83, h: 346 },
    { x: 642, y: 328, w: 78, h: 322 }, { x: 734, y: 356, w: 84, h: 294 },
    { x: 850, y: 329, w: 82, h: 321 }, { x: 955, y: 394, w: 76, h: 256 },
    { x: 1044, y: 316, w: 86, h: 334 }, { x: 1145, y: 375, w: 70, h: 275 },
  ];

  return (
    <svg className="elc-dubai-sketch" viewBox="0 0 1200 680" preserveAspectRatio="none" role="img" aria-label="Layered geometric sketch of a Dubai skyline at dusk">
      <defs>
        <radialGradient id="elcCityHalo" cx="58%" cy="58%" r="53%">
          <stop offset="0" stopColor="#e9bd96" stopOpacity=".32" />
          <stop offset=".46" stopColor="#c88967" stopOpacity=".13" />
          <stop offset="1" stopColor="#8b5948" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="elcGlass" x1="0" y1="0" x2="1" y2=".12">
          <stop offset="0" stopColor="#242522" stopOpacity=".96" />
          <stop offset=".5" stopColor="#393832" stopOpacity=".86" />
          <stop offset="1" stopColor="#191b1a" stopOpacity=".98" />
        </linearGradient>
        <linearGradient id="elcDistantGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#55483b" stopOpacity=".58" />
          <stop offset="1" stopColor="#191a19" stopOpacity=".9" />
        </linearGradient>
        <linearGradient id="elcEdgeLight" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#f2c9a3" stopOpacity=".72" />
          <stop offset="1" stopColor="#c18767" stopOpacity=".08" />
        </linearGradient>
        <filter id="elcGroundShadow" x="-20%" y="-100%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <ellipse cx="700" cy="365" rx="470" ry="320" fill="url(#elcCityHalo)" />
      <g className="elc-light-rays" fill="none" stroke="#e9b890" strokeWidth="1">
        <path d="M690 335 160 651M690 335 360 651M690 335 560 651M690 335 810 651M690 335 1015 651" />
      </g>

      {/* Soft distant massing adds depth without competing with the hero. */}
      <g fill="url(#elcDistantGlass)" stroke="#c59a78" strokeOpacity=".28" strokeWidth="1">
        {distant.map(({ x, y, w, h }) => <rect key={x} x={x} y={y} width={w} height={h} />)}
      </g>

      <path d="M40 647c258 16 676 17 1100-2l60 28c-360 22-805 22-1184-2z" fill="#050606" fillOpacity=".55" filter="url(#elcGroundShadow)" />

      {/* Simple varied-height blocks retain the original skyline's graphic character. */}
      <g>
        {foreground.map(({ x, y, w, h }) => (
          <g key={x}>
            <rect x={x} y={y} width={w} height={h} fill="url(#elcGlass)" stroke="#ad896b" strokeOpacity=".58" strokeWidth="1.1" />
            <path d={`M${x + 4} ${y + 2}V648`} fill="none" stroke="url(#elcEdgeLight)" strokeOpacity=".78" strokeWidth="1.25" />
            {Array.from({ length: Math.floor((h - 20) / 22) }, (_, index) => {
              const lineY = y + 14 + index * 22;
              return <path key={lineY} d={`M${x + 9} ${lineY}h${w - 18}`} fill="none" stroke="#d4ad89" strokeOpacity=".16" strokeWidth=".8" />;
            })}
          </g>
        ))}
      </g>

      {/* Long, understated shadows ground the block forms in the scene. */}
      <path d="M18 651h1164" stroke="#d0a27f" strokeOpacity=".32" strokeWidth=".9" />
    </svg>
  );
}

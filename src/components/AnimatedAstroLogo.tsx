import React from 'react';

const AnimatedAstroLogo: React.FC = () => (
  <div style={{ width: 200, height: 200, background: '#181c24', borderRadius: '50%', display: 'inline-block', position: 'relative' }}>
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      {/* Cercle central (soleil) */}
      <circle cx="100" cy="100" r="28" fill="#fffbe6" stroke="#fffbe6" strokeWidth="2" />
      {/* Rayons */}
      {[...Array(8)].map((_, i) => (
        <rect
          key={i}
          x={98}
          y={60}
          width={4}
          height={18}
          rx={2}
          fill="#fffbe6"
          transform={`rotate(${i * 45} 100 100)`}
          opacity={0.8}
        />
      ))}
      {/* Orbite principale */}
      <circle cx="100" cy="100" r="70" stroke="#fffbe6" strokeWidth="1.5" opacity={0.18} fill="none" />
      {/* Orbite secondaire */}
      <circle cx="100" cy="100" r="90" stroke="#fffbe6" strokeWidth="1" opacity={0.10} fill="none" />
      {/* Étoiles et lunes sur orbite principale */}
      <g className="orbit orbit1">
        {/* Étoile */}
        <g transform="translate(100,30)">
          <polygon points="0,-10 2.94,-3.09 9.51,-3.09 4.29,1.18 6.18,7.64 0,4  -6.18,7.64 -4.29,1.18 -9.51,-3.09 -2.94,-3.09" fill="#fffbe6" opacity={0.95}/>
        </g>
      </g>
      <g className="orbit orbit2">
        {/* Lune */}
        <g transform="translate(170,100)">
          <path d="M 0 0 A 10 10 0 1 1 -10 -10 Q -4 -6 0 0" fill="#fffbe6" opacity={0.85}/>
        </g>
      </g>
      <g className="orbit orbit3">
        {/* Étoile */}
        <g transform="translate(100,170)">
          <polygon points="0,-10 2.94,-3.09 9.51,-3.09 4.29,1.18 6.18,7.64 0,4  -6.18,7.64 -4.29,1.18 -9.51,-3.09 -2.94,-3.09" fill="#fffbe6" opacity={0.95}/>
        </g>
      </g>
      <g className="orbit orbit4">
        {/* Lune */}
        <g transform="translate(30,100)">
          <path d="M 0 0 A 10 10 0 1 1 10 10 Q 4 6 0 0" fill="#fffbe6" opacity={0.85}/>
        </g>
      </g>
      {/* Orbite secondaire : étoiles et lunes */}
      <g className="orbit orbit5">
        {/* Étoile */}
        <g transform="translate(100,10)">
          <polygon points="0,-8 2.35,-2.47 7.6,-2.47 3.43,0.94 4.94,6.11 0,3.2  -4.94,6.11 -3.43,0.94 -7.6,-2.47 -2.35,-2.47" fill="#fffbe6" opacity={0.7}/>
        </g>
      </g>
      <g className="orbit orbit6">
        {/* Lune */}
        <g transform="translate(190,100)">
          <path d="M 0 0 A 7 7 0 1 1 -7 -7 Q -3 -4 0 0" fill="#fffbe6" opacity={0.6}/>
        </g>
      </g>
      <g className="orbit orbit7">
        {/* Lune */}
        <g transform="translate(10,100)">
          <path d="M 0 0 A 7 7 0 1 1 7 7 Q 3 4 0 0" fill="#fffbe6" opacity={0.6}/>
        </g>
      </g>
    </svg>
    <style>{`
      .orbit1 { transform-origin: 100px 100px; animation: rotate1 12s linear infinite; }
      .orbit2 { transform-origin: 100px 100px; animation: rotate2 18s linear infinite; }
      .orbit3 { transform-origin: 100px 100px; animation: rotate3 15s linear infinite; }
      .orbit4 { transform-origin: 100px 100px; animation: rotate4 21s linear infinite; }
      .orbit5 { transform-origin: 100px 100px; animation: rotate5 26s linear infinite; }
      .orbit6 { transform-origin: 100px 100px; animation: rotate6 19s linear infinite; }
      .orbit7 { transform-origin: 100px 100px; animation: rotate7 23s linear infinite; }
      @keyframes rotate1 { to { transform: rotate(360deg); } }
      @keyframes rotate2 { to { transform: rotate(360deg); } }
      @keyframes rotate3 { to { transform: rotate(360deg); } }
      @keyframes rotate4 { to { transform: rotate(360deg); } }
      @keyframes rotate5 { to { transform: rotate(360deg); } }
      @keyframes rotate6 { to { transform: rotate(360deg); } }
      @keyframes rotate7 { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

export default AnimatedAstroLogo; 
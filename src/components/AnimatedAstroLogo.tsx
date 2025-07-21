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
      {/* Groupe d'étoiles en orbite, animé */}
      <g className="stars-orbit">
        {/* 3 étoiles espacées à 120° */}
        <g transform="rotate(0 100 100)">
          <g transform="translate(100,30)">
            <polygon points="0,-10 2.94,-3.09 9.51,-3.09 4.29,1.18 6.18,7.64 0,4  -6.18,7.64 -4.29,1.18 -9.51,-3.09 -2.94,-3.09" fill="#fffbe6" opacity={0.95}/>
          </g>
        </g>
        <g transform="rotate(120 100 100)">
          <g transform="translate(100,30)">
            <polygon points="0,-10 2.94,-3.09 9.51,-3.09 4.29,1.18 6.18,7.64 0,4  -6.18,7.64 -4.29,1.18 -9.51,-3.09 -2.94,-3.09" fill="#fffbe6" opacity={0.95}/>
          </g>
        </g>
        <g transform="rotate(240 100 100)">
          <g transform="translate(100,30)">
            <polygon points="0,-10 2.94,-3.09 9.51,-3.09 4.29,1.18 6.18,7.64 0,4  -6.18,7.64 -4.29,1.18 -9.51,-3.09 -2.94,-3.09" fill="#fffbe6" opacity={0.95}/>
          </g>
        </g>
      </g>
    </svg>
    <style>{`
      .stars-orbit { transform-origin: 100px 100px; animation: stars-rotate 32s linear infinite; }
      @keyframes stars-rotate { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

export default AnimatedAstroLogo; 
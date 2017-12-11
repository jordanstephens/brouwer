import React from 'react';

import './AnimationCanvas.css';

import { EARTH_RADIUS } from './constants';

const AnimationCanvas = ({
  windowSize,
  positionX,
  positionY,
  semimajorAxis,
  eccentricity,
  inclination,
  rightAsc,
  argOfPerigee,
  error
}) => {
  const semiminorAxis = Math.sqrt(Math.pow(semimajorAxis, 2) * (1 - Math.pow(eccentricity, 2)));
  const distanceToFoci = semimajorAxis * eccentricity;
  const scale = 0.01;

  return (
    <div className='svgContainer'>
      {error ? (
        <div className='error'>
          {error}
        </div>
      ) : (
        <svg viewBox={[scale * windowSize / 2 * -1, scale * windowSize / 2 * -1, scale * windowSize, scale * windowSize].join(' ')}>
          <circle
            cx={0}
            cy={0}
            r={scale * EARTH_RADIUS}
            fill='lightgrey'
          />
          <g>
            <circle
              cx='0'
              cy='0'
              r={scale * windowSize / 100}
              fill={'none'}
              stroke='green'
              strokeWidth={scale * 50}
              style={{
                willChange: 'transform',
                transform: [
                  `translate3d(${scale * positionX}px, ${scale * positionY}px, 0px)`,
                ],
              }}
            />
          </g>
          <ellipse
            cx={-1 * scale * distanceToFoci}
            cy='0'
            rx={scale * semimajorAxis}
            ry={scale * semiminorAxis}
            fill='none'
            stroke='blue'
            strokeWidth={scale * 20}
            style={{
              transform: [
                `rotate3d(0,0,1,${rightAsc}deg)`,
                `rotate3d(1,0,0,${inclination}deg)`,
                `rotate3d(0,0,1,${argOfPerigee}deg)`,
              ].join(' '),
            }}
          />
        </svg>
      )}
    </div>
  );
};

export default AnimationCanvas;

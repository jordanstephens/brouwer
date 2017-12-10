import React from 'react';

import './AnimationCanvas.css';

import { EARTH_RADIUS } from './constants';

const AnimationCanvas = ({
  windowSize,
  positionX,
  positionY,
  positionZ,
  velocityX,
  velocityY,
  velocityZ,
  semimajorAxis,
  eccentricity,
  inclination,
  rightAsc,
  argOfPerigee,
  error
}) => {
  // const vectorScale = windowSize / 100;
  const semiminorAxis = Math.sqrt(Math.pow(semimajorAxis, 2) * (1 - Math.pow(eccentricity, 2)));
  const distanceToFoci = semimajorAxis * eccentricity;

  return (
    <div className='svgContainer'>
      {error ? (
        <div className='error'>
          {error}
        </div>
      ) : (
        <svg viewBox={[windowSize / 2 * -1, windowSize / 2 * -1, windowSize, windowSize].join(' ')}>
          <circle
            cx={0}
            cy={0}
            r={EARTH_RADIUS}
            fill='lightgrey'
          />
          <g>
            <circle
              // cx={positionX}
              // cy={positionY}
              cx='0'
              cy='0'
              r='200'
              fill={'none'}
              stroke='green'
              strokeWidth={'50'}
              style={{
                willChange: 'transform',
                transform: [
                  `translate3d(${positionX}px, ${positionY}px, 0px)`,
                ],
              }}
            />
          </g>
          <ellipse
            cx={-1 * distanceToFoci}
            cy='0'
            rx={semimajorAxis}
            ry={semiminorAxis}
            fill='none'
            stroke='blue'
            strokeWidth='20'
            style={{
              transform: [
                `rotate3d(0,0,1,${rightAsc}deg)`,
                `rotate3d(1,0,0,${inclination}deg)`,
                `rotate3d(0,0,1,${argOfPerigee}deg)`,
              ].join(' '),
            }}
          />
          {/* <line x1={positionX} y1={positionY} x2={positionX + velocityX * vectorScale} y2={positionY} strokeWidth='10' stroke='blue' />
          <line x1={positionX} y1={positionY} x2={positionX} y2={positionY + velocityY * vectorScale} strokeWidth='10' stroke='blue' /> */}
        </svg>
      )}
    </div>
  );
};

export default AnimationCanvas;

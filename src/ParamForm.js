import React from 'react';

import './ParamForm.css';

import { EARTH_RADIUS } from './constants';

const ParamForm = ({
  windowSize,
  rate,
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
  error,
  onParamChange,
  onControlChange
}) => {

  return (
    <div className='controls'>
      <div className='row'>
        <div className='cell'>
          <div>
            <input
              type='number'
              value={semimajorAxis}
              onChange={(e) => onParamChange(e, 'semimajorAxis', e.target.value)}
              min={Math.ceil(EARTH_RADIUS / 10) * 10}
              step={100}
            />
            {' '}
            km
          </div>
          <label title='Semi-major Axis'>α</label>
        </div>
        <div className='cell'>
          <div>
            <input
              type='number'
              value={eccentricity}
              onChange={(e) => onParamChange(e, 'eccentricity', e.target.value)}
              step={0.001}
              min={0}
              max={1}
            />
          </div>
          <label title='Eccentricity'>e</label>
        </div>
        <div className='cell'>
          <div>
            <input
              type='number'
              value={inclination}
              onChange={(e) => onParamChange(e, 'inclination', e.target.value)}
              step={1}
              min={0}
              max={360}
            />
            {' '}
            °
          </div>
          <label title='Inclination'>i</label>
        </div>
        <div className='cell'>
          <div>
            <input
              type='number'
              value={rightAsc}
              onChange={(e) => onParamChange(e, 'rightAsc', e.target.value)}
              step={1}
              min={0}
              max={360}
            />
            {' '}
            °
          </div>
          <label title='Right Ascenscion'>Ω</label>
        </div>
        <div className='cell'>
          <div>
            <input
              type='number'
              value={argOfPerigee}
              onChange={(e) => onParamChange(e, 'argOfPerigee', e.target.value)}
              step={1}
              min={0}
              max={360}
            />
            {' '}
            °
          </div>
          <label title='Argument of Periapsis'>ω</label>
        </div>
      </div>
    </div>
  );
};

export default ParamForm;

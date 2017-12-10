import React from 'react';

import './Details.css';

import { EARTH_RADIUS } from './constants';

function magnitude(vec) {
  return Math.sqrt(['x', 'y', 'z'].reduce((acc, k) => (acc + Math.pow(vec[k], 2)), 0));
}

const Details = ({
  windowSize,
  position,
  velocity,
  semimajorAxis,
  eccentricity,
  inclination,
  rightAsc,
  argOfPerigee,
  error
}) => {
  const altitude = magnitude(position) - EARTH_RADIUS;
  const speed = magnitude(velocity);

  return (
    <div className='details'>
      <div className='row'>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>x̂</th>
              <th>ŷ</th>
              <th>ẑ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>r̄ <small>km</small></th>
              <td>{position.x.toFixed(3)}</td>
              <td>{position.y.toFixed(3)}</td>
              <td>{position.z.toFixed(3)}</td>
            </tr>
            <tr>
              <th>v̄ <small>km/s</small></th>
              <td>{velocity.x.toFixed(3)}</td>
              <td>{velocity.y.toFixed(3)}</td>
              <td>{velocity.z.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>|r|</th>
              <td>{altitude.toFixed(3)}</td>
            </tr>
            <tr>
              <th>|v|</th>
              <td>{speed.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Details;

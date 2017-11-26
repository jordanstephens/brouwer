import React, { Component } from 'react';
import ReactAnimationFrame from 'react-animation-frame';
import moment from 'moment';
import satellite from 'satellite.js';

import './TCanvas.css';

// universal gravitational constant
const G = 6.674e-11;
const EARTH_MASS = 5.972e+24;
const MU = G * EARTH_MASS;
const EARTH_RADIUS = 6371;

function params2tle(semimajorAxis, inclination, rightAsc, eccentricity, argOfPerigee, meanAnomaly = 0) {
  inclination = inclination.toFixed(4).padStart(8);
  rightAsc = rightAsc.toFixed(4).padStart(8);
  eccentricity = (eccentricity.toFixed(7) * 10e6).toString().padStart(7, '0');
  argOfPerigee = argOfPerigee.toFixed(4).padStart(8);
  meanAnomaly = meanAnomaly.toFixed(4).padStart(8);
  const _meanMotion = Math.sqrt(MU / Math.pow(2 * semimajorAxis, 3)).toString().slice(0,11);
  const satNo = '25544';
  const satClass = 'U';
  const satYear = '98';
  const satMonth = '06';
  return `
    1 ${satNo}${satClass} ${satYear}${satMonth}7A   17330.48573378  .00003462  00000-0  59297-4 0  9990
    2 ${satNo} ${inclination} ${rightAsc} ${eccentricity} ${argOfPerigee} ${meanAnomaly} ${_meanMotion} 86996
  `.split('\n').filter((x) => (x && x.length)).map(s=>s.trim()).join('\n');
}

const d0 = moment();
let t0 = 0;

const tle = params2tle(7000, 0, 0, 0, 0).split('\n');

// Initialize a satellite record
let satrec = satellite.twoline2satrec(tle[0], tle[1]);

class TCanvas extends Component {
  constructor(props) {
    super(props);
    this.state = {
      windowSize: 20000.0,
      rate: 1000.0,
      dt: 0,
      date: new Date(),
      rv: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 }
      },
    };
  }

  onAnimationFrame(t) {
    // convert t to seconds
    t = t / 1000.0;
    const dt = t - t0;
    t0 = t;
    const date = d0.add(dt * this.state.rate, 's').toDate();
    const rv = satellite.propagate(satrec, date);
    this.setState({ dt, date, rv });
  }

  render() {
    const { rv, date } = this.state;
    const { position, velocity } = rv;
    const vectorScale = this.state.windowSize / 100;

    return (
      <div className='TCanvas'>
        <svg viewBox={[this.state.windowSize / 2 * -1, this.state.windowSize / 2 * -1, this.state.windowSize, this.state.windowSize].join(' ')}>
          <line x1={this.state.windowSize / 2 * -1} y1='0' x2={this.state.windowSize / 2} y2='0'
            strokeWidth='10' stroke='black' strokeDasharray='500, 200' />
          <line x1='0' y1={this.state.windowSize / 2 * -1} x2='0' y2={this.state.windowSize / 2}
            strokeWidth='10' stroke='black' strokeDasharray='500, 200' />
          <circle
            cx={0}
            cy={0}
            r={EARTH_RADIUS}
            fill='lightgrey'
          />
          <circle
            cx={position.x}
            cy={position.y}
            r={100}
            fill='green'
          />
          <line x1={position.x} y1={position.y} x2={position.x + velocity.x * vectorScale} y2={position.y} strokeWidth='10' stroke='blue' />
          <line x1={position.x} y1={position.y} x2={position.x} y2={position.y + velocity.y * vectorScale} strokeWidth='10' stroke='blue' />
        </svg>
        <div className='details'>
          <div className='row'>
            <div>
              <strong>Window</strong>
              {' '}
              <input
                type='number'
                value={this.state.windowSize}
                onChange={(e) => this.setState({ windowSize: e.target.value })}
                step={1000}
              />
            </div>
          </div>
          <div className='row'>
            <div>
              <strong>Rate</strong>
              {' '}
              <input
                type='number'
                value={this.state.rate}
                onChange={(e) => this.setState({ rate: e.target.value })}
              />
              {' '}
              ×
            </div>
            <div>
              {date.toISOString()}
            </div>
          </div>
          <div className='row'>
            <div>
              <strong>r̂</strong>
              {' '}
              [{['x', 'y', 'z'].map((k) => {
                return position[k].toFixed(3);
              }).join(', ')}]
            </div>
          </div>
          <div className='row'>
            <div>
              <strong>v̂</strong>
              {' '}
              [{['x', 'y', 'z'].map((k) => {
                return position[k].toFixed(3);
              }).join(', ')}]
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ReactAnimationFrame(TCanvas);

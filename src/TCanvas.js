import React, { Component } from 'react';
import ReactAnimationFrame from 'react-animation-frame';
import moment from 'moment';
import satellite from 'satellite.js';

import './TCanvas.css';

// // ISS (ZARYA)
// const tle = `
// 1 25544U 98067A   17328.49210150  .00003614  00000-0  61627-4 0  9993
// 2 25544  51.6410 319.1776 0004401 149.7639 352.1227 15.54219617 86682
// `.split('\n').filter((x) => (x && x.length));

// TIANGONG 1
// const tle = `
// 1 37820U 11053A   17328.39767988  .00068071  99780-5  19636-3 0  9996
// 2 37820  42.7547 290.8811 0018225 150.6126 347.4134 15.92513370353383
// `.split('\n').filter((x) => (x && x.length));

// MOLNIYA 2-9
const tle = `
1  7276U 74026A   17328.52702773 +.00000163 +00000-0 -11430-2 0  9997
2  7276 062.8430 143.3992 6829659 288.3320 012.4975 02.45095615208521
`.split('\n').filter((x) => (x && x.length));

const d0 = moment();
let t0 = 0;

// Initialize a satellite record
let satrec = satellite.twoline2satrec(tle[0], tle[1]);
const EARTH_RADIUS = 6371;

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

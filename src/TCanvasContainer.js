import React, { Component } from 'react';
import ReactAnimationFrame from 'react-animation-frame';
import moment from 'moment';
import satellite from 'satellite.js';

import './TCanvasContainer.css';

// universal gravitational constant
const G = 6.674e-11;
const EARTH_MASS = 5.972e+24;
const MU = G * EARTH_MASS;
const EARTH_RADIUS = 6371;

const PARAM_NAMES = [
  'semimajorAxis',
  'inclination',
  'eccentricity',
  'rightAsc',
  'argOfPerigee'
];

function params2tle({ semimajorAxis, inclination = 0, rightAsc = 0, eccentricity = 0, argOfPerigee = 0, meanAnomaly = 0 }) {
  inclination = Number(inclination).toFixed(4).padStart(8);
  rightAsc = Number(rightAsc).toFixed(4).padStart(8);
  eccentricity = eccentricity.toString().replace(/^0\./, '').padEnd(7, '0').slice(0, 7)
  argOfPerigee = Number(argOfPerigee).toFixed(4).padStart(8);
  meanAnomaly = Number(meanAnomaly).toFixed(4).padStart(8);
  const meanMotion = Math.sqrt(MU / Math.pow(2 * semimajorAxis, 3)).toString().slice(0,11);
  const satNo = '00001';
  const satClass = 'U';
  const satYear = '98';
  const satMonth = '06';
  return `
    1 ${satNo}${satClass} ${satYear}${satMonth}1A   17330.48573378  .00003462  00000-0  59297-4 0  9990
    2 ${satNo} ${inclination} ${rightAsc} ${eccentricity} ${argOfPerigee} ${meanAnomaly} ${meanMotion} 86996
  `.split('\n').filter((x) => (x && x.length)).map(s=>s.trim()).join('\n');
}

function magnitude(vec) {
  return Math.sqrt(['x', 'y', 'z'].reduce((acc, k) => (acc + Math.pow(vec[k], 2)), 0));
}

function newSatRec(params = {}) {
  const tle = params2tle(params).split('\n');
  return satellite.twoline2satrec(tle[0], tle[1]);
}

const ERRORS = {
  '1': 'mean elements, ecc >= 1.0 or ecc < -0.001 or a < 0.95 er',
  '2': 'mean motion less than 0.0',
  '3': 'pert elements, ecc < 0.0 or ecc > 1.0',
  '4': 'semi-latus rectum < 0.0',
  '5': 'epoch elements are sub-orbital',
  '6': 'satellite has decayed',
};

function errorMessage(code) {
  return ERRORS[code.toString()];
}

const TCanvas = ({ windowSize, position, velocity }) => {
  const vectorScale = windowSize / 100;

  return (
    <svg viewBox={[windowSize / 2 * -1, windowSize / 2 * -1, windowSize, windowSize].join(' ')}>
      <line x1={windowSize / 2 * -1} y1='0' x2={windowSize / 2} y2='0'
        strokeWidth='10' stroke='black' strokeDasharray='500, 200' />
      <line x1='0' y1={windowSize / 2 * -1} x2='0' y2={windowSize / 2}
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
        r={200}
        fill={'none'}
        stroke='green'
        strokeWidth={'50'}
      />
      <line x1={position.x} y1={position.y} x2={position.x + velocity.x * vectorScale} y2={position.y} strokeWidth='10' stroke='blue' />
      <line x1={position.x} y1={position.y} x2={position.x} y2={position.y + velocity.y * vectorScale} strokeWidth='10' stroke='blue' />
    </svg>
  );
};

const TCanvasDetails = ({ position, velocity }) => {
  const altitude = magnitude(position) - EARTH_RADIUS;
  const speed = magnitude(velocity);

  return (
    <div className='details'>
      <div className='row'>
        <div>
          <strong>r̂</strong>
          {' '}
          [{['x', 'y', 'z'].map((k) => {
            return position[k].toFixed(3);
          }).join(', ')}]
        </div>
        <div>
          <strong>altitude</strong>
          {' '}
          {altitude.toFixed(3)}
        </div>
      </div>
      <div className='row'>
        <div>
          <strong>v̂</strong>
          {' '}
          [{['x', 'y', 'z'].map((k) => {
            return velocity[k].toFixed(3);
          }).join(', ')}]
        </div>
        <div>
          <strong>speed</strong>
          {' '}
          {speed.toFixed(3)}
        </div>
      </div>
    </div>
  );
}

class TCanvasContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      windowSize: 20000.0,
      rate: 1000.0,

      semimajorAxis: 6500,
      inclination: 0.0,
      eccentricity: 0.0,
      rightAsc: 0.0,
      argOfPerigee: 0.0,

      satrec: null,
      error: 0,

      t0: 0,

      dt: 0,
      d0: moment(),

      date: new Date(),
      rv: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 }
      },
    };
  }

  componentWillMount() {
    const satrec = newSatRec(this.stateParams());
    this.setState({ satrec });
  }

  onAnimationFrame(t) {
    // convert t to seconds
    t = t / 1000.0;
    const dt = t - this.state.t0;
    const t0 = t;
    const date = this.state.d0.add(dt * this.state.rate, 's').toDate();
    const rv = satellite.propagate(this.state.satrec, date);
    const error = this.state.satrec.error;
    if (error !== 0) console.log(this.state.satrec.error);
    this.setState({ t0, dt, date, rv, error });
  }

  stateParams = () => {
    return PARAM_NAMES.reduce((acc, k) => {
      acc[k] = this.state[k];
      return acc;
    }, {});
  }

  updateOrbitalParam = (k, v) => {
    const params = this.stateParams();
    params[k] = v;
    const satrec = newSatRec(params);
    this.setState({ satrec, [k]: v });
  }

  render() {
    const { rv, date } = this.state;
    const { position, velocity } = rv;
    const error = this.state.error !== 0 && errorMessage(this.state.error);

    return (
      <div className='TCanvasContainer'>
        {this.state.error === 0 ? (
          <div>
            <TCanvas
              windowSize={this.state.windowSize}
              position={position}
              velocity={velocity}
            />
            <TCanvasDetails
              position={position}
              velocity={velocity}
            />
          </div>
        ) : (
          <div className='error'>
            {errorMessage(this.state.error)}
          </div>
        )}
        <div className='controls'>
          <div className='row'>
            <div className='cell'>
              <div>
                <input
                  type='number'
                  value={this.state.semimajorAxis}
                  onChange={(e) => this.updateOrbitalParam('semimajorAxis', e.target.value)}
                  min={Math.ceil(EARTH_RADIUS / 10) * 10}
                  step={10}
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
                  value={this.state.eccentricity}
                  onChange={(e) => this.updateOrbitalParam('eccentricity', e.target.value)}
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
                  value={this.state.inclination}
                  onChange={(e) => this.updateOrbitalParam('inclination', e.target.value)}
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
                  value={this.state.rightAsc}
                  onChange={(e) => this.updateOrbitalParam('rightAsc', e.target.value)}
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
                  value={this.state.argOfPerigee}
                  onChange={(e) => this.updateOrbitalParam('argOfPerigee', e.target.value)}
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
        <div className='details'>
          <div className='row'>
            <div>
              <strong>Rate</strong>
              {' '}
              <input
                type='number'
                value={this.state.rate}
                onChange={(e) => this.setState({ rate: e.target.value })}
                step={1}
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
        </div>
      </div>
    );
  }
}

export default ReactAnimationFrame(TCanvasContainer);

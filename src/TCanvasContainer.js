import React, { Component } from 'react';
import ReactAnimationFrame from 'react-animation-frame';
import moment from 'moment';
import SGP4 from 'sgp4';

import './TCanvasContainer.css';

// universal gravitational constant
const G = 6.674e-11;
const EARTH_MASS = 5.972e+24;
const MU = G * EARTH_MASS;
const EARTH_RADIUS = 6371;
const XP_DOT_P = 1440.0 / (2.0 * Math.PI); //229.1831180523293

const PARAM_NAMES = [
  'semimajorAxis',
  'inclination',
  'eccentricity',
  'rightAsc',
  'argOfPerigee'
];

function newSatRec(params) {
  var gravconst = SGP4.getgravconst("wgs84");

  var now = new Date();

  var opsmode = 'i';

  var deg2rad  =  Math.PI / 180.0; //0.0174532925199433
  var xpdotp   =  1440.0 / (2.0 * Math.PI); //229.1831180523293

  var satrec = {};

  satrec.error = 0;
  satrec.whichconst = gravconst;

  //Line 1
  satrec.satnum = "12345"
  satrec.epochyr = parseInt(now.getUTCFullYear().toString().substr(2, 2));
  satrec.epochdays = (now - (new Date(now.getUTCFullYear(), 0, 0))) / (1000 * 60 * 60 * 24);
  satrec.ndot = undefined; // ignoring for now
  satrec.nddot = undefined; // ignoring for now
  satrec.bstar = 0;

  //Line 2
  satrec.inclo = params.inclination || 0;
  satrec.nodeo = params.rightAscension || 0;
  satrec.ecco = params.eccentricity || 0;
  satrec.argpo = params.argumentOfPerigee || 0;
  satrec.mo = params.meanAnomaly || 0;
  satrec.no = Math.sqrt(satrec.whichconst.mu / Math.pow(params.semimajorAxis, 3)) / (2 * Math.PI / 86400) / xpdotp;

  satrec.inclo = satrec.inclo  * deg2rad;
  satrec.nodeo = satrec.nodeo  * deg2rad;
  satrec.argpo = satrec.argpo  * deg2rad;
  satrec.mo    = satrec.mo     * deg2rad;

  satrec.alta = satrec.a*(1.0 + satrec.ecco) - 1.0;
  satrec.altp = satrec.a*(1.0 - satrec.ecco) - 1.0;

  var year = 0;
  if (satrec.epochyr < 57) {
      year = satrec.epochyr + 2000;
  } else {
      year = satrec.epochyr + 1900;
  }

  var days2mdhmsResult = SGP4.days2mdhms(year, satrec.epochdays);
  var mon, day, hr, minute, sec;
  mon = days2mdhmsResult.mon;
  day = days2mdhmsResult.day;
  hr = days2mdhmsResult.hr;
  minute = days2mdhmsResult.minute;
  sec = days2mdhmsResult.sec;

  satrec.jdsatepoch = SGP4.jday(year, mon, day, hr, minute, sec);

  SGP4.sgp4init(gravconst, opsmode, satrec.satnum, satrec.jdsatepoch - 2433281.5, satrec.bstar, satrec.ecco, satrec.argpo, satrec.inclo, satrec.mo, satrec.no, satrec.nodeo, satrec);

  return satrec;
}

function magnitude(vec) {
  return Math.sqrt(['x', 'y', 'z'].reduce((acc, k) => (acc + Math.pow(vec[k], 2)), 0));
}

function invalidVector(vec) {
  return !(vec && Number(vec.x) === vec.x && Number(vec.y) === vec.y && Number(vec.z) === vec.z)
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
  return ERRORS[code.toString()] || 'Error';
}

const TCanvas = ({ windowSize, position, velocity, semimajorAxis, eccentricity, inclination, rightAsc, argOfPerigee, error }) => {
  const vectorScale = windowSize / 100;
  const semiminorAxis = Math.sqrt(Math.pow(semimajorAxis, 2) * (1 - Math.pow(eccentricity, 2)));

  return (
    <div className='svgContainer'>
      {error ? (
        <div className='error'>
          {error}
        </div>
      ) : (
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
          <ellipse
            cx='0'
            cy='0'
            rx={semimajorAxis}
            ry={semiminorAxis}
            fill='none'
            stroke='blue'
            strokeWidth='20'
            style={{
              transform: [
                `rotate3d(0,1,0,${inclination}deg)`,
                `rotate3d(1,0,0,${rightAsc}deg)`,
                `rotate3d(0,0,1,${argOfPerigee}deg)`,
              ].join(' '),
            }}
          />
          <line x1={position.x} y1={position.y} x2={position.x + velocity.x * vectorScale} y2={position.y} strokeWidth='10' stroke='blue' />
          <line x1={position.x} y1={position.y} x2={position.x} y2={position.y + velocity.y * vectorScale} strokeWidth='10' stroke='blue' />
        </svg>
      )}
    </div>
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
    var year = date.getUTCFullYear(),
        month = date.getUTCMonth(),
        day = date.getUTCDate(),
        hours = date.getUTCHours(),
        minutes = date.getUTCMinutes(),
        seconds = date.getUTCSeconds();

    var rv = SGP4.propogate(this.state.satrec, year, month + 1, day, hours, minutes, seconds);
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
    const { rv, date, semimajorAxis, eccentricity, inclination, rightAsc, argOfPerigee } = this.state;
    const { position, velocity } = rv;
    const error = (this.state.error !== 0 || invalidVector(position) || invalidVector(velocity)) && errorMessage(this.state.error);

    return (
      <div className='TCanvasContainer'>
        <TCanvas
          windowSize={this.state.windowSize}
          position={position}
          velocity={velocity}
          semimajorAxis={semimajorAxis}
          eccentricity={eccentricity}
          inclination={inclination}
          rightAsc={rightAsc}
          argOfPerigee={argOfPerigee}
          error={error}
        />
        {error ? (
          <div className='error'>
            {errorMessage(this.state.error)}
          </div>
        ) : (
          <TCanvasDetails
            position={position}
            velocity={velocity}
          />
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

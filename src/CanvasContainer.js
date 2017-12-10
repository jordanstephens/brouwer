import React, { Component } from 'react';
import ReactAnimationFrame from 'react-animation-frame';
import moment from 'moment';
import SGP4 from 'sgp4';

import AnimationCanvas from './AnimationCanvas';
import ParamForm from './ParamForm';
import Details from './Details';

import {
  XP_DOT_P,
  MU,
  PARAM_NAMES
} from './constants';

import './CanvasContainer.css';

function newSatRec(params) {
  var gravconst = SGP4.getgravconst("wgs84");
  var now = new Date();
  var opsmode = 'i';
  var deg2rad  =  Math.PI / 180.0; //0.0174532925199433
  var satrec = {};

  satrec.error = 0;
  satrec.whichconst = gravconst;

  //Line 1
  satrec.satnum = "12345"
  satrec.epochyr = parseInt(now.getUTCFullYear().toString().substr(2, 2), 10);
  satrec.epochdays = (now - (new Date(now.getUTCFullYear(), 0, 0))) / (1000 * 60 * 60 * 24);
  satrec.ndot = undefined; // ignoring for now
  satrec.nddot = undefined; // ignoring for now
  satrec.bstar = 0;

  //Line 2
  satrec.inclo = Number(params.inclination) || 0;
  satrec.nodeo = Number(params.rightAsc) || 0;
  satrec.ecco = Number(params.eccentricity) || 0;
  satrec.argpo = Number(params.argOfPerigee) || 0;
  satrec.mo = Number(params.meanAnomaly) || 0;
  satrec.no = Math.sqrt(MU / Math.pow(params.semimajorAxis, 3)) / (2 * Math.PI / 86400) / XP_DOT_P;

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

function calculatePeriod(semimajorAxis) {
  return 2 * Math.PI * Math.sqrt(Math.pow(semimajorAxis, 3) / MU);
}

function propogate(satrec, dt) {
  const date = INITIAL_DATE.add(dt, 's').toDate(),
        year = date.getUTCFullYear(),
        month = date.getUTCMonth() + 1,
        day = date.getUTCDate(),
        hours = date.getUTCHours(),
        minutes = date.getUTCMinutes(),
        seconds = date.getUTCSeconds();
  return SGP4.propogate(satrec, year, month, day, hours, minutes, seconds);
}

const FIRST_PERIOD_ONLY = true;

const INITIAL_DATE = moment();

class CanvasContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      windowSize: 0,
      rate: 1000.0,

      semimajorAxis: 10000,
      inclination: 0.0,
      eccentricity: 0.3,
      rightAsc: 0.0,
      argOfPerigee: 0.0,

      satrec: null,
      error: 0,

      t0: 0,
      t_sum: 0,

      date: new Date(),
      rv: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 }
      },
    };
  }

  componentWillMount() {
    const satrec = newSatRec(this.stateParams());
    const windowSize = this.calculateWindow(this.state.semimajorAxis, this.state.eccentricity)
    this.setState({ satrec, windowSize });
  }

  onAnimationFrame(t) {
    // convert t to seconds
    t = t / 1000.0;
    let dt = (t - this.state.t0) * this.state.rate;
    let t_sum = this.state.t_sum + dt;

    const period = calculatePeriod(this.state.semimajorAxis);
    const progress = period - t_sum;

    if (FIRST_PERIOD_ONLY && progress < 0) {
      // update dt to be negative such that the orbit cycles back around to the start
      const overlap = -1 * progress;
      dt = -1 * period + overlap;
      t_sum = overlap;
    }

    const rv = propogate(this.state.satrec, dt);

    const error = this.state.satrec.error;
    if (error !== 0) console.log(this.state.satrec.error);

    this.setState({
      t0: t,
      t_sum,
      rv,
      error
    });
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
    const windowSize = this.calculateWindow(params.semimajorAxis, params.eccentricity);
    this.setState({ satrec, windowSize, [k]: v });
  }

  calculateWindow = (semimajorAxis, eccentricity) => {
    const a = Number(semimajorAxis);
    const e = Number(eccentricity);
    return 2 * ((a * e) + a) + 2000;
  }

  render() {
    const { rv, date, semimajorAxis, eccentricity, inclination, rightAsc, argOfPerigee } = this.state;
    const { position, velocity } = rv;
    const error = (this.state.error !== 0 || invalidVector(position) || invalidVector(velocity)) && errorMessage(this.state.error);

    return (
      <div className='CanvasContainer'>
        <ParamForm
          windowSize={this.state.windowSize}
          rate={this.state.rate}
          semimajorAxis={semimajorAxis}
          eccentricity={eccentricity}
          inclination={inclination}
          rightAsc={rightAsc}
          argOfPerigee={argOfPerigee}
          onParamChange={(e, key, value) => this.updateOrbitalParam(key, value)}
        />
        <AnimationCanvas
          windowSize={this.state.windowSize}
          positionX={position.x}
          positionY={position.y}
          positionZ={position.z}
          velocityX={velocity.x}
          velocityY={velocity.y}
          velocityZ={velocity.z}
          semimajorAxis={semimajorAxis}
          eccentricity={eccentricity}
          inclination={inclination}
          rightAsc={rightAsc}
          argOfPerigee={argOfPerigee}
          error={error}
        />

        {/* <div className='row'>
          <div>
            <strong>Rate</strong>
            {' '}
            <input
              type='number'
              value={this.state.rate}
              onChange={(e) => this.setState({ rate: e.target.value })}
              step={10}
            />
            {' '}
            ×
          </div>
        </div> */}

        {error ? (
          <div className='error'>
            {errorMessage(this.state.error)}
          </div>
        ) : (
          <Details
            position={position}
            velocity={velocity}
            semimajorAxis={semimajorAxis}
            eccentricity={eccentricity}
            period={calculatePeriod(semimajorAxis)}
          />
        )}
      </div>
    );
  }
}

export default ReactAnimationFrame(CanvasContainer);

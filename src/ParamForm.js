import React from 'react';

import './ParamForm.css';

import { EARTH_RADIUS } from './constants';

class ParamField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
    };
  }

  toggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  render() {
    const { value, units, title, symbol, onChange, ...rest } = this.props;
    return (
      <div className='cell'>
        <label className='value' onClick={this.toggleExpanded}>
          {value}{units}
          <span className='symbol' title={title}>{symbol}</span>
        </label>
        <div className='expanded' data-expanded={this.state.expanded}>
          <div className='content'>
            <input
              type='range'
              value={value}
              onChange={onChange}
              {...rest}
            />
          </div>
        </div>
      </div>
    );
  }
}

const ParamForm = ({
  semimajorAxis,
  eccentricity,
  inclination,
  rightAsc,
  argOfPerigee,
  onParamChange,
}) => (
  <div className='controls'>
    <div className='row'>
      <ParamField
        title={'Semi-major Axis'}
        symbol={'α'}
        value={semimajorAxis}
        units={'km'}
        onChange={(e) => onParamChange(e, 'semimajorAxis', e.target.value)}
        min={Math.ceil(EARTH_RADIUS / 10) * 10}
        max={40000}
        step={10}
      />
      <ParamField
        title={'Eccentricity'}
        symbol={'e'}
        value={eccentricity}
        onChange={(e) => onParamChange(e, 'eccentricity', e.target.value)}
        min={0}
        max={0.999}
        step={0.001}
      />
      <ParamField
        title={'Inclination'}
        symbol={'i'}
        value={inclination}
        units={'°'}
        onChange={(e) => onParamChange(e, 'inclination', e.target.value)}
        min={0}
        max={180}
        step={1}
      />
      <ParamField
        title={'Right Ascenscion'}
        symbol={'Ω'}
        value={rightAsc}
        units={'°'}
        onChange={(e) => onParamChange(e, 'rightAsc', e.target.value)}
        min={0}
        max={360}
        step={1}
      />
      <ParamField
        title={'Argument of Perigee'}
        symbol={'ω'}
        value={argOfPerigee}
        units={'°'}
        onChange={(e) => onParamChange(e, 'argOfPerigee', e.target.value)}
        min={0}
        max={360}
        step={1}
      />
    </div>
  </div>
);

export default ParamForm;

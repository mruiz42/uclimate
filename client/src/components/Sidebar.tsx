import type { ComponentProps } from 'react';
import type { Trip } from '../api/client';
import type { Selection } from '../selection';
import style from '../style/App.module.scss';
import type { Units } from '../units';
import LocationSelectForm from './LocationSelectForm';
import WeatherPanel from './WeatherPanel';

type Props = ComponentProps<typeof LocationSelectForm> & {
  trip: Trip | null;
  units: Units;
  selected: Selection;
  onSelect: (selection: Selection) => void;
};

const Sidebar = ({ trip, selected, onSelect, ...formProps }: Props) => (
  <aside className={style.sidebar} data-bs-theme="dark">
    <h1 className={style.title}>
      μClimate <span>weather along your route</span>
    </h1>
    <LocationSelectForm {...formProps} />
    {trip && (
      <WeatherPanel trip={trip} units={formProps.units} selected={selected} onSelect={onSelect} />
    )}
  </aside>
);

export default Sidebar;

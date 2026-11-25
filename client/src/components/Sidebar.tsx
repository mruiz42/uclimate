import type { ComponentProps } from 'react';
import type { Trip } from '../api/client';
import style from '../style/App.module.scss';
import type { Units } from '../units';
import LocationSelectForm from './LocationSelectForm';
import WeatherPanel from './WeatherPanel';

type Props = ComponentProps<typeof LocationSelectForm> & {
  trip: Trip | null;
  units: Units;
  selected: number | null;
  onSelectStop: (index: number) => void;
};

const Sidebar = ({ trip, selected, onSelectStop, ...formProps }: Props) => (
  <aside className={style.sidebar} data-bs-theme="dark">
    <h1 className={style.title}>
      μClimate <span>weather along your route</span>
    </h1>
    <LocationSelectForm {...formProps} />
    {trip && (
      <WeatherPanel trip={trip} units={formProps.units} selected={selected} onSelect={onSelectStop} />
    )}
  </aside>
);

export default Sidebar;

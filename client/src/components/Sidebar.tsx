import {Button, Container, Dropdown, Form} from "react-bootstrap";
import LocationSelectForm from "./LocationSelectForm";
import {forwardRef} from "react";

import style from '../style/App.module.scss';

const Sidebar = (props: any, ref: any) => {
  const {formData, setFormData, requestUserLocation, geolocation, map, markers, setMarkers, setDirections} = props;
  return (
    <div className={style.sidebar}>
      <LocationSelectForm
        formData={formData}
        setFormData={setFormData}
        requestUserLocation={requestUserLocation}
        ref={ref}
        geolocation={geolocation}
        map={map}
        markers={markers}
        setMarkers={setMarkers}
        setDirections={setDirections}
      />
    </div>
)
}


export default forwardRef(Sidebar);

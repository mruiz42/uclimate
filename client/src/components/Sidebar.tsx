import {Button, Container, Dropdown, Form} from "react-bootstrap";
import LocationSelectForm from "./LocationSelectForm";
import {forwardRef} from "react";

import style from '../style/App.module.scss';

const Sidebar = (props: any, ref: any) => {
  const {formData, setFormData, requestUserLocation, geolocation} = props;
  return (
    <div className={style.sidebar}>
      <LocationSelectForm
        formData={formData}
        setFormData={setFormData}
        requestUserLocation={requestUserLocation}
        ref={ref}
        geolocation={geolocation}
      />
    </div>
)
}


export default forwardRef(Sidebar);

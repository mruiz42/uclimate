import {Button, Container, Dropdown, Form} from "react-bootstrap";
import LocationSelectForm from "./LocationSelectForm";
import {forwardRef} from "react";

import style from '../style/App.module.scss';

const Sidebar = (props: any, ref: any) => {
  const {formData, setFormData} = props;
  return (
    <div className={style.sidebar}>
      <LocationSelectForm
        formData={formData}
        setFormData={setFormData}
        ref={ref}
      />
    </div>
)
}


export default forwardRef(Sidebar);

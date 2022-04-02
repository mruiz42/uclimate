import {Button, Dropdown, Form} from "react-bootstrap";
import React, {forwardRef, useState} from "react";
import LocationFormText from "./LocationFormText";
import style from './style/LocationSelectForm.module.scss';
import axios from "axios";

const SERVER = process.env.REACT_APP_API_URL;

const LocationSelectForm = (props: any, ref: any) => {
  const {formData, setFormData, requestUserLocation, geolocation} = props;
  const {originRef, destinationRef} = ref.current;
  const handleClick = (event: any) => {
  axios.get(SERVER + "/maps/directions", {
      params: {
        origin: originRef.current.value,
        destination: destinationRef.current.value,
        travelMode: "DRIVING"
      }
    }).then((res) => {
      console.log(res);
  })
  }

  return (
    <Form>
      <LocationFormText label={"Origin"}
                        ref={originRef}
                        placeholder={""}
                        controlId={"directionForm.ControlInput1"}
                        formData={formData}
                        setFormData={setFormData}
                        geolocation={geolocation}
      />
      <div className={style.geolocationButton} onClick={requestUserLocation}>
        Use my location
      </div>
      <LocationFormText label={"Destination"}
                        ref={destinationRef}
                        placeholder={""}
                        controlId={"directionForm.ControlInput2"}
                        formData={formData}
                        setFormData={setFormData}
                        geolocation={geolocation}
      />
      <Button variant="info"
              style={{ margin: " 10px 0 0 0" }}
              onClick={handleClick}
      >
        {"Go >"}
      </Button>
    </Form>

  )
}

export default forwardRef(LocationSelectForm);

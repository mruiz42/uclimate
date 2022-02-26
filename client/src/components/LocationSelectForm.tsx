import {Button, Dropdown, Form} from "react-bootstrap";
import React, {forwardRef, useState} from "react";
import LocationFormText from "./LocationFormText";
const SERVER = process.env.REACT_APP_API_URL;

const LocationSelectForm = (props: any, ref: any) => {
  const {formData, setFormData} = props;
  const {originRef, destinationRef} = ref.current;

  const handleFindPlaces = () => {
    fetch(SERVER + "/maps/places", )
      .then(r => {
        console.log("hi")
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
                        handleFindPlaces={handleFindPlaces}
      />

      <LocationFormText label={"Destination"}
                        ref={destinationRef}
                        placeholder={""}
                        controlId={"directionForm.ControlInput2"}
                        formData={formData}
                        setFormData={setFormData}
                        handleFindPlaces={handleFindPlaces}
      />
      <Button variant="info">
        {"Go >"}
      </Button>
    </Form>

  )
}

export default forwardRef(LocationSelectForm);

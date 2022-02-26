import {Button, Dropdown, Form} from "react-bootstrap";
import React, {useState} from "react";
import LocationFormText from "./LocationFormText";


const LocationForm = (props: any) => {
  const [formData, setFormData] = useState({})
  return (
    <Form>
      <LocationFormText label={"Origin"}
                        placeholder={""}
                        controlId={"directionForm.ControlInput1"}
      />
      <LocationFormText label={"Destination"}
                        placeholder={""}
                        controlId={"directionForm.ControlInput2"}
      />
      <Button variant="info">{"Go >"}</Button>
    </Form>

  )
}

export default LocationForm;

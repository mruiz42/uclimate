import {Form, FormControl} from "react-bootstrap";
import SuggestionDropdownMenu from "./SuggestionDropdownMenu";
import React, {forwardRef} from "react";

const LocationFormText = (props: any, ref: any) => {
  const {label, placeholder, controlId, formData, setFormData, handleFindPlaces} = props;
  const handleChange = (event: any) => {
    // setFormData(event.target.value);
  }

  return (
    <Form.Group className="mb-3" controlId={controlId} >
      <Form.Label>{label}</Form.Label >
      <FormControl type="text"
                    ref={ref}
                    placeholder={placeholder}
                    onKeyPress={handleChange}
      />
      <SuggestionDropdownMenu />
    </Form.Group>
  )

}

export default forwardRef(LocationFormText);

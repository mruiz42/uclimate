import {Form} from "react-bootstrap";
import SuggestionDropdownMenu from "./SuggestionDropdownMenu";
import React from "react";

const LocationFormText = (props: { label: string; placeholder: string; controlId: string; }) => {
  const {label, placeholder, controlId} = props;
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control type="text" placeholder={placeholder} />
      <SuggestionDropdownMenu />
    </Form.Group>
  )
}

export default LocationFormText;

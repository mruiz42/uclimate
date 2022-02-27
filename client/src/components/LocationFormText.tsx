import {Form, FormControl} from "react-bootstrap";
import SuggestionDropdownMenu from "./SuggestionDropdownMenu";
import React, {forwardRef, useState} from "react";
import axios from "axios";
const SERVER = 'http://localhost:4200';

const LocationFormText = (props: any, ref: any) => {
  const {label, placeholder, controlId, formData, setFormData, handleFindPlaces} = props;
  const [queryPredictions, setQueryPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (event: any) => {
    // const formCopy = formData;
    // console.log(formData);
    const query = ref.current.value;
    axios.get(SERVER + "/maps/queryPlaces", {
      params: {
        q: query
      }
    })
      .then(res => {
        console.log(res);
        setQueryPredictions(res.data.predictions)
      })
      .catch(err => {
        console.log(err);

      })
  }
  const handleFocus = (event: any) => {
    setShowDropdown(true)
  }

  const handleBlur = (event: any) => {
    setShowDropdown(false)
  }

  return (
    <Form.Group className="mb-3" controlId={controlId} >
      <Form.Label>{label}</Form.Label >
      <FormControl type="text"
                   ref={ref}
                   placeholder={placeholder}
                   onChange={handleChange}
                   onFocus={handleFocus}
                   onBlur={handleBlur}
      />
      <SuggestionDropdownMenu queryPredictions={queryPredictions} showDropdown={showDropdown}/>
    </Form.Group>
  )

}

export default forwardRef(LocationFormText);

import {Form, FormControl} from "react-bootstrap";
import SuggestionDropdownMenu from "./SuggestionDropdownMenu";
import React, {forwardRef, useState} from "react";
import axios from "axios";
import style from './style/LocationFormText.module.scss';

const SERVER = process.env.REACT_APP_API_URL;

const LocationFormText = (props: any, ref: any) => {
  const {label, placeholder, controlId, formData, geolocation} = props;
  const [queryPredictions, setQueryPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (event: any) => {
    // TODO: Reduce the amount of calls here -- implement client side caching?
    const query = ref.current.value;
    axios.get(SERVER + "/maps/queryPlaces", {
      params: {
        q: query,
        lat: geolocation.lat,
        lng: geolocation.lng
      }
    })
      .then(res => {
        console.log(res);
        setQueryPredictions(res.data.predictions);
        if(res.data.predictions && res.data.predictions.length !== 0) {
          setShowDropdown(true);
        }
      })
      .catch(err => {
        console.log(err);
      })
  }

  const handleFocus = (event: any) => {
    // Handle when to show the dropdown menu and when to hide it
    // This is called when the text form is in focus and when there are results to be shown
    if (!queryPredictions) {
      setShowDropdown(false);
      setQueryPredictions([]);
    } else if (queryPredictions.length !== 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }

  const handleBlur = (event: any) => {
    // https://www.sitepoint.com/community/t/jquery-problem-with-blur-event/5282
    // TODO: This is really hacky and I spent 2 hours figuring this out... Terrible
    setTimeout(() => {
      console.log("DEBUG: Blur timeout :)")
      setShowDropdown(false);
    }, 500)
  }

  const handleDropdownClick = (event: any, id: number) => {
    const formIdentifier = label.toLowerCase();
    const selection = queryPredictions[id];
    if (ref.current) {
      console.log(selection)
      const newFormData = formData;
      newFormData[formIdentifier].data = selection;
      ref.current.value = newFormData[formIdentifier].data.description;
    }
    setShowDropdown(false);
  }

  return (
    <Form.Group className={style.formbox} controlId={controlId} >
      <Form.Label>{label}</Form.Label >
      <FormControl type="text"
                   ref={ref}
                   placeholder={placeholder}
                   onChange={handleChange}
                   onFocus={handleFocus}
                   onBlurCapture={handleBlur}
      />
      { ref.current && ref.current.value !== 0 &&
        <SuggestionDropdownMenu queryPredictions={queryPredictions}
                                showDropdown={showDropdown}
                                handleDropdownClick={handleDropdownClick}
        />
      }
    </Form.Group>
  )

}

export default forwardRef(LocationFormText);

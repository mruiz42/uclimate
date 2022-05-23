import {Form, FormControl} from "react-bootstrap";
import SuggestionDropdownMenu from "./SuggestionDropdownMenu";
import React, {forwardRef, useState} from "react";
import axios from "axios";
import style from './style/LocationFormText.module.scss';

const SERVER = process.env.REACT_APP_API_URL;

const LocationFormText = (props: any, ref: any) => {
  const {label, placeholder, controlId, formData, setFormData, geolocation, map, markers, setMarkers} = props;
  const [queryPredictions, setQueryPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (event: any) => {
    // Get a list of potential locations from query
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
    }, 500);
  }

  const handleDropdownClick = (event: any, id: number) => {
    // This event gets triggered when a user selects one of the query predictions
    // The location metadata will be set as well as a marker will be placed on the map
    // event: js event being triggered
    // id: dropdown id of selected prediction from dropdown
    const formIdentifier = label.toLowerCase();   // The label of the form, ('origin' & 'destination')
    const selection: any = queryPredictions[id];     // User's selected queryPreiction
    if (ref.current) {
      console.log("Selection: ", selection)
      const newFormData = formData;
      newFormData[formIdentifier].data = selection;
      ref.current.value = newFormData[formIdentifier].data.description
      console.log(formData)
      setFormData(newFormData);
    }
    setShowDropdown(false);
    axios.get(SERVER + "/maps/coords", {
      params: {
        address: selection.address,
        place_id: selection.place_id
      }
    })
      .then(r => {
        // const latlng = r.data.results.geometry.location;
        // TODO: Check logic for marker here
        // const marker = new google.maps.Marker({
        //   position: latlng,
        //   map: map
        // });
        // setMarkers([...markers, latlng]);
        // console.log("MARKERS", markers);
      })
      .catch(e => {
        console.log(e);
      })


  }

  return (
    <Form.Group className={style.formbox} controlId={controlId} >
      <Form.Label>{label}</Form.Label>
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

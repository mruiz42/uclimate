import {Button, Dropdown, Form} from "react-bootstrap";
import React, {forwardRef, useState} from "react";
import LocationFormText from "./LocationFormText";
import style from './style/LocationSelectForm.module.scss';
import axios from "axios";
const SERVER = process.env.REACT_APP_API_URL;

const LocationSelectForm = (props: any, ref: any) => {
  const {formData, setFormData, requestUserLocation, geolocation, map, markers, setMarkers, setDirections} = props;
  const {originRef, destinationRef} = ref.current;

  const handleClick = (event: any) => {
    console.log("old")
    const travelMode = google.maps.TravelMode.DRIVING;
    let r = {
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      travelMode: travelMode
    };

    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    const directionService = new google.maps.DirectionsService();
    directionService.route(r, (result, status) => {
    })
      .then(r => {
        console.log(r)
        directionsRenderer.setDirections(r);
        }
      );

    // axios.get(SERVER + "/maps/directions", {
    //     params: {
    //       origin: originRef.current.value,
    //       destination: destinationRef.current.value,
    //       travelMode: google.maps.TravelMode.DRIVING
    //     }
    //   })
    //   .then((res: any) => {
    //     console.log("Origin PlaceID: ", res.data.geocoded_waypoints[0]);
    //     console.log("Destination PlaceID: ", res.data.geocoded_waypoints[1]);
    //     console.log("Routes: ", res.data.routes);
    //     // const directions = new google.maps.DirectionsRenderer();
    //     // res.data.available_travel_modes = ["DRIVING"];
    //     const test = new google.maps.LatLngBounds(res.data.routes[0].bounds.southWest, res.data.routes[0].bounds.northEast);
    //     res.data.routes[0].bounds = test;
    //     const directionsRenderer = new google.maps.DirectionsRenderer();
    //     // console.log("RESPONSE:", res.data);
    //     directionsRenderer.setMap(map);
    //     directionsRenderer.setDirections(res.data);
    //
    // });
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
                        map={map}
                        markers={markers}
                        setMarkers={setMarkers}
      />
      <div className={style.geolocationButton}
           onClick={requestUserLocation}>
        Use my location
      </div>
      <LocationFormText label={"Destination"}
                        ref={destinationRef}
                        placeholder={""}
                        controlId={"directionForm.ControlInput2"}
                        formData={formData}
                        setFormData={setFormData}
                        geolocation={geolocation}
                        map={map}
                        markers={markers}
                        setMarkers={setMarkers}
      />
      <Button variant="info"
              style={{ margin: " 10px 0 0 0" }}
              onClick={handleClick}
      >
        {"Go >"}
      </Button>
    </Form>
  );
}

export default forwardRef(LocationSelectForm);

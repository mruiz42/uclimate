import {Button, Dropdown, Form} from "react-bootstrap";
import React, {forwardRef, useState} from "react";
import LocationFormText from "./LocationFormText";
import style from './style/LocationSelectForm.module.scss';
import axios from "axios";
import * as turf from '@turf/turf';
const SERVER = process.env.REACT_APP_API_URL;

const LocationSelectForm = (props: any, ref: any) => {
  const {formData, setFormData, requestUserLocation, geolocation, map, markers, setMarkers, setDirections, weatherData, setWeatherData} = props;
  const {originRef, destinationRef} = ref.current;

  const handleClick = (event: any) => {
    // Get origin weather
    axios.get(SERVER + "/weather/forecast?lat=" +
      formData.origin.latlng.lat + "&lng=" + formData.origin.latlng.lng)
      .then(originData => {
        console.log(originData.data);
        setWeatherData({...weatherData, origin: originData.data.properties});
        // Get destination weather
        axios.get(SERVER + "/weather/forecast?lat=" +
          formData.destination.latlng.lat + "&lng=" + formData.destination.latlng.lng)
          .then(destData => {
            // Set weather data and get directions
            setWeatherData({...weatherData, destination: destData.data.properties});
            const travelMode = google.maps.TravelMode.DRIVING;
            let route = {
              origin: originRef.current.value,
              destination: destinationRef.current.value,
              travelMode: travelMode
            };

            const directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map);
            const directionService = new google.maps.DirectionsService();
            directionService.route(route, (result, status) => {})
              .then(res => {
                console.log("DIRECTIONS", res);
                // console.log("MARKERS", markers)
                directionsRenderer.setDirections(res);
                const waypoints= google.maps.geometry.encoding.decodePath(res.routes[0].overview_polyline);
                let points: any = [];
                for (let i=0; i<waypoints.length; i++) {
                  const js = waypoints[i].toJSON();
                  console.log("JS", js)
                  points.push([js.lng, js.lat])
                }
                const line = turf.lineString(points);
                console.log(line)
                const totalDistance = turf.distance(points[0], points[points.length-1]);
                const keyPoints: any = [];
                let cur = 25;
                console.log("TOTALDISTANCE", totalDistance)
                while (cur<totalDistance) {
                  let along = turf.along(line, cur);
                  console.log("ALONG", along);
                  const lat = along.geometry.coordinates[1];
                  const lng = along.geometry.coordinates[0];

                  // let mark = new google.maps.Marker({ label: "hi", title: x.toString()});
                  // mark.setPosition({lat: x, lng: y});
                  // mark.setMap(map);
                  const mark = {lat: lat, lng: lng};
                  keyPoints.unshift(mark);
                  console.log("NEWMARK", mark)
                  cur += 50
                }
                setMarkers(keyPoints);
                // for (let i = 0; i < keyPoints.length; i++) {
                //   keyPoints[i].setMap(map);
                //   console.log("KEYPOINTS", keyPoints[i])
                // }
              });
          })
      })



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

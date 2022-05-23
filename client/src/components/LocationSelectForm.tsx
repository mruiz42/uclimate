import {Button, Dropdown, Form} from "react-bootstrap";
import React, {forwardRef, useState} from "react";
import LocationFormText from "./LocationFormText";
import style from './style/LocationSelectForm.module.scss';
import axios from "axios";
import * as turf from '@turf/turf';
const { DateTime, Interval, Duration } = require("luxon");
const SERVER = process.env.REACT_APP_API_URL;

const LocationSelectForm = (props: any, ref: any) => {
  const {formData, setFormData, requestUserLocation, geolocation, map, markers, setMarkers, setDirections, weatherData,
    setWeatherData} = props;
  const {originRef, destinationRef} = ref.current;

  const handleClick = (event: any) => {
    // SUBPOINT MARKER INTERVAL - How many miles in between the route you want to measure (increases api calls)
    const SUBPOINT_INTERVAL_MILES = 50;
    const TIME_NOW = DateTime.now();
    // Get origin weather
    // for (let i=0; i<markers.length; i++) {
    //   markers[i].setMap(null);
    // }

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
                let overview_polyline_latLngs: any = [];
                for (let i=0; i<waypoints.length; i++) {
                  const js = waypoints[i].toJSON();
                  console.log("JS", js);
                  overview_polyline_latLngs.push([js.lng, js.lat]);
                }
                const line = turf.lineString(overview_polyline_latLngs);
                console.log(line);
                const totalDistance = turf.distance(overview_polyline_latLngs[0], overview_polyline_latLngs[overview_polyline_latLngs.length-1]);
                const subPointLatLngs: any = [];
                let cur = 0;
                console.log("TOTALDISTANCE", totalDistance)
                while (cur<totalDistance) {
                  // measure every X miles
                  cur += SUBPOINT_INTERVAL_MILES;
                  // Find coordinates X miles along a given path
                  let along = turf.along(line, cur);
                  console.log("ALONG", along);
                  const alongRouteLat = along.geometry.coordinates[1];
                  const alongRouteLng = along.geometry.coordinates[0];
                  const alongRouteLatLng = {lat: alongRouteLat, lng: alongRouteLng};
                  subPointLatLngs.push(alongRouteLatLng);
                  console.log("ALONGROUTELATLNG", alongRouteLatLng)

                }
                console.log("SUBPOINTS", subPointLatLngs)
                // setMarkers(subPointLatLngs);
                // Call matrix service API
                const matrixService = new google.maps.DistanceMatrixService();
                const matrixRequest = {
                  "origins": [
                    {
                      "lat": subPointLatLngs[0].lat,
                      "lng": subPointLatLngs[0].lng
                    }],
                  "destinations":
                  // https://stackoverflow.com/questions/68446993/how-to-filter-every-element-except-first-in-an-array-js
                  //   subPointLatLngs.filter((subArray: any, index: any) => subArray.length > 0 || index === 0),
                  subPointLatLngs,
                  "travelMode": google.maps.TravelMode.DRIVING,
                  "unitSystem": google.maps.UnitSystem.IMPERIAL,
                  "avoidHighways": false,
                  "avoidTolls": false
                }

                matrixService.getDistanceMatrix(matrixRequest)
                  .then((matrixResponse) => {
                    console.log("MATRIX_RES", matrixResponse);
                    // Call weather API for each sub point along route
                    const matrixData = matrixResponse.rows[0].elements;
                    for (let i=0; i<matrixData.length; i++) {
                      // Create a marker for this sub point along route
                      let mark = new google.maps.Marker({});
                      mark.setPosition(subPointLatLngs[i]);
                      mark.setMap(map);
                      // Determine local time from departure time using predicted time
                      const duration = Duration.fromMillis(matrixData[i].duration.value * 1000);
                      const predictedTime = TIME_NOW.plus(duration);

                      // Get weather data along route
                      axios.get(SERVER + "/weather/forecast?lat=" + subPointLatLngs[i].lat + "&lng=" + subPointLatLngs[i].lng)
                        .then(weatherData => {
                          console.log("WEATHER", weatherData)
                          const weatherPeriods = weatherData.data.properties.periods;
                          let predictedWeatherPeriod = undefined;
                          // Determine the weather period that overlaps with predicted time
                          for (let i=0; i<weatherPeriods.length; i++) {
                            const startTime = DateTime.fromISO(weatherPeriods[i].startTime);
                            const endTime = DateTime.fromISO(weatherPeriods[i].endTime);
                            const interval = Interval.fromDateTimes(startTime, endTime);
                            if (interval.contains(predictedTime)) {
                              predictedWeatherPeriod = weatherPeriods[i];
                              break;
                            }
                          }
                          if (predictedWeatherPeriod === undefined) {
                            console.log("WARN Predicted time not found in weather interval")
                            predictedWeatherPeriod = weatherPeriods[i];
                          }


                          const info = new google.maps.InfoWindow({position: subPointLatLngs[i],
                            content: predictedWeatherPeriod.detailedForecast});
                          const infoWindowOpenOptions = {map: map, shouldFocus: true, anchor: mark};
                          info.open(infoWindowOpenOptions);
                          mark.setLabel(predictedWeatherPeriod.temperature.toString()); // + "°F");
                        })
                        .catch(e => {
                          console.log("WEATHER FAIL", e);
                          mark.setMap(null);
                        })
                      // const mark = {lat: lat, lng: lng};
                      // keyPoints.unshift(mark);
                      // console.log("NEWMARK", mark)
                      setTimeout(() => { console.log('waiting 1000ms before next query') }, 1000);
                      // for (let i = 0; i < keyPoints.length; i++) {
                      //   keyPoints[i].setMap(map);
                      //   console.log("KEYPOINTS", keyPoints[i])
                      // }

                    }


                  })


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

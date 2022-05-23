import React, {useEffect, useRef, useState} from 'react';
import {Container} from "react-bootstrap"

import style from './style/App.module.scss';

import Sidebar from "./components/Sidebar";
import MapView from './components/MapView';
import {AxiosResponse} from "axios";
import WeatherPanel from "./components/WeatherPanel";

const axios = require('axios');
const SERVER = 'http://localhost:4200';

const form = {
  origin: {
    description: "",
    latlng: {},
    place_id: ""
  },
  destination: {
    description: "",
    latlng: {},
    place_id: ""
  }
}

const weather = {
  origin: undefined,
  destination: undefined
}

const App = () => {
  const [geolocation, setGeolocation] = useState({lat: 32, lng: -119});
  const [formData, setFormData] = useState(form);
  const [weatherData, setWeatherData] = useState(weather);
  const originRef = useRef<any>({});
  const destinationRef = useRef<any>({});
  const ref = useRef({ originRef, destinationRef });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = React.useState<google.maps.Marker[]>([]);
  const [directions, setDirections] = React.useState<any>({});
  const [clicks, setClicks] = React.useState<google.maps.LatLng[]>([]);
  const [zoom, setZoom] = React.useState(3);    // initial zoom
  const [center, setCenter] = React.useState<google.maps.LatLngLiteral>({
    lat: 36,
    lng: -119,
  });

  const requestUserLocation = () => {
    // Get users current position
    navigator.geolocation.getCurrentPosition((loc) => {
      const latlng = {"lat": loc.coords.latitude, "lng": loc.coords.longitude}
      setGeolocation(latlng);
      setCenter(latlng);
      setZoom(12);
      const coords = loc.coords.latitude.toString() + "," + loc.coords.longitude.toString();
      originRef.current.value = latlng;
      // axios.get(SERVER + "/weather/forecast?lat=" +
      //   latlng.lat + "&lng=" + latlng.lng)
      //   .then ((res: AxiosResponse) => {
      //     setWeatherData({...weatherData, origin: res.data.properties});
      //
      //   })
      // .catch((e: any)=>console.log(e));
      axios.get(SERVER + "/maps/reverseGeocode", {
        params: {
          latlng: coords,
          key: apiKey
        }
      })
        .then((res: AxiosResponse) => {
          console.log(res.data);
          let originData = {
            latlng: latlng,
            description: res.data.description,
            place_id: res.data.place_id
          }
          setFormData({...formData, origin: originData});
          originRef.current.value = res.data[0].formatted_address;
          // addMarker(latlng);
        })
        .catch((e: any) => {
          console.log(e);
        })
    });
  }

  const onClick = (e: google.maps.MapMouseEvent) => {
    // avoid directly mutating state
    setClicks([...clicks, e.latLng!]);
  };

  const onIdle = (m: google.maps.Map) => {
    console.log("onIdle");
    setZoom(m.getZoom()!);
    setCenter(m.getCenter()!.toJSON());

  };

// Adds a marker to the map and push to the array.
  function addMarker(position: google.maps.LatLng | google.maps.LatLngLiteral) {
    // const marker = new google.maps.Marker({
    //   position,
    //   map,
    // });
    // const latlng = new google.maps.LatLng({});
    // setMarkers([...markers, marker])
  }

// Sets the map on all markers in the array.
  function setMapOnAll(map: google.maps.Map | null) {
    for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }

// Removes the markers from the map, but keeps them in the array.
  function hideMarkers(): void {
    setMapOnAll(null);
  }

// Shows any markers currently in the array.
  function showMarkers(): void {
    setMapOnAll(map);
  }

// Deletes all markers in the array by removing references to them.
  function deleteMarkers(): void {
    hideMarkers();
    setMarkers([]);
  }

  useEffect(() => {
    // TODO: Check if this really needs to be updated -- check to see if data is already populated in origin?
    requestUserLocation();
  }, [])

  const apiKey: any = process.env.REACT_APP_API_KEY;
  return (
    <Container fluid className={style.AppContainer}>
      <Sidebar ref={ref}
               formData={formData}
               setFormData={setFormData}
               requestUserLocation={requestUserLocation}
               geolocation={geolocation}
               map={map}
               markers={markers}
               setMarkers={setMarkers}
               setDirections={setDirections}
               weatherData={weatherData}
               setWeatherData={setWeatherData}
      />
        <div className={style.mapViewContainer}>
          <MapView
            apiKey={apiKey}
            map={map}
            setMap={setMap}
            markers={markers}
            formData={formData}
            weatherData={weatherData}
            directions={directions}
          />
        </div>
    </Container>
  );
}

export default App;

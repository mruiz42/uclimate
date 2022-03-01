import React, {useEffect, useRef, useState} from 'react';
import {Container} from "react-bootstrap"
import {Status, Wrapper} from "@googlemaps/react-wrapper";

import style from './style/App.module.scss';

import Sidebar from "./components/Sidebar";
import MapView from './components/MapView';

const axios = require('axios');
const SERVER = 'http://localhost:4200';


const form = {
  geolocation: {
  },
  origin: {
    data: {
    },
  },
  destination: {
    data: {
    },
  }
}

const render = (status: Status) => {
  return <h1>{status}</h1>;
};


const App = () => {
  const [geolocation, setGeolocation] = useState({lat: 0, lng: 0});
  const [formData, setFormData] = useState(form);
  const originRef = useRef<any>({});
  const destinationRef = useRef<any>({});
  const ref = useRef({ originRef, destinationRef });

  const [markers, setMarkets] = React.useState<google.maps.LatLng[]>([]);
  const [clicks, setClicks] = React.useState<google.maps.LatLng[]>([]);
  const [zoom, setZoom] = React.useState(3); // initial zoom
  const [center, setCenter] = React.useState<google.maps.LatLngLiteral>({
    lat: 0,
    lng: 0,
  });

  const requestUserLocation = () => {
    navigator.geolocation.getCurrentPosition((loc) => {
      const latlng = {"lat": loc.coords.latitude, "lng": loc.coords.longitude}
      console.log(latlng);
      setGeolocation(latlng);
      setFormData({...formData, geolocation: loc.coords});
      setCenter(latlng);
      setZoom(12);
      const coords = loc.coords.latitude.toString() + "," + loc.coords.longitude.toString();
      originRef.current.value = latlng;

      axios.get(SERVER + "/maps/reverseGeocode", {
        params: {
          latlng: coords,
          key: api_key
        }
      })
        .then((res: any) => {
          console.log(res.data);
          setFormData({...formData, origin: {data: res.data}})
          originRef.current.value = res.data[0].formatted_address;
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

  useEffect(() => {
    // TODO: Check if this really needs to be updated -- check to see if data is already populated in origin?
    requestUserLocation();
  }, [])

  const api_key: any = process.env.REACT_APP_API_KEY;
  return (
    <Container fluid className={style.AppContainer}>
      <Sidebar ref={ref} formData={formData} setFormData={setFormData}/>
        <div className={style.mapViewContainer}>
          <Wrapper apiKey={api_key} render={render}>
            <MapView
              formData={formData}
              center={center}
              onClick={onClick}
              onIdle={onIdle}
              style={{ flexGrow: "1", height: "100%" }}
              zoom={zoom}>
            </MapView>
          </Wrapper>
        </div>
    </Container>
  );
}

export default App;

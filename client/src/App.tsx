import React, {createRef, forwardRef, useEffect, useRef, useState} from 'react';
import {Button, Container, Dropdown, Form} from "react-bootstrap"
import { Wrapper, Status } from "@googlemaps/react-wrapper";

import style from './style/App.module.scss';

import Sidebar from "./components/Sidebar";
import MapView from './components/MapView';

const axios = require('axios');
const SERVER = 'http://localhost:4200';


const form = {
  origin: {
    data: {
    },
    geolocation: {}
  },
  destination: {
    data: {
    },
    geolocation: {}
  }
}

const render = (status: Status) => {
  return <h1>{status}</h1>;
};

/*
{
  "description": "390 Allegan Cir, San Jose, CA 95123, USA",
  "matched_substrings": [
    {
      "length": 3,
      "offset": 0
    },
    {
      "length": 11,
      "offset": 4
    },
    {
      "length": 8,
      "offset": 17
    },
    {
      "length": 2,
      "offset": 27
    },
    {
      "length": 5,
      "offset": 30
    },
    {
      "length": 2,
      "offset": 37
    }
  ],
  "place_id": "ChIJ_5EGAtcxjoAR4tDBv6oidzQ",
  "reference": "ChIJ_5EGAtcxjoAR4tDBv6oidzQ",
  "structured_formatting": {
    "main_text": "390 Allegan Cir",
    "main_text_matched_substrings": [
      {
        "length": 3,
        "offset": 0
      },
      {
        "length": 11,
        "offset": 4
      }
    ],
    "secondary_text": "San Jose, CA 95123, USA",
    "secondary_text_matched_substrings": [
      {
        "length": 8,
        "offset": 0
      },
      {
        "length": 2,
        "offset": 10
      },
      {
        "length": 5,
        "offset": 13
      },
      {
        "length": 2,
        "offset": 20
      }
    ]
  },
  "terms": [
    {
      "offset": 0,
      "value": "390"
    },
    {
      "offset": 4,
      "value": "Allegan Cir"
    },
    {
      "offset": 17,
      "value": "San Jose"
    },
    {
      "offset": 27,
      "value": "CA"
    },
    {
      "offset": 30,
      "value": "95123"
    },
    {
      "offset": 37,
      "value": "USA"
    }
  ],
  "types": [
    "premise",
    "geocode"
  ]
}
 */

const App = () => {
  const [location, setLocation] = useState({});
  const [formData, setFormData] = useState(form);
  const originRef = useRef<any>({});
  const destinationRef = useRef<any>({});
  const ref = useRef({ originRef, destinationRef });

  const [clicks, setClicks] = React.useState<google.maps.LatLng[]>([]);
  const [zoom, setZoom] = React.useState(3); // initial zoom
  const [center, setCenter] = React.useState<google.maps.LatLngLiteral>({
    lat: 0,
    lng: 0,
  });

  const requestUserLocation = () => {
    navigator.geolocation.getCurrentPosition((loc) => {
      setLocation(loc.coords);
      console.log(loc.coords);
      const formCopy = formData;
      formCopy.origin.geolocation = loc;
      setFormData(formCopy);
      console.log(originRef);
      const latlng = loc.coords.latitude.toString() + "," + loc.coords.longitude.toString();
      originRef.current.value = latlng;
      let data = new FormData();
      data.append('latlng', latlng);
      axios.get(SERVER + "/maps/reverseGeocode", {
        params: {
          latlng: latlng
        }
      })
        .then((res: any) => {
          console.log(res.data);
          const formCopy = formData;
          formCopy.origin.data = res.data;
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

  const api: any = process.env.REACT_APP_API_KEY;
  return (
    <Container fluid className={style.AppContainer}>
      <Sidebar ref={ref} formData={formData} setFormData={setFormData}/>
        <div className={style.mapViewContainer}>
          <Wrapper apiKey={api} render={render}>
            <MapView
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

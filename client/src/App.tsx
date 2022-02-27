import React, {createRef, forwardRef, useEffect, useRef, useState} from 'react';
import {Button, Container, Dropdown, Form} from "react-bootstrap";
import Sidebar from "./components/Sidebar";
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

const App = () => {
  const [location, setLocation] = useState({});
  const [formData, setFormData] = useState(form);
  const originRef = useRef<any>({});
  const destinationRef = useRef<any>({});
  const ref = useRef({ originRef, destinationRef });

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

  useEffect(() => {
    requestUserLocation();
  }, [])

  return (
    <Container fluid className={"App"}>
      <Sidebar ref={ref} formData={formData} setFormData={setFormData}/>
    </Container>
  );
}


export default App;

import React, {createRef, forwardRef, useEffect, useRef, useState} from 'react';
import {Button, Container, Dropdown, Form} from "react-bootstrap";

import Sidebar from "./components/Sidebar";


const App = () => {
  const [location, setLocation] = useState({});
  const [formData, setFormData] = useState({
    origin: {},
    destination: {}
  });
  const originRef = useRef<any>({});
  const destinationRef = useRef<any>({});
  const ref = useRef({ originRef, destinationRef });

  const requestUserLocation = () => {
    navigator.geolocation.getCurrentPosition((loc) => {
      setLocation(loc.coords);
      console.log(loc.coords);
      setFormData({origin: loc.coords, destination: formData.destination});
      console.log(originRef)
      originRef.current.value = loc.coords.latitude.toString() + "," + loc.coords.longitude.toString();
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

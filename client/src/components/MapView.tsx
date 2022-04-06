import React from "react";
import { GoogleMap, Marker } from "react-google-maps"
import style from '../style/App.module.scss';


const MapView = (props: any) => {



  return (
    <GoogleMap
      defaultZoom={8}
      defaultCenter={{ lat: -34.397, lng: 150.644 }}
    >
      {props.isMarkerShown && <Marker position={{ lat: -34.397, lng: 150.644 }} />}
    </GoogleMap>
  );

}

export default MapView;

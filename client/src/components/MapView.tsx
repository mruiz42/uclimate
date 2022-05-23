import React, {useState} from 'react'
import {
  DirectionsRenderer,
  DirectionsService,
  GoogleMap,

  InfoWindow,
  Marker,
  useJsApiLoader
} from '@react-google-maps/api';
import style from './style/MapView.module.scss';


const containerStyle = {
  width: '100%',
  height: '100%'
};

const zoom = 5;

const center = {
  lat: 36,
  lng: -119
};
const markerClick = (e: any) => {
  console.log(e);
}

// https://react-google-maps-api-docs.netlify.app/#directionsservice
const MapView = (props: any) => {
  const {apiKey, map, setMap, markers, formData, directions, weatherData} = props;
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });
  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds();
    const options = new
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);
  return isLoaded ? (
    <div className={style.Map}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{disableDefaultUI: true}}
      >
        { /* Child components, such as markers, info windows, etc. */ }
        { formData.origin.latlng != "" ? <><Marker position={formData.origin.latlng}/></> : <></>}
        { formData.destination.latlng != "" ? <><Marker position={formData.destination.latlng}/></> : <></>}
        {/*{markers.map((pos: any, index: any) => {*/}
        {/*  return(<Marker position={pos} visible={true} title={pos.lat.toString()+","+pos.lng.toString()}*/}
        {/*                 onClick={markerClick} key={index}></Marker>)*/}
        {/*})}*/}
      </GoogleMap>
    </div>

  ) : <></>
}

export default React.memo(MapView);

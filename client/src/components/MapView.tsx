import React, {useState} from 'react'
import {DirectionsRenderer, DirectionsService, GoogleMap, Marker, useJsApiLoader} from '@react-google-maps/api';

const containerStyle = {
  width: '400px',
  height: '400px'
};

const center = {
  lat: 37,
  lng: -121
};
// https://react-google-maps-api-docs.netlify.app/#directionsservice
const MapView = (props: any) => {
  const {apiKey, map, setMap, markers, formData, directions} = props;
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  })

  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds();
    map.fitBounds(bounds);
    setMap(map)
  }, [])

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, [])


  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      { /* Child components, such as markers, info windows, etc. */ }
      { formData.origin.latlng != "" ? <><Marker position={formData.origin.latlng}/></> : <></>}
      { formData.destination.latlng != "" ? <><Marker position={formData.destination.latlng}/></> : <></>}
  </GoogleMap>
  ) : <></>
}

export default React.memo(MapView)

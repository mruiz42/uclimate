import React from "react";
import { createCustomEqual } from "fast-equals";
import {isLatLngLiteral} from "@googlemaps/typescript-guards";

import style from '../style/App.module.scss';


// https://googlemaps.github.io/react-wrapper/index.html
interface MapProps extends google.maps.MapOptions {
  map: google.maps.Map | null;
  markers: google.maps.Marker[];
  setMap: React.Dispatch<google.maps.Map>;
  formData: {};
  onClick?: (e: google.maps.MapMouseEvent) => void;
  style: { [key: string]: string };
  onIdle?: (map: google.maps.Map) => void;
}


const MapView: React.FC<MapProps> = ({
                                   map,
                                   setMap,
                                   markers,
                                   formData,
                                   onClick,
                                   onIdle,
                                   styles,
                                   children,
                                   ...options
                                 }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const deepCompareEqualsForMaps = createCustomEqual(
    (deepEqual) => (a: any, b: any) => {
      if (
        isLatLngLiteral(a) ||
        a instanceof google.maps.LatLng ||
        isLatLngLiteral(b) ||
        b instanceof google.maps.LatLng
      ) {
        return new google.maps.LatLng(a).equals(new google.maps.LatLng(b));
      }
      // TODO extend to other types
      // use fast-equals for other objects
      return deepEqual(a, b);
    }
  );

  function useDeepCompareMemoize(value: any) {
    const ref = React.useRef();
    if (!deepCompareEqualsForMaps(value, ref.current)) {
      ref.current = value;
    }
    return ref.current;
  }

  function useDeepCompareEffectForMaps(
    callback: React.EffectCallback,
    dependencies: any[]
  ) {
    React.useEffect(callback, dependencies.map(useDeepCompareMemoize));
  }

  React.useEffect(() => {
    if (ref.current && !map) {
      setMap(new window.google.maps.Map(ref.current, {}));
    }
    for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }, [ref, map, markers]);

  // because React does not do deep comparisons, a custom hook is used
  // see discussion in https://github.com/googlemaps/js-samples/issues/946
  useDeepCompareEffectForMaps(() => {
    if (map) {
      map.setOptions(options);
    }
  }, [map, options]);

  React.useEffect(() => {
    if (map) {
      ["click", "idle"].forEach((eventName) =>
        google.maps.event.clearListeners(map, eventName)
      );

      if (onClick) {
        map.addListener("click", onClick);
      }

      if (onIdle) {
        map.addListener("idle", () => onIdle(map));
      }
    }
  }, [map, onClick, onIdle]);

  return (
    <>
      <div ref={ref} style={style} className={style.mapView}/>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // set the map prop on the child component
          return React.cloneElement(child, { map });
        }
      })}
    </>
  );
};


export default MapView;

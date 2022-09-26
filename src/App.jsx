import React, { useState, useRef, useMemo, useCallback } from 'react'
import { useJsApiLoader, GoogleMap, MarkerF, Autocomplete, DirectionsRenderer, CircleF } from '@react-google-maps/api'
import reactLogo from './assets/react.svg'
import car from './assets/car.webm'
import logo from './assets/tiny_pin.svg'
import './App.css'

const videoWidth = '250px';
const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const circleOptions = {
  strokeColor: '#0f52ba',
  strokeOpacity: 0.7,
  strokeWeight: 2,
  fillColor: '#0000ff99',
  fillOpacity: 0.4,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
  radius: 100,
  zIndex: 1
}

function App() {

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    libraries: ["places"],
    googleMapsApiKey: mapsKey
  })

  // setting map and its center position
  const [map, setMap] = useState(/** @type google.maps.Map */(null))
  const center = useMemo(() => ({ lat: 23.344, lng: 85.31 }), []); // {lat: 23.344, lng: 85.31}
  const [location, setLocation] = useState(() => center); // changes based on marker
  const [zoomLevel, setZoomLevel] = useState(10);
  const [showBtn, setShowBtn] = useState(false)

  const [originCords, setoriginCords] = useState(null) // lat lng of origin
  const [destinationCords, setdestinationCords] = useState(null) // lat lng of destination


  // direction and distance matrix
  const [directionResponse, setDirectionResponse] = useState(null)
  const [direction, setDirection] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState(null)

  const originRef = useRef();
  const destinationRef = useRef();
  let origin, destination;

  async function calculateRoute() {
    if (!showBtn) return;
    // origin = originRef.current.value; 
    origin = originCords //{ lat: 23.078, lng: 85.264 }
    destination = destinationCords // { lat: 23.076, lng: 85.279 }

    if (origin === '' && destination === '') return;

    console.log('origin : ', origin, destination)

    const directionService = new google.maps.DirectionsService()

    const result = await directionService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING
    })

    let distanceValue = result.routes[0].legs[0].distance.value // meters
    let durationValue = result.routes[0].legs[0].duration.value // minutes

    let INITIAL_BOOK_CHARGE = 50; // initial book charge
    let BASE_FARE = 14; // charge per km
    let PRICE_PER_MIN = 0.06;
    let calculatedPrice = (INITIAL_BOOK_CHARGE + ((distanceValue / 1000) * BASE_FARE) + (durationValue * PRICE_PER_MIN)).toFixed(2);

    setPrice(calculatedPrice);

    setDirectionResponse(result)
    console.log('result : ', result)
    setDirection(result.routes[0].legs[0].distance.text)
    setDuration(result.routes[0].legs[0].duration.text)

  }

  // clear routes
  function clearRoute() {
    // setoriginCords(null)
    // setdestinationCords(null)
    // setLocation(center);
    // originRef.current.value = '';
    // destinationRef.current.value = '';
    // setDirectionResponse(null)
    // setDirection('')
    // setDuration('')
  }

  // get current location using GeoLocation API
  function getCurrentLocation() {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    for (let i = 1; i <= 4; i++) {
      setTimeout(() => {
        setZoomLevel(10 + 2 * i);
      }, 250 * i)
    }


    function success(pos) {
      console.log('loc : ', location)
      const crd = pos.coords;

      console.log(`Latitude : ${crd.latitude}`);
      console.log(`Longitude: ${crd.longitude}`);

      setLocation({ lat: crd.latitude, lng: crd.longitude })
      originRef.current.value = `${crd.latitude}, ${crd.longitude}`
      map.panTo({ lat: crd.latitude, lng: crd.longitude })
      setoriginCords({ lat: crd.latitude, lng: crd.longitude })
    }

    function error(err) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(success, error, options);

  }

  function handleMarkerDrag(e, isOrigin) {
    let newLat = parseFloat(e.latLng.lat().toFixed(3));
    let newLng = parseFloat(e.latLng.lng().toFixed(3))

    setoriginCords({ lat: newLat, lng: newLng })
    originRef.current.value = `${newLat}, ${newLng}`
  }

  function handleDestinationMarker(e) {
    let newLat = parseFloat(e.latLng.lat().toFixed(3));
    let newLng = parseFloat(e.latLng.lng().toFixed(3))

    setdestinationCords({ lat: newLat, lng: newLng })
    destinationRef.current.value = `${newLat}, ${newLng}`

  }

  function handlePlaceSelected(isOrigin) {
    if (originCords !== null) {
      setShowBtn(true)
    }

    let searchPlace = isOrigin ? originRef.current.value : destinationRef.current.value;
    var request = {
      query: searchPlace,
      fields: ['name', 'geometry'],
    };
    let service = new google.maps.places.PlacesService(map);
    console.log('search place : ', searchPlace, request)

    service.findPlaceFromQuery(request, function (results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log('result : ', results)
        let lat = parseFloat(results[0].geometry.location.lat().toFixed(3));
        let lng = parseFloat(results[0].geometry.location.lng().toFixed(3));

        console.log('latLng origin : ', { lat, lng })

        if (isOrigin) {
          setoriginCords({ lat, lng })
        } else {
          console.log('dest')
          setdestinationCords({ lat, lng })
        }

        setLocation({ lat, lng })
        map.panTo({ lat, lng })
        for (let i = 1; i <= 4; i++) {
          setTimeout(() => {
            setZoomLevel(10 + 2 * i);
          }, 250 * i)
        }

      }
    });
  }


  if (!isLoaded) return <div>Loading...</div>

  return (
    <div className="main-container">

      <div className="left-side flex">

        <div className="info-card">
          <div className="head flex">
            <video controls width={videoWidth} autoPlay muted loop>
              <source src={car} type="video/webm" />
            </video>
          </div>
          <div className="body">
            <div className="company-name">
              <span className="flex"><span className="text-indigo">C</span>ab <span className="text-indigo"> F</span> are</span>
            </div>
            <div className="input-box">
              <div className="pickup">
                <div className="pickup-input flex">
                  <Autocomplete onPlaceChanged={() => handlePlaceSelected(true)} className="auto-complete">
                    <input type="text" placeholder='Pickup location' ref={originRef} />
                  </Autocomplete>
                </div>
                <div onClick={getCurrentLocation} className="flex pickup-location">
                  <div className="location-crosshair flex">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0c17.7 0 32 14.3 32 32V66.7C368.4 80.1 431.9 143.6 445.3 224H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H445.3C431.9 368.4 368.4 431.9 288 445.3V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V445.3C143.6 431.9 80.1 368.4 66.7 288H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H66.7C80.1 143.6 143.6 80.1 224 66.7V32c0-17.7 14.3-32 32-32zM128 256c0 70.7 57.3 128 128 128s128-57.3 128-128s-57.3-128-128-128s-128 57.3-128 128zm128 80c-44.2 0-80-35.8-80-80s35.8-80 80-80s80 35.8 80 80s-35.8 80-80 80z" fill="#F7F7F7" /></svg>
                  </div>
                  <div className="locate-label flex">Locate Me</div>
                </div>
              </div>

              <div className="pickup drop">
                <div className="pickup-input drop-input flex">
                  <Autocomplete onPlaceChanged={() => handlePlaceSelected(false)} className="auto-complete">
                    <input type="text" placeholder='Drop location' ref={destinationRef} />
                  </Autocomplete>
                </div>
              </div>

            </div>

            {
              price &&
              (
                <div className="output">
                  <div className="info-box">
                    <div>Distance : <span className="price"> {direction}</span></div>
                    <div>Duration : <span className="price"> {duration}</span></div>
                  </div>
                  <div className="info-price">
                    <div>Total Fare : <span className="price"> {price}</span></div>
                  </div>
                </div>

              )
            }


            <div onClick={calculateRoute} className={!showBtn ? "pickup-input drop-input flex book-div disabled" : "pickup-input drop-input flex book-div"}>
              {
                price ? "Confirm Booking" : "Show Cabs"
              }
            </div>

          </div>
        </div>
      </div>

      <div className="right-side">
        <div className="map-div">
          {/* Google Map */}

          <GoogleMap
            center={center}
            zoom={zoomLevel}
            mapContainerStyle={{ width: '50vw', height: '100vh' }}
            onLoad={(map) => setMap(map)}
            options={{
              zoomControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              mapTypeControl: false
            }}
          >
            {/* Display Markers, InfoWindow, Direction etc. */}
            {
              originCords && (
                <MarkerF
                  position={originCords}
                  draggable={true}
                  style={{ width: "15px", height: "15px" }}
                  icon={{
                    url: logo,
                  }}
                  onDragEnd={handleMarkerDrag}
                />
              )
            }

            {
              destinationCords && (
                <MarkerF
                  position={destinationCords}
                  draggable={true}
                  style={{ width: "30px", height: "30px" }}
                  icon={{
                    url: logo,
                  }}
                  onDragEnd={handleDestinationMarker}
                />
              )
            }

            {
              location && (
                <CircleF
                  center={location}
                  options={circleOptions}
                />
              )
            }

            {/* Route Render */}
            {directionResponse && <DirectionsRenderer directions={directionResponse} />}

          </GoogleMap>
        </div>
      </div>
    </div>
  )
}

export default App

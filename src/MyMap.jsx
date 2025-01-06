import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import './MyMap.css'
import MySidebar from './MySidebar';
import supabase from './connection';

const mapboxKey = import.meta.env.VITE_MAPBOX_KEY;

const INTITIAL_CENTER = [38.7525, 9.0192]; // Addis Ababa
const INTITIAL_ZOOM = 10;

function MyMap() {
    const mapContainerRef = useRef();
    const mapRef = useRef();

    const mapMarkers = useRef();
    const [ stations, setStations ] = useState([]);
    const [ startStation, setStartStation ] = useState(null);
    const [ destStation, setDestStation ] = useState(null);

    // set center to user's [lgn, lat]
    const flyToCenter = (center) => {
        mapRef.current.flyTo({
            center: center,
            zoom: 14
        });

        const popup = new mapboxgl.Popup({ offset: 25 }).setText(
            'Your Location'
        );
        const marker = new mapboxgl.Marker()
            .setLngLat(center)
            .setPopup(popup)
            .addTo(mapRef.current);
    };
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                flyToCenter([position.coords.longitude, position.coords.latitude]);
            }, (error) => {
                if (error.code == 1) {
                    alert("This site needs location services to function properly. Please, enable geolocation.");
                } else {
                    alert("Unexpected error occured, please try reloading the page.");
                }
            });
        } else {
            alert("This site needs location services to function properly. Please, try with a different browser.");
        }
    }, []);


    // updates markers on every change of options
    const updateMarkers = () => {
        mapMarkers.current.forEach((marker) => {
            marker.remove();
        });
        mapMarkers.current = [];

        // update stations based on selected option
        let selectBox = document.getElementById("dropdown");
        let selectedStationID = selectBox.options[selectBox.selectedIndex].value;

        if (selectedStationID === "0") {
            stations.forEach((station) => {
                const marker = addMarker(station, -1);
                mapMarkers.current.push(marker);
            });
        } else {
            // for selectedStationID, find all other stations that can reach it
            setDestStation(stations[Number(selectedStationID) - 1]);
            fetchBusAndUpdateMarkers(selectedStationID);
        }
    };

    async function fetchBusAndUpdateMarkers(id) {
        const { data } = await supabase.from('bus').select();

        let buses = [];
        data.forEach((bus) => {
            if (bus.route.includes(Number(id))) {
                buses.push(bus);
            }
        });

        let validStations = [Number(id)];
        buses.forEach((bus) => {
            bus.route.forEach((stationId) => {
                if (!validStations.includes(stationId)) {
                    validStations.push(stationId);
                }
            });
        });

        validStations.forEach((stationId) => {
            const marker = addMarker(stations[stationId - 1], Number(id));
            mapMarkers.current.push(marker);
        });
    }

    const addMarker = (station, destId) => {
        const marker = new mapboxgl.Marker({ color: station.stationid === destId ? 'green' : 'red' })
            .setLngLat([station.long, station.lat]);
        if (station.stationid === destId) {
            marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setText("Your Destination"));
        } else {
            marker.getElement().onclick = () => {
                setStartStation(station);
            };
        }
        marker.addTo(mapRef.current);
        return marker;
    };

    // add all stations initially
    useEffect(() => {
        (async function () {
            mapMarkers.current = [];

            const { data } = await supabase.from('station').select();
            data.forEach((station) => {
                const marker = addMarker(station, -1);
                mapMarkers.current.push(marker);
            });

            setStations(data);
        })();
    }, []);

    // add map
    useEffect(() => {
        mapboxgl.accessToken = mapboxKey;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            center: INTITIAL_CENTER, // starting position [lng, lat]
            zoom: INTITIAL_ZOOM // starting zoom
        });
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
    }, []);

    return (
        <>
            <div
                style={{ height: '100%' }}
                ref={mapContainerRef}
                className="map-container"
                id="map"
            />
            { startStation === null ? null :
                <div className="CloseButton">
                    <button onClick={ () => setStartStation(null) } >Close</button>
                </div>
            }
            { startStation === null ? null : <MySidebar station={startStation} destination={destStation}></MySidebar> }
            <div className="sidebar">
                <h3 style={{ textAlign: 'center' }}>Destination</h3>
                <select className="chooseDrowdown" id="dropdown" onChange={ updateMarkers }>
                    <option value="0">Choose</option>
                    {
                        stations.map((station) => {
                             return <option value={station.stationid}>{station.name}</option>;
                        })
                    }
                </select>
            </div>
        </>
    );
}

export default MyMap;

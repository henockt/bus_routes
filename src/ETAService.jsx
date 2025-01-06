import supabase from './connection';
import { useState, useEffect } from 'react';

const mapboxKey = import.meta.env.VITE_MAPBOX_KEY;

// Eucledian squared distance
const distance = (lat, long, lat2, long2) => {
    return Math.pow(Math.abs(lat - lat2), 2) + Math.pow(Math.abs(long - long2), 2);
};

// approximates the bus to be between two stations
const afterStation = (bus, stations) => {
    let route = bus.route;
    route.map((id) => { Number(id); });

    let dist = -1;
    let after = route[0];
    for (let i = 0; i < route.length-1; ++i) {
        let current = distance(bus.lat, bus.long, stations[route[i] - 1].lat, stations[route[i] - 1].long)
                        + distance(bus.lat, bus.long, stations[route[i+1] - 1].lat, stations[route[i+1] - 1].long);
        if (dist === -1 || current < dist) {
            dist = current;
            after = route[i];
        }
    }
    return after;
};

function ETAService({ bus, station }) {
    const [ ETA, setETA ] = useState("...");

    // calculates ETA for the bus to reach station
    // else sets 'away' if going opposite to station
    useEffect(() => {
        (async function () {
            const { data } = await supabase.from('station').select();
            const after = afterStation(bus, data);

            if ((bus.directionflag && bus.route.indexOf(station.stationid) <= bus.route.indexOf(after))
                || (!bus.directionflag && bus.route.indexOf(station.stationid) > bus.route.indexOf(after))) {
                setETA("away");
            } else {
                const options = {
                    alternatives: "false",
                    geometries: "geojson",
                    overview: "simplified",
                    steps: "false",
                    access_token: mapboxKey,
                };
                const coordinates = bus.long + "," + bus.lat + ";" + station.long + "," + station.lat;
                const res = await fetch("https://api.mapbox.com/directions/v5/mapbox/driving/" + coordinates + "?" + new URLSearchParams(options))
                                    .then((response) => {
                                        response.json().then((data) => {
                                            // data["routes"][0]["duration"] is the time in seconds
                                            let minutes = data["routes"][0]["duration"] / 60;
                                            setETA(minutes.toFixed(0).toString());
                                        });
                                    });
            }
        })();
    }, [bus, station]);

    return (
        <p>ETA: {ETA}</p>
    );
};

export default ETAService;

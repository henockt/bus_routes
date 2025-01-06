import './MySidebar.css';
import supabase from './connection';
import { useState, useEffect } from 'react';
import ETAService from './ETAService';

function MySidebar({ station }) {
    const [ buses, setBuses ] = useState([]);

    useEffect(() => {
        (async function () {
            const { data } = await supabase.from('bus').select();

            let currbuses = [];

            for (let i = 0; i < data.length; ++i) {
                let bus = data[i];
                if (bus.route.includes(Number(station.stationid))) {
                    currbuses.push(bus);
                }
            }

            setBuses(currbuses);
        })();
    }, [station]);

    return (
        <>
            <div className="mysidebar">
                <h3 style={ {paddingBottom: "5px", margin: "20px", paddingTop: "20px"} } >Station: {station.name}</h3>
                {
                    buses.map((bus) => {
                        return (
                            <div className="bus"
                                     style={ {backgroundColor: (bus.idleflag || bus.delayflag) ? "orangered" : "whitesmoke" } }
                            >
                                <p>Bus {bus.busid}</p>
                                <p>Seats: {bus.seatsavailable}</p>
                                <ETAService bus={bus} station={station}></ETAService>
                            </div>
                            );
                    })
                }
            </div>
        </>
    );

};

export default MySidebar;

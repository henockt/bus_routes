import './MySidebar.css';
import supabase from './connection';
import { useState, useEffect } from 'react';

function MySidebar({ station, destination }) {
    const [ buses, setBuses ] = useState([]);

    useEffect(() => {
        (async function () {
            const { data } = await supabase.from('bus').select();

            let currbuses = [];
            data.forEach((bus) => {
                if (bus.route.includes(Number(station.stationid))) {
                    currbuses.push(bus);
                }
            });

            setBuses(currbuses);
        })();
    }, [station, destination]);

    return (
        <>
            <div className="mysidebar">
                <h3 style={ {paddingBottom: "5px", margin: "20px", paddingTop: "20px"} } >Station: {station.name}</h3>
                {
                    buses.map((bus) => {
                        return <p className="bus"
                                  style={ {backgroundColor: (bus.idleflag || bus.delayflag) ? "orangered" : "whitesmoke" } }
                                >Bus {bus.busid}: {bus.lat}, {bus.long}</p>;
                    })
                }
            </div>
        </>
    );

};

export default MySidebar;

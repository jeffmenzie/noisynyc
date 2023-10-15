import React from "react";
import styles from "./ByAddress.module.css";
import LoadingOverlay from "../components/LoadingOverlay";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import AsyncSelect from "react-select/async";
import debounce from "debounce-promise";
import AddressRecordItem from "../components/AddressRecordItem";
import ByAddressDistanceFilter from "../components/ByAddressDistanceFilter";
import { mapboxApiToken } from "../variables/Tokens";
import { apiUrlPrefix } from "../variables/EnvironmentSpecific";

import { useState, useRef, useEffect } from "react";

function ByAddress(props) {
    const [selectedValue, setSelectedValue] = useState(null);

    const [lng, setLng] = useState(-73.9);
    const [lat, setLat] = useState(40.74);
    const [zoom, setZoom] = useState(10);
    const [minZoom, setMinZoom] = useState(9);
    const [maxZoom, setMaxZoom] = useState(19);
    const [summaryData, setSummaryData] = useState([]);
    const [haveSummaryData, setHaveSummaryData] = useState(false);
    const [loading, setLoading] = useState(false);

    const [selectedDistance, setSelectedDistance] = useState("500");

    const initialLoad = useRef(true);

    const mapPeriod = "DAYS365";

    const debounceFunc = debounce(async (inputValue) => {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${inputValue}.json?access_token=${mapboxApiToken}&bbox=-74.3,40.4,-73.6,41&proximity=-73,41&types=address,place&country=US`
        );
        const responseData = await response.json();
        return responseData.features.map((i) => ({
            label: i.place_name.replaceAll(", United States", ""),
            value: i.center,
        }));
    }, 500);

    // handle selection
    const handleChange = (value) => {
        console.log("handleChange value: " + value.value[0] + "|" + value.value[1]);
        console.log("handleChange label: " + value.label);
        setLng(value.value[0]);
        setLat(value.value[1]);
        setSelectedValue(value);

        console.log(value.place_name);
    };

    mapboxgl.accessToken = mapboxApiToken;

    const mapContainer = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        const jsonFile = "complaints_y.geojson";

        //if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/light-v11",
            center: [lng, lat],
            zoom: zoom,
            minZoom: minZoom,
            maxZoom: maxZoom,
            dragPan: false,
            dragRotate: false,
            scrollZoom: false,
        });

        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        map.current.on("load", function () {
            map.current.resize();
            map.current.addSource("complaintSource", {
                type: "geojson",
                data: `./data/${jsonFile}`,
            });

            const periodToDisplay = "Y";

            map.current.on("click", "complaintSource-point", function (e) {
                let point_longitude = e.features[0].geometry.coordinates[0].toFixed(5);
                let point_latitude = e.features[0].geometry.coordinates[1].toFixed(5);
                let point_period = periodToDisplay.toUpperCase();
                let point_complaints = e.features[0].properties.complaints;
                let point_coordinates = e.features[0].geometry.coordinates;
                let point_request = new XMLHttpRequest();
                point_request.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        let r = this.responseText;
                        let p = JSON.parse(r);
                        let point_address = p[0][1] || "Not Available"; // not available if no value found
                        new mapboxgl.Popup()
                            .setLngLat(point_coordinates)
                            .setHTML(
                                '<span style="font-family: &#39IBM Plex Mono&#39, monospace; font-weight: 500; font-size: 0.9em;">Complaints: ' +
                                    point_complaints +
                                    "</span><br>" +
                                    '<span style="font-family: &#39IBM Plex Mono&#39, monospace; font-weight: 500; font-size: 0.9em;">Address: ' +
                                    point_address +
                                    "</span>"
                            )
                            .addTo(map.current);
                    }
                };

                let point_url = `${apiUrlPrefix}heatmaplocationdetail?period=${point_period}&latitude=${point_latitude}&longitude=${point_longitude}`;

                point_request.open("GET", point_url, true);
                point_request.send();
            });
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.current.on("mouseenter", "complaintSource-point", function () {
            map.current.getCanvas().style.cursor = "pointer";
        });

        // Change it back to a pointer when it leaves.
        map.current.on("mouseleave", "complaintSource-point", function () {
            map.current.getCanvas().style.cursor = "";
        });
    }, [mapPeriod]);

    useEffect(() => {
        const fetchSummaryData = async () => {
            setLoading(true);
            var filename = "";

            const longitudeToUse = lng;
            const latitudeToUse = lat;
            const distanceToUse = selectedDistance;

            const response = await fetch(
                `${apiUrlPrefix}byaddresssummary?latitude=${latitudeToUse}&longitude=${longitudeToUse}&distance=${distanceToUse}`
            );
            const responseData = await response.json();

            setSummaryData(responseData);
            setHaveSummaryData(true);

            setLoading(false);
        };

        if (initialLoad.current === false) {
            fetchSummaryData();
        }
    }, [lat, selectedDistance]);

    useEffect(() => {
        initialLoad.current ? (initialLoad.current = false) : mapClick();
    }, [lat, lng, zoom, minZoom, maxZoom]);

    const recordList = summaryData.map((record) => (
        <AddressRecordItem
            key={record.complaint_type}
            complaintType={record.complaint_type}
            recordData={record.complaint_data}
        />
    ));

    const mapClick = () => {
        const heatmapDensity = 1;
        const summaryPointMaxComplaints = mapPeriod === "DAYS30" ? 10 : 300;

        if (map.current.getLayer("complaintSource-point")) {
            map.current.removeLayer("complaintSource-point");
        }

        map.current.addLayer(
            {
                id: "complaintSource-point",
                type: "circle",
                source: "complaintSource",
                minzoom: 14,
                paint: {
                    // increase the radius of the circle as the zoom level
                    "circle-radius": {
                        property: "complaints",
                        type: "exponential",
                        stops: [
                            [
                                {
                                    zoom: 15,
                                    value: 1,
                                },
                                5,
                            ],
                            [
                                {
                                    zoom: 15,
                                    value: summaryPointMaxComplaints,
                                },
                                25,
                            ],
                            [
                                {
                                    zoom: 18,
                                    value: 1,
                                },
                                10,
                            ],
                            [
                                {
                                    zoom: 18,
                                    value: summaryPointMaxComplaints,
                                },
                                50,
                            ],
                        ],
                    },
                    "circle-color": {
                        property: "complaints",
                        type: "exponential",
                        stops: [
                            [1, "rgba(255,255,172,0.7)"],
                            [5, "rgba(254,217,118,0.7)"],
                            [10, "rgba(254,178,76,0.7)"],
                            [15, "rgba(253,141,60,0.7)"],
                            [20, "rgba(240,59,32,0.7)"],
                            [25, "rgba(189,0,38,0.7)"],
                        ],
                    },
                    "circle-stroke-color": "white",
                    "circle-stroke-width": 1,
                    "circle-opacity": {
                        stops: [
                            [14, 0],
                            [15, 1],
                        ],
                    },
                },
            },
            "waterway-label"
        );

        map.current.flyTo({ center: [lng, lat], zoom: 16 });
        const marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map.current);
    };

    const changeDistanceHandler = (distanceValue) => {
        setSelectedDistance(distanceValue);
    };

    const downloadDetailsHandler = async () => {
        setLoading(true);

        var filename = "";

        const longitudeToUse = lng;
        const latitudeToUse = lat;

        const res = await fetch(
            `${apiUrlPrefix}api/byaddressexport?latitude=${latitudeToUse}&longitude=${longitudeToUse}`
        )
            .then((result) => {
                const header = result.headers.get("Content-Disposition");
                const parts = header.split(";");
                filename = parts[1].split("=")[1].replaceAll('"', "");
                return result.blob();
            })
            .then((blob) => {
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
            });

        setLoading(false);
    };

    const customStyles = {
        control: (provided) => ({
            ...provided,
            borderRadius: "0px",
            border: "1px solid rgb(210,210,210)",
            fontFamily: "var(--font-sans)",
        }),

        menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999,
            fontFamily: "var(--font-sans)",
        }),

        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
            borderRadius: "0px",
            border: "1px solid rgb(210,210,210)",
        }),

        option: (provided) => ({
            ...provided,
            fontFamily: "var(--font-sans)",
        }),
    };

    return (
        <div className={styles.byAddressOuterContainer}>
            {loading && <LoadingOverlay />}
            <div className={styles.byAddressInnerContainer}>
                <div className={styles.objectContainerSearchBar}>
                    <div className={styles.objectContainerTop}>
                        <div className={styles.introText}>SEARCH COMPLAINTS BY ADDRESS</div>
                    </div>

                    <div className={styles.objectContainerBottom}>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions={false}
                            value={selectedValue}
                            loadOptions={debounceFunc}
                            placeholder={"Enter a NYC Address..."}
                            onChange={handleChange}
                            isLoading={false}
                            isClearable={false}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition={"fixed"}
                        />

                        {!haveSummaryData && (
                            <div className={styles.helpText}>
                                Map will display complaint data based on prior 365 days. Detail for
                                address shown below the map.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.mapOuterContainer}>
                <div ref={mapContainer} className={styles.mapContainer} />
            </div>

            {haveSummaryData && (
                <div className={styles.byAddressInnerContainer}>
                    <div className={styles.objectContainer}>
                        <div>
                            <ByAddressDistanceFilter
                                selectedDistance={selectedDistance}
                                onChangeDistance={changeDistanceHandler}
                            />
                        </div>

                        {!initialLoad.current && recordList}

                        <div className={styles.downloadTextIntro}>
                            Download detailed complaint data within 2,000 feet. Please be patient as
                            the export process may take several minutes to complete.
                        </div>

                        <div className={styles.actionButton}>
                            <span
                                onClick={downloadDetailsHandler}
                                className={styles.actionButtonText}
                            >
                                Download Complaints
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ByAddress;

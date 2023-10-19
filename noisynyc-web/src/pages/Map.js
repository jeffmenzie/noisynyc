import React from "react";
import { Fragment } from "react";
import styles from "./Map.module.css";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import MapFilter from "../components/MapFilter";
import { mapboxApiToken } from "../variables/Tokens";
import { apiUrlPrefix } from "../variables/EnvironmentSpecific";
import { useRef, useEffect, useState } from "react";

function Map(props) {
    mapboxgl.accessToken = mapboxApiToken;

    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-73.9);
    const [lat, setLat] = useState(40.74);
    const [zoom, setZoom] = useState(10);
    const [minZoom, setMinZoom] = useState(9);
    const [maxZoom, setMaxZoom] = useState(19);

    const mapPeriod = props.mapPeriod;

    const changeMapPeriodHandler = (mapPeriodValue) => {
        props.onChangeMapPeriod(mapPeriodValue);
        heatmapAddLayer();
    };

    useEffect(() => {
        const jsonFile = mapPeriod === "DAYS30" ? "complaints_m.geojson" : "complaints_y.geojson";

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/light-v11",
            center: [lng, lat],
            zoom: zoom,
            minZoom: minZoom,
            maxZoom: maxZoom,
        });

        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        map.current.on("load", function () {
            map.current.resize();
            map.current.addSource("complaintSource", {
                type: "geojson",
                data: `./data/${jsonFile}`,
            });

            const periodToDisplay = mapPeriod === "DAYS30" ? "M" : "Y";

            heatmapAddLayer(1);

            // interactivity
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
        
                let point_url = `${apiUrlPrefix}/heatmaplocationdetail?period=${point_period}&latitude=${point_latitude}&longitude=${point_longitude}`;

                point_request.open("GET", point_url, true);
                point_request.send();
            });
        });
    }, [lng, lat, zoom, props.mapPeriod]);

    function heatmapAddLayer() {
        if (map.current.getLayer("complaintSource-heat")) {
            map.current.removeLayer("complaintSource-heat");
            map.current.removeLayer("complaintSource-point");
        }

        const heatmapDensity = 1;
        const summaryPointMaxComplaints = mapPeriod === "DAYS30" ? 10 : 300; //10; // fix !!!!!! !!! !!! !!

        map.current.addLayer(
            {
                id: "complaintSource-heat",
                type: "heatmap",
                source: "complaintSource",
                maxzoom: 15,
                paint: {
                    // increase weight as diameter breast height increases
                    "heatmap-weight": {
                        property: "complaints",
                        type: "exponential",
                        stops: [
                            [1, 0],
                            [summaryPointMaxComplaints, 1],
                        ],
                    },

                    // increase intensity as zoom level increases
                    "heatmap-intensity": {
                        stops: [
                            [10, 1],
                            [11, 2],
                            [12, 3],
                            [13, 4],
                            [14, 5],
                        ],
                    },
                    // assign color values be applied to points depending on their density
                    "heatmap-color": [
                        "interpolate",
                        ["linear"],
                        ["heatmap-density"],
                        0,
                        "rgba(255,255,172,0)",
                        0.2,
                        "rgb(254,217,118)",
                        0.4,
                        "rgb(254,178,76)",
                        0.6,
                        "rgb(253,141,60)",
                        0.8,
                        "rgb(240,59,32)",
                        1.0,
                        "rgb(189,0,38)",
                    ],

                    // increase radius as zoom increases
                    "heatmap-radius": {
                        stops: [
                            [9, 10 * heatmapDensity],
                            [10, 10 * heatmapDensity],
                            [11, 15 * heatmapDensity],
                            [12, 20 * heatmapDensity],
                            [13, 25 * heatmapDensity],
                            [14, 30 * heatmapDensity],
                        ],
                    },
                    // decrease opacity to transition into the circle layer
                    "heatmap-opacity": {
                        default: 1,
                        stops: [
                            [14, 1.0],
                            [15, 0.5],
                        ],
                    },
                },
            },
            "waterway-label"
        );

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

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.current.on("mouseenter", "complaintSource-point", function () {
            map.current.getCanvas().style.cursor = "pointer";
        });

        // Change it back to a pointer when it leaves.
        map.current.on("mouseleave", "complaintSource-point", function () {
            map.current.getCanvas().style.cursor = "";
        });
    }

    return (
        <Fragment>
            <div className={styles.mapFilterOuterContainer}>
                <MapFilter mapPeriod={mapPeriod} onChangeMapPeriod={changeMapPeriodHandler} />
            </div>

            <div className={styles.mapOuterContainer}>
                <div ref={mapContainer} className={styles.mapContainer} />
            </div>
        </Fragment>
    );
}

export default Map;

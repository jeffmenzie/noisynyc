import React from "react";
import styles from "./MapFilter.module.css";

const MapFilter = (props) => {
    const changeMapPeriodHandler = (event) => {
        props.onChangeMapPeriod(event.target.value);
    };

    const mapPeriod = props.mapPeriod;

    return (
        <div className={styles.filterContainer}>
            <div className={styles.filterRadioContainer}>
                <input
                    type="radio"
                    id="radioMap30Days"
                    name="radioMapNumberOfDays"
                    value="DAYS30"
                    checked={mapPeriod === "DAYS30" ? true : false}
                    onChange={changeMapPeriodHandler}
                />
                <label htmlFor="radioMap30Days">Last 30 Days</label>

                <input
                    type="radio"
                    id="radioMap365Days"
                    name="radioMapNumberOfDays"
                    value="DAYS365"
                    checked={mapPeriod === "DAYS365" ? true : false}
                    onChange={changeMapPeriodHandler}
                />
                <label htmlFor="radioMap365Days">Last 365 Days</label>
            </div>
        </div>
    );
};

export default MapFilter;

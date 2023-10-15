import React from "react";
import styles from "./ByAddressDistanceFilter.module.css";

const ByAddressDistanceFilter = (props) => {
    const distanceChangeHandler = (event) => {
        props.onChangeDistance(event.target.value);
    };

    const selectedDistance = props.selectedDistance;

    return (
        <div className={styles.filterRadioContainer}>
            <span className={styles.filterIntroText}>Complaints Within: </span>
            <br className={styles.filterMobileBreak} />
            <input
                type="radio"
                id="radio250feet"
                name="radioByAddressDistance"
                value="250"
                checked={selectedDistance === "250" ? true : false}
                onChange={distanceChangeHandler}
            />
            <label htmlFor="radio250feet">250 Feet</label>

            <input
                type="radio"
                id="radio500feet"
                name="radioByAddressDistance"
                value="500"
                checked={selectedDistance === "500" ? true : false}
                onChange={distanceChangeHandler}
            />
            <label htmlFor="radio500feet">500 Feet</label>

            <input
                type="radio"
                id="radio1000feet"
                name="radioByAddressDistance"
                value="1000"
                checked={selectedDistance === "1000" ? true : false}
                onChange={distanceChangeHandler}
            />
            <label htmlFor="radio1000feet">1,000 Feet</label>

            <input
                type="radio"
                id="radio2000feet"
                name="radioByAddressDistance"
                value="2000"
                checked={selectedDistance === "2000" ? true : false}
                onChange={distanceChangeHandler}
            />
            <label htmlFor="radio2000feet">2,000 Feet</label>
        </div>
    );
};

export default ByAddressDistanceFilter;

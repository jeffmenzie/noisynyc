import React from "react";
import styles from "./SummaryFilter.module.css";

const SummaryFilter = (props) => {
    const locationTypeChangeHandler = (event) => {
        props.onChangeLocationType(event.target.value);
    };

    const inputSubmitHandler = (event) => {
        event.preventDefault();
    };

    const inputValueHandler = (event) => {
        props.onChangeSearchValue(event.target.value);
    };

    const searchTerm = props.searchTerm;

    const selectedFilteredSummaryType = props.selectedFilteredSummaryType;
    const inputPlaceholder =
        selectedFilteredSummaryType === "borough"
            ? "Examples: Brooklyn, Queens"
            : selectedFilteredSummaryType === "community_board"
            ? "Examples: 01 Queens, 02 Bronx"
            : "Examples: 10021, 11201";

    return (
        <div className={styles.filterContainer}>
            <div className={styles.filterIntroduction}>
                A data driven approach to measuring noise in NYC based on more than 2.5 million
                noise complaints to 311.
            </div>
            <div className={styles.filterFlexContainer}>
                <div className={styles.filterItem}>
                    <div className={styles.filterLabel}>DISPLAY DATA BY:</div>

                    <div className={styles.filterRadioContainer}>
                        <input
                            type="radio"
                            id="radioBorough"
                            name="radioFilteredSummaryType"
                            value="borough"
                            checked={selectedFilteredSummaryType === "borough" ? true : false}
                            onChange={locationTypeChangeHandler}
                        />
                        <label htmlFor="radioBorough">Borough</label>

                        <input
                            type="radio"
                            id="radioCommunityBoard"
                            name="radioFilteredSummaryType"
                            value="community_board"
                            checked={
                                selectedFilteredSummaryType === "community_board" ? true : false
                            }
                            onChange={locationTypeChangeHandler}
                        />
                        <label htmlFor="radioCommunityBoard">Community Board</label>

                        <input
                            type="radio"
                            id="radioZip5"
                            name="radioFilteredSummaryType"
                            value="zip5"
                            checked={selectedFilteredSummaryType === "zip5" ? true : false}
                            onChange={locationTypeChangeHandler}
                        />
                        <label htmlFor="radioZip5">ZIP5</label>
                    </div>
                </div>
                <div className={styles.filterItem}>
                    <div className={styles.filterLabel}>FILTER BY LOCATION:</div>
                    <form onSubmit={inputSubmitHandler}>
                        <input
                            className={styles.filterInput}
                            value={searchTerm}
                            onChange={inputValueHandler}
                            type="text"
                            placeholder={inputPlaceholder}
                        />
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SummaryFilter;

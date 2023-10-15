import React from "react";
import SummaryFilter from "../components/SummaryFilter";
import SummaryRecordItem from "../components/SummaryRecordItem";
import styles from "./Summary.module.css";

function Summary(props) {
    const selectedFilteredSummaryType = props.selectedFilteredSummaryType;
    const baseDataFilteredLength = props.baseDataFilteredLength;
    const baseDataFilteredLengthIsZero = props.baseDataFilteredLengthIsZero;
    const baseDataFullLength = props.baseDataFullLength;

    const baseData = props.baseDataFiltered;
    const searchTerm = props.searchTerm;

    const changeLocationTypeHandler = (locationType) => {
        props.onChangeLocationType(locationType);
    };

    const changeSearchValueHandler = (searchValue) => {
        props.onChangeSearchValue(searchValue);
    };

    const noRecordsFound = (
        <div className={styles.noResultsFoundContainer}>
            <div className={styles.noResultsFoundLine1}>No Results Found</div>
            <div className={styles.noResultsFoundLine2}>Please enter a different search term.</div>
        </div>
    );

    const locationList = baseData.map((location) => (
        <SummaryRecordItem
            key={location.location_value}
            locationData={location}
            locationType={selectedFilteredSummaryType}
            baseDataFullLength={baseDataFullLength}
        />
    ));

    return (
        <div className={styles.summaryOuterContainer}>
            <div className={styles.summaryInnerContainer}>
                <SummaryFilter
                    selectedFilteredSummaryType={selectedFilteredSummaryType}
                    onChangeLocationType={changeLocationTypeHandler}
                    onChangeSearchValue={changeSearchValueHandler}
                    searchTerm={searchTerm}
                />

                {baseDataFilteredLengthIsZero && noRecordsFound}
                {locationList}
            </div>
        </div>
    );
}

export default Summary;

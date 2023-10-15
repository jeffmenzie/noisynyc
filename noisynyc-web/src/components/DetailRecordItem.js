import React from "react";
import styles from "./DetailRecordItem.module.css";
import { Fragment } from "react";

function DetailRecordItem(props) {
    const complaintType = props.complaintType;
    const complaintRecords = props.recordData;

    const periods = props.recordData[0].complaint_quarter.split(",");

    periods.forEach((period, i) => {
        periods[i] = period.substring(3) + "/" + period.substring(0, 2);
    });

    const complaintRecordList = complaintRecords.map((record) => {
        const complaintArray = record.complaint_count.split(",");

        complaintArray.forEach((complaint, i) => {
            complaintArray[i] = parseInt(complaint).toLocaleString();
        });

        return (
            <Fragment>
                <div className={styles.descriptorFlexContainer}>
                    <div className={styles.descriptorFlexName}>{record.descriptor}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[0]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[0]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[1]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[1]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[2]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[2]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[3]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[3]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[4]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[4]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[5]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[5]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[6]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[6]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[7]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[7]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[8]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[8]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[9]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[9]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[10]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[10]}</div>
                    <div className={styles.descriptorFlexPeriod}>{periods[11]}</div>
                    <div className={styles.descriptorFlexItem}>{complaintArray[11]}</div>
                </div>
            </Fragment>
        );
    });

    return (
        <div className={styles.complaintTypeContainer}>
            <div className={styles.typeFlexContainer}>
                <div className={styles.typeFlexName}>{complaintType}</div>
                <div className={styles.typeFlexItem}>{periods[0]}</div>
                <div className={styles.typeFlexItem}>{periods[1]}</div>
                <div className={styles.typeFlexItem}>{periods[2]}</div>
                <div className={styles.typeFlexItem}>{periods[3]}</div>
                <div className={styles.typeFlexItem}>{periods[4]}</div>
                <div className={styles.typeFlexItem}>{periods[5]}</div>
                <div className={styles.typeFlexItem}>{periods[6]}</div>
                <div className={styles.typeFlexItem}>{periods[7]}</div>
                <div className={styles.typeFlexItem}>{periods[8]}</div>
                <div className={styles.typeFlexItem}>{periods[9]}</div>
                <div className={styles.typeFlexItem}>{periods[10]}</div>
                <div className={styles.typeFlexItem}>{periods[11]}</div>
            </div>
            {complaintRecordList}
        </div>
    );
}

export default DetailRecordItem;

import styles from "./AddressRecordItem.module.css";
import { Fragment } from "react";

function AddressRecordItem(props) {
    const complaintType = props.complaintType;
    const complaintRecords = props.recordData;
    const complaintRecordList = complaintRecords.map((record) => (
        <Fragment key={record.descriptor}>
            <div className={styles.complaintDescriptorFlexContainer}>
                <div className={styles.complaintDescriptorFlexName}>
                    <span className={styles.complaintDescriptorText}>{record.descriptor}</span>
                </div>

                <div className={styles.complaintDescriptorFlexItem}>
                    <span className={styles.complaintValueText}>{record.complaints_days_30}</span>
                </div>

                <div className={styles.complaintDescriptorFlexItem}>
                    <span className={styles.complaintValueText}>{record.complaints_years_1}</span>
                </div>

                <div className={styles.complaintDescriptorFlexItem}>
                    <span className={styles.complaintValueText}>{record.complaints_years_3}</span>
                </div>
            </div>
        </Fragment>
    ));

    return (
        <div>
            <div className={styles.complaintTypeContainer}>
                <div className={styles.complaintTypeFlexContainer}>
                    <div className={styles.complaintTypeFlexName}>
                        <span className={styles.complaintTypeText}>{complaintType}</span>
                    </div>

                    <div className={styles.complaintTypeFlexSpacer}>
                        <span className={styles.complaintTypeColumnText}>x</span>
                    </div>

                    <div className={styles.complaintTypeFlexItem}>
                        <span className={styles.complaintTypeColumnText}>30 Days</span>
                    </div>

                    <div className={styles.complaintTypeFlexItem}>
                        <span className={styles.complaintTypeColumnText}>1 Year</span>
                    </div>

                    <div className={styles.complaintTypeFlexItem}>
                        <span className={styles.complaintTypeColumnText}>3 Years</span>
                    </div>
                </div>

                {complaintRecordList}
            </div>
        </div>
    );
}

export default AddressRecordItem;

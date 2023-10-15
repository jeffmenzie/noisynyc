import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";
import styles from "./Detail.module.css";
import DetailRecordItem from "../components/DetailRecordItem";

function Detail(props) {
    const [loading, setLoading] = useState(false);

    let { locationType, locationValue } = useParams();

    const [detailData, setDetailData] = useState([]);

    useEffect(() => {
        const fetchDetailData = async () => {
            setLoading(true);

            const complaintDataRaw = await fetch(`/data/detail_data_${locationValue}.json`);

            const complaintData = await complaintDataRaw.json();

            setDetailData(complaintData);
            setLoading(false);
        };

        fetchDetailData();
    }, [locationValue]);

    const downloadFilePath =
        "/data/" +
        locationType.toUpperCase() +
        "_" +
        locationValue.toUpperCase() +
        ".xlsx";
    const downloadFileName =
        locationType.toUpperCase() + "_" + locationValue.toUpperCase();

    const complaintList = detailData.map((record) => (
        <DetailRecordItem
            key={record.complaint_type}
            complaintType={record.complaint_type}
            recordData={record.complaint_data}
        />
    ));

    return (
        <div className={styles.detailOuterContainer}>
            {loading && <LoadingOverlay />}

            <div className={styles.detailInnerContainer}>
                <div className={styles.objectContainer}>
                    <div className={styles.headerContainer}>
                        <div className={styles.detailHeader}>
                            {locationValue.toUpperCase().replace("_", " ")}
                        </div>

                        <div>
                            <div className={styles.actionButton}>
                                <Link
                                    replace={false}
                                    to="/Summary"
                                    style={{ textDecoration: "none" }}
                                >
                                    <span className={styles.actionButtonText}>Back to Summary</span>
                                </Link>
                            </div>

                            <a
                                className={styles.actionLink}
                                href={downloadFilePath}
                                download={downloadFileName}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div className={styles.actionButton}>Download Detail</div>
                            </a>
                        </div>
                    </div>

                    <div>{complaintList}</div>
                </div>
            </div>
        </div>
    );
}

export default Detail;

import { Link } from "react-router-dom";
import styles from "./SummaryRecordItem.module.css";
import SvgSummaryChart from "./SvgSummaryChart";

import { useLayoutEffect, useRef, useState } from "react";

function SummaryRecord(props) {
    const ref = useRef(null);

    const [containerWidth, setContainerWidth] = useState(0);

    useLayoutEffect(() => {
        setContainerWidth(ref.current.offsetWidth);

        const windowOrientation = window.matchMedia("(orientation: portrait)");

        const handleResize = () => {
            setContainerWidth(ref.current.offsetWidth);
        };

        window.addEventListener("resize", handleResize);
        windowOrientation.addEventListener("change", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            windowOrientation.addEventListener("change", handleResize);
        };
    }, [containerWidth]);

    const locationType = props.locationType;
    const locationData = props.locationData;

    const locationValue = locationData.location_value;
    const locationValueForUrl = locationValue.toString().toLowerCase().replace(" ", "_");
    const locationTypeForUrl = locationType.toString().toLowerCase().replace(" ", "_");

    const baseDataFullLength = props.baseDataFullLength;

    return (
        <div className={styles.recordContainer}>
            <div className={styles.locationHeaderContainer}>
                <div className={styles.recordItem50}>
                    <div className={styles.locationName}>{locationData.location_value}</div>
                </div>
                <div className={styles.recordItem50}>
                    <Link
                        className={styles.locationLink}
                        replace
                        to={`/detail/${locationTypeForUrl}/${locationValueForUrl}`}
                    >
                        {" "}
                        <span className={styles.locationLinkText}>View Detail</span>
                    </Link>
                </div>
            </div>

            <div className={styles.locationDataContainer}>
                <div className={styles.recordItem33}>
                    <div className={styles.periodContainer}>
                        <div className={styles.periodHeader}>30 DAY TREND</div>

                        <div className={styles.metricWrapper}>
                            <div className={styles.metricContainer}>
                                <div className={styles.metricValue}>
                                    {locationData.count_30day.toLocaleString()}
                                </div>
                                <div className={styles.metricDescription}>Complaints</div>
                            </div>

                            <div className={styles.metricContainer}>
                                <div className={styles.metricValue}>
                                    {Number(locationData.pct_tot_30day).toLocaleString("en-US", {
                                        style: "percent",
                                        minimumFractionDigits: 1,
                                    })}
                                </div>
                                <div className={styles.metricDescription}>Pct. of Total</div>
                            </div>

                            <div className={styles.metricContainer}>
                                <div className={styles.metricValue}>
                                    {locationData.rank_30day}/{baseDataFullLength}
                                </div>
                                <div className={styles.metricDescription}>Rank</div>
                            </div>
                        </div>
                        <div ref={ref} className={styles.svgContainer}>
                            <SvgSummaryChart
                                containerWidth={containerWidth}
                                detailPoints={locationData.detail_30day}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.recordItem33}>
                    <div className={styles.periodContainer}>
                        <div className={styles.periodHeader}>12 MONTH TREND</div>

                        <div className={styles.metricWrapper}>
                            <div className={styles.metricContainer}>
                                <div className={styles.metricValue}>
                                    {locationData.count_12month.toLocaleString()}
                                </div>
                                <div className={styles.metricDescription}>Complaints</div>
                            </div>

                            <div className={styles.metricContainer}>
                                <div className={styles.metricValue}>
                                    {Number(locationData.pct_tot_12month).toLocaleString("en-US", {
                                        style: "percent",
                                        minimumFractionDigits: 1,
                                    })}
                                </div>
                                <div className={styles.metricDescription}>Pct. of Total</div>
                            </div>

                            <div className={styles.metricContainer}>
                                <div className={styles.metricValue}>
                                    {locationData.rank_12month}/{baseDataFullLength}
                                </div>
                                <div className={styles.metricDescription}>Rank</div>
                            </div>
                        </div>
                        <div ref={ref} className={styles.svgContainer}>
                            <SvgSummaryChart
                                containerWidth={containerWidth}
                                detailPoints={locationData.detail_12month}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.recordItem33}>
                    <div className={styles.periodContainer}>
                        <div className={styles.periodHeader}>3 YEAR TREND</div>

                        <div className={styles.metricWrapper}>
                            <div className={styles.metricContainer}>
                                <div className={styles.metricValue}>
                                    {locationData.count_3year.toLocaleString()}
                                </div>
                                <div className={styles.metricDescription}>Complaints</div>
                            </div>

                            <div className={styles.metricContainer}>
                                <div className={styles.metricValue}>
                                    {Number(locationData.pct_tot_3year).toLocaleString("en-US", {
                                        style: "percent",
                                        minimumFractionDigits: 1,
                                    })}
                                </div>
                                <div className={styles.metricDescription}>Pct. of Total</div>
                            </div>

                            <div className={styles.metricContainer}>
                                <div className={styles.metricValue}>
                                    {locationData.rank_3year}/{baseDataFullLength}
                                </div>
                                <div className={styles.metricDescription}>Rank</div>
                            </div>
                        </div>
                        <div ref={ref} className={styles.svgContainer}>
                            <SvgSummaryChart
                                containerWidth={containerWidth}
                                detailPoints={locationData.detail_3year}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SummaryRecord;

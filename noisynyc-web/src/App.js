import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import About from "./pages/About";
import NavBar from "./components/NavBar";
import Summary from "./pages/Summary";
import Detail from "./pages/Detail";
import ByAddress from "./pages/ByAddress";
import Map from "./pages/Map";
import styles from "./App.module.css";
import LoadingOverlay from "./components/LoadingOverlay";

function App() {
    const [filteredSummaryType, setFilteredSummaryType] = useState("borough");
    const [baseDataFull, setBaseDataFull] = useState([]);
    const [baseDataFiltered, setBaseDataFiltered] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [baseDataFilteredLengthIsZero, setBaseDataFilteredLengthIsZero] = useState(false);
    const [summaryTypeLength, setSummaryTypeLength] = useState(0);
    const [loading, setLoading] = useState(false);
    const [mapPeriod, setMapPeriod] = useState("DAYS30");

    const initialLoad = useRef(true);

    const changeLocationTypeHandler = (locationType) => {
        setLoading(true);
        setFilteredSummaryType(locationType);
        setSearchTerm("");
        setBaseDataFilteredLengthIsZero(false);
        setSummaryTypeLength(baseDataFull[locationType].length);
        setLoading(false);
    };

    const changeMapPeriodHandler = (mapPeriod) => {
        setMapPeriod(mapPeriod);
    };

    const changeSearchValueHandler = (sv) => {
        setBaseDataFilteredLengthIsZero(false);
        setSearchTerm(sv);
        const searchValue = sv.toUpperCase();

        let resultCount = 0;

        const filterBySearch = (term) => {
            if (term.location_value.includes(searchValue)) {
                resultCount++;
                return true;
            }
        };

        const searchedBaseData = baseDataFull[filteredSummaryType].filter(filterBySearch);

        setBaseDataFiltered(searchedBaseData);

        if (searchedBaseData.length === 0) {
            setBaseDataFilteredLengthIsZero(true);
        }
    };

    useEffect(() => {
        const fetchBaseData = async () => {
            setLoading(true);

            const response = await fetch("/data/base_data.json");
            const responseData = await response.json();
            setBaseDataFull(responseData);
            setSummaryTypeLength(responseData[filteredSummaryType].length);
            setLoading(false);
        };

        fetchBaseData();
    }, [filteredSummaryType]);

    useEffect(() => {
        initialLoad.current
            ? (initialLoad.current = false)
            : setBaseDataFiltered(baseDataFull[filteredSummaryType]);
    }, [filteredSummaryType, baseDataFull]);

    return (
        <div>
            {loading && <LoadingOverlay />}
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate replace={true} to="/summary" />} />
                    <Route
                        path="summary"
                        element={
                            <Summary
                                selectedFilteredSummaryType={filteredSummaryType}
                                onChangeLocationType={changeLocationTypeHandler}
                                onChangeSearchValue={changeSearchValueHandler}
                                baseDataFiltered={baseDataFiltered}
                                baseDataFilteredLength={baseDataFiltered.length}
                                baseDataFilteredLengthIsZero={baseDataFilteredLengthIsZero}
                                baseDataFullLength={summaryTypeLength}
                                searchTerm={searchTerm}
                            />
                        }
                    ></Route>

                    <Route path="detail/:locationType/:locationValue" element={<Detail />} />
                    <Route
                        path="map"
                        element={
                            <Map mapPeriod={mapPeriod} onChangeMapPeriod={changeMapPeriodHandler} />
                        }
                    />
                    <Route path="adress" element={<ByAddress />} />
                    <Route path="about" element={<About />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </div>
    );
}

function Layout() {
    return (
        <div className={styles.appContainer}>
            <NavBar />
            <main>
                <Outlet />
            </main>
        </div>
    );
}

function NotFound() {
    return <div>Not found</div>;
}

export default App;

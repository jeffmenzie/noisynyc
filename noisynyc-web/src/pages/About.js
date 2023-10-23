import styles from "./About.module.css";

function About() {
    return (
        <div className={styles.aboutOuterContainer}>
            <div className={styles.aboutInnerContainer}>
                <div className={styles.objectContainer}>
                    <div className={styles.aboutQuestion}>Where does your data come from?</div>

                    <div className={styles.aboutResponse}>
                        New Yorkers lodge hundreds of thousands of noise complaints through 311 each
                        year. The city maintains and publicly makes these complaints available through {" "}
                        <a
                            className={styles.aboutLink}
                            href="https://data.cityofnewyork.us/browse?q=311"
                            target="_blank"
                        >
                            OpenData
                        </a>
                        . Sensitive fields like complainant and apartment number are
                        (understandably) not included, but basic attributes like location, date and
                        time of complaint, and type of noise complaint are included.
                        <br />
                        The author of this site was somewhat surprised when browsing through the
                        full data set to discover that over a quarter of all complaints lodged
                        through 311 are noise related. The large number of complaints suggests there
                        may also be an interest in viewing an aggregated form of the data.
                    </div>

                    <div className={styles.aboutQuestion}>
                        Are there any important caveats to be aware of?
                    </div>

                    <div className={styles.aboutResponse}>
                        It's important to understand that this site is not directly measuring the
                        level of noise, but rather uses the number of noise-related complaints as a
                        proxy for determining how noisy a location may be. Complaints for a given
                        location are heavily influenced by factors like population density and the
                        type of neighbordhood. For example, compare two neighborhoods, one
                        residential, the other light industrial. The former may be objectively quieter, but
                        because there's an expectaion of quietness, it may receive more complaints,
                        thus appearing to be noisier.
                    </div>

                    <div className={styles.aboutQuestion}>
                        How frequently is the source data updated?
                    </div>

                    <div className={styles.aboutResponse}>
                        Data is updated daily, though there may be a slight delay before new
                        complaints flow through to OpenData.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default About;

// One-quarter of all complaints received by 311 are noise related. Does not
// measure noise directly, but rather indirectly through complaints. Compare
// two neighborhoods, one residential, the other industrial. For former may be
// quieter, but because there's an expectaion of quietness, it may receive more
// complaints, thus appearing to be noisier.

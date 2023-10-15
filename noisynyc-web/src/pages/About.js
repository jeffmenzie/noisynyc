import styles from "./About.module.css";

function About() {
    return (
        <div className={styles.aboutOuterContainer}>
            <div className={styles.aboutInnerContainer}>
                <div className={styles.objectContainer}>
                    <div className={styles.aboutQuestion}>Here's the first question!</div>

                    <div className={styles.aboutResponse}>
                        One-quarter of all complaints received by 311 are noise related. Does not
                        measure noise directly, but rather indirectly through complaints. Compare
                        two neighborhoods, one residential, the other industrial. For former may be
                        quieter, but because there's an expectaion of quietness, it may receive more
                        complaints, thus appearing to be noisier.
                    </div>

                    <div className={styles.aboutQuestion}>Question2</div>

                    <div className={styles.aboutResponse}>Answer 2</div>
                </div>
            </div>
        </div>
    );
}

export default About;

import styles from "./LoadingOverlay.module.css";

const LoadingOverlay = (props) => {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.loadingText}>LOADING ...</div>
        </div>
    );
};

export default LoadingOverlay;

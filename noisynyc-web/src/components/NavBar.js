import { NavLink } from "react-router-dom";
import styles from "./NavBar.module.css";

function NavBar() {
    return (
        <div className={styles.navOuterContainer}>
            <div className={styles.navInnerContainer}>
                <li className={styles.navListItemLogo}>
                    <span className={styles.navListItemLogoThick}>Noisy</span>
                    <span className={styles.navListItemLogoThin}>NYC</span>
                </li>
                <div className={styles.navListItemMenuSpacer}>
                    <li className={styles.navListItemMenuOption}>
                        <NavLink
                            to="summary"
                            className={({ isActive }) =>
                                isActive ? styles.navButtonIsActive : styles.navButtonNotActive
                            }
                            replace
                        >
                            Summary
                        </NavLink>
                    </li>

                    <li className={styles.navListItemMenuOption}>
                        <NavLink
                            to="adress"
                            className={({ isActive }) =>
                                isActive ? styles.navButtonIsActive : styles.navButtonNotActive
                            }
                            replace
                        >
                            Address
                        </NavLink>
                    </li>

                    <li className={styles.navListItemMenuOption}>
                        <NavLink
                            to="map"
                            className={({ isActive }) =>
                                isActive ? styles.navButtonIsActive : styles.navButtonNotActive
                            }
                            replace
                        >
                            Map
                        </NavLink>
                    </li>

                    <li className={styles.navListItemMenuOption}>
                        <NavLink
                            to="about"
                            className={({ isActive }) =>
                                isActive ? styles.navButtonIsActive : styles.navButtonNotActive
                            }
                            replace
                        >
                            About
                        </NavLink>
                    </li>
                </div>
            </div>
        </div>
    );
}

export default NavBar;

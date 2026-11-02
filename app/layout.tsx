// app/layout.tsx
// The root layout wraps every page. Anything here appears on every route.

// Import React (needed for the JSX types below).
import React from "react";

// Import Next.js Metadata type and the Link component.
import type { Metadata } from "next";
import Link from "next/link";

// Import the CSS Module for this layout.
import styles from "./layout.module.css";

// ------------------------------------------------------------
// <head> content — rendered by Next.js into <head>.
// - title: "Child | Parent" (child first, parent second).
// - description: <meta name="description" content="...">.
// Next.js places <title> last in <head>, satisfying the rule.
// ------------------------------------------------------------
export const metadata: Metadata = {
    title: "Pokémon TCG Catalog | Master Setter",
    description:
        "Browse and search Pokémon Trading Card Game sets and cards in 14 languages.",
};

export default function RootLayout({ children, }: Readonly<{
    // `children` is whatever page is being rendered right now.
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body>
        {/* ------------------------------------------------------------
            #page-wrapper — required wrapper around EVERYTHING in <body>.
            Width 80 %, centered horizontally, antiquewhite background.
        ------------------------------------------------------------ */}
        <div id="page-wrapper">

            {/* ------------------------------------------------------------
                <header> section — required by the rubric.
                Contains the site title (<h1>) and a subtitle (<p>).
                On 750–1000 px screens its contents are centered with
                `margin: 0 auto` (styled in layout.module.css).
            ------------------------------------------------------------ */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.headerTitle}>Pokémon TCG Catalog</h1>
                    <p className={styles.headerSubtitle}>
                        <em>A Master Setter API browser</em>
                    </p>
                </div>
            </header>

            {/* ------------------------------------------------------------
                #container — required wrapper around <nav> and <main>.
                Width 100 %, display: flex. Nav is 30 %, main is 70 %.
                Height lives here so the page stretches vertically.
            ------------------------------------------------------------ */}
            <div id="container">
                {/* Top navigation bar. Appears on every page. */}
                <nav className={styles.nav}>
                    {/* nav is now <ul> > <li> > <a> per the rubric.
                        Each <li> is an explicit block (or inline-block on
                        mobile) so we can apply the button-like styles the
                        rubric describes (display, spacing, text-decoration). */}
                    <ul className={styles.navList}>
                        <li className={styles.navItem}>
                            <Link href="/" className={styles.navLink}>
                                Sets
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link href="/search" className={styles.navLink}>
                                Search Cards
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* The current page is injected here. Each page renders its
                    own <main>, which becomes #container's second child. */}
                {children}
            </div>

            {/* ------------------------------------------------------------
                <footer> section — required by the rubric.
                Contains the conventional "All rights reserved" line
                with a Credits link and the © symbol (&#169;).
            ------------------------------------------------------------ */}
            <footer className={styles.footer}>
                <p className={styles.footerText}>
                    All rights reserved:{" "}
                    <a href="" className={styles.footerLink}>
                        Credits
                    </a>{" "}
                    &#169;
                </p>
            </footer>

        </div>
        </body>
        </html>
    );
}
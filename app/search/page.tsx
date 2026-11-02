// app/search/page.tsx
// Server Component.
// Uses: GET /v1/cards?q=<query>&lang=<lang>&limit=20

// Import Suspense so the dynamic data-fetching child can stream in.
import { Suspense } from "react";

// Import the search function, the card type, and the shared language list.
import { searchCards, PokemonCard, LANGUAGES } from "@/lib/api";

// Import the reusable card component.
import DataCard from "@/components/DataCard";

// Import Link for the "back to home" navigation.
import Link from "next/link";

// Import the CSS Module for THIS page (not setDetail.module.css!).
import styles from "./search.module.css";

export default function SearchPage({
                                       searchParams,
                                   }: {
    // Do NOT await searchParams here. Pass the Promise down instead.
    searchParams: Promise<{ q?: string; lang?: string }>;
}) {
    return (
        <main className={styles.main}>
            {/* Static shell — renders instantly. */}
            <h1 className={styles.heading}>Search Pokémon Cards</h1>
            <p className={styles.hint}>
                Card names are stored in each card's own language. Search "Pikachu" in
                English, or "ピカチュウ" in Japanese.
            </p>

            {/*
                Wrap the uncached data fetch in Suspense.
                The page shell prerenders; only the search results stream in.
            */}
            <Suspense fallback={<p>Searching…</p>}>
                <SearchResults searchParams={searchParams} />
            </Suspense>

            <Link href="/" className={styles.backLink}>
                ← Back to Home
            </Link>
        </main>
    );
}

async function SearchResults({
                                 searchParams,
                             }: {
    searchParams: Promise<{ q?: string; lang?: string }>;
}) {
    // Await the Promise INSIDE the Suspense boundary.
    const { q: qParam, lang: langParam } = await searchParams;

    // Defaults so the page works even with no query string.
    const q = qParam || "Pikachu";
    const lang = langParam || "en";

    // Data + error holders.
    let cards: PokemonCard[] = [];
    let errorMessage: string | null = null;

    try {
        cards = await searchCards(q, lang, 20);
    } catch (err: any) {
        errorMessage = err.message || "An unknown error occurred during search.";
    }

    return (
        <>
            {/* Search form. Both q and lang become URL parameters. */}
            <form action="/search" method="GET" className={styles.searchForm}>
                <input
                    type="text"
                    name="q"
                    placeholder="e.g., Pikachu, Charizard..."
                    defaultValue={q}
                    className={styles.searchInput}
                />
                <select
                    name="lang"
                    defaultValue={lang}
                    className={styles.searchSelect}
                >
                    {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                            {l.label}
                        </option>
                    ))}
                </select>
                <button type="submit" className={styles.searchButton}>
                    Search
                </button>
            </form>

            {/* Error banner. */}
            {errorMessage && (
                <div className={styles.errorBox}>
                    <p className={styles.errorText}>⚠️ {errorMessage}</p>
                </div>
            )}

            {/* Result list. */}
            <div className={styles.results}>
                <h2>
                    Results for "{q}" ({lang})
                </h2>

                {cards.length > 0 ? (
                    cards.map((card) => (
                        <DataCard
                            key={card.id}
                            title={card.name}
                            subtitle={`#${card.number} • ${
                                card.rarity ?? "Unknown rarity"
                            } • ${card.id}`}
                            // NEW: opt this card into the image + info UX.
                            // DataCard uses this name to fetch a Wikipedia
                            // thumbnail and a short summary client-side.
                            pokemonName={card.name}
                        />
                    ))
                ) : (
                    !errorMessage && <p>No cards found for "{q}".</p>
                )}
            </div>
        </>
    );
}
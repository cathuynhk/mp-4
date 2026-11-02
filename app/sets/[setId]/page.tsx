// app/sets/[setId]/page.tsx
// Dynamic route. The folder name [setId] captures the URL segment.
// Example URL: /sets/en-base1  →  params.setId === "en-base1"
// Uses: GET /v1/sets?id=en-base1 and GET /v1/cards?set=en-base1

// Import Suspense so the dynamic data-fetching child can stream in.
import { Suspense } from "react";

// Import the two server-side functions we need plus their types.
import {
    fetchSet,
    fetchCardsInSet,
    PokemonSet,
    PokemonCard,
} from "@/lib/api";

// Import the reusable card component for the card list.
import DataCard from "@/components/DataCard";

// Import Link for the "back to all sets" navigation.
import Link from "next/link";

// Import the CSS Module for THIS page (not search.module.css!).
import styles from "./setDetail.module.css";

export default function SetDetailPage({
                                          params,
                                      }: {
    // Do NOT await params here. Pass the Promise down instead.
    params: Promise<{ setId: string }>;
}) {
    return (
        <main className={styles.main}>
            {/* notice shown at the top of every set page.
                Kept OUTSIDE <Suspense> so it renders in the static shell
                immediately, before the set data starts streaming. */}
            <p className={styles.loadNote}>
                Note: The page may take a while to load Pokemon data.
                If the page does not load within one minute, please refresh the page.
            </p>

            {/* Static back link — visible instantly, even while the set loads. */}
            <Link href="/" className={styles.backLink}>
                ← Back to all sets
            </Link>

            {/*
                Wrap the uncached data fetch in Suspense.
                The page shell prerenders; only the set content streams in.
            */}
            <Suspense fallback={<p>Loading set…</p>}>
                <SetDetailContent params={params} />
            </Suspense>
        </main>
    );
}

async function SetDetailContent({
                                    params,
                                }: {
    params: Promise<{ setId: string }>;
}) {
    // Await params INSIDE the Suspense boundary.
    const { setId } = await params;

    // Data + error holders.
    let setData: PokemonSet | null = null;
    let cards: PokemonCard[] = [];
    let errorMessage: string | null = null;

    // --- get_set: GET /v1/sets?id=<setId> ---
    try {
        setData = await fetchSet(setId);
    } catch (err: any) {
        errorMessage = err.message || "Failed to load set.";
    }

    // --- list_cards_in_set: GET /v1/cards?set=<setId> ---
    // Only fetch the cards if the set itself loaded successfully.
    if (!errorMessage && setData) {
        try {
            cards = await fetchCardsInSet(setId, 60);
        } catch (err: any) {
            errorMessage = err.message || "Failed to load cards for this set.";
        }
    }

    // --- Render: any API error ---
    if (errorMessage) {
        return (
            <>
                <h1 className={styles.heading}>Set: {setId}</h1>
                <div className={styles.errorBox}>
                    <p className={styles.errorText}>⚠️ {errorMessage}</p>
                </div>
            </>
        );
    }

    // --- Render: set not found (no error, but null data) ---
    if (!setData) {
        return (
            <>
                <h1 className={styles.heading}>Set not found</h1>
                <p>No set exists with ID "{setId}".</p>
            </>
        );
    }

    // --- Render: success ---
    return (
        <>
            {/* Set metadata. Each optional field is only rendered if present. */}
            <h1 className={styles.heading}>{setData.name}</h1>
            <p className={styles.description}>
                ID: <code>{setData.id}</code>
                {setData.series && <> • Series: {setData.series}</>}
                {setData.card_count != null && <> • {setData.card_count} cards</>}
                {setData.total != null && <> • Total: {setData.total}</>}
                {setData.printed_total != null && (
                    <> • Printed: {setData.printed_total}</>
                )}
                {setData.release_date && <> • Released: {setData.release_date}</>}
            </p>

            <h2 className={styles.subheading}>Cards in this set</h2>

            {cards.length === 0 ? (
                <p>No cards were returned for this set.</p>
            ) : (
                <div className={styles.list}>
                    {cards.map((card) => (
                        <DataCard
                            key={card.id}
                            title={card.name}
                            subtitle={`#${card.number} • ${
                                card.rarity ?? "Unknown rarity"
                            } • ${card.id}`}
                            // opt this card into the image + info UX.
                            // DataCard uses this name to fetch the official
                            // Pokémon.com artwork and PokéAPI flavor text.
                            pokemonName={card.name}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
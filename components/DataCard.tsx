// components/DataCard.tsx

"use client";
// This component is a Client Component because it uses React state (useState),
// side effects (useEffect), and browser APIs (IntersectionObserver, fetch to Wikipedia).
// The parent pages are Server Components and pass
// plain props down — the API key is never exposed to this file.

// Import the React hooks we need.
// - useState: track the wiki data, loading flag, and pinned state.
// - useEffect: kick off the wiki fetch and set up the IntersectionObserver.
// - useRef: get a DOM handle on the card so the observer can watch it.
import { useState, useEffect, useRef } from "react";

// Import Next.js's Link component for client-side navigation.
import Link from "next/link";

// Import the CSS Module that scopes all styles to this component.
import styles from "./DataCard.module.css";

// ------------------------------------------------------------
// 1. Shape of the data we cache for each Pokémon.
//    - image:        direct URL to Pokémon.com’s official artwork.
//    - extract:      official English flavor text from PokéAPI.
//    - pokedexNumber: National Pokédex number (used to build the URL).
// ------------------------------------------------------------
type PokemonInfo = {
    image: string | null;
    extract: string | null;
    pokedexNumber: number | null;
};

// ------------------------------------------------------------
// 2. Module-level cache keyed by the original card name.
//    Prevents re-fetching the same Pokémon when cards remount.
// ------------------------------------------------------------
const pokemonCache = new Map<string, PokemonInfo>();

// ------------------------------------------------------------
// 3. Normalize a card name into PokéAPI slugs.
//    TCG names include suffixes ("ex", "VMAX"), punctuation
//    ("Mr. Mime", "Farfetch'd"), and gender symbols ("Nidoran♀").
//    PokéAPI uses lowercase-hyphenated slugs.
// ------------------------------------------------------------
function buildSlugCandidates(name: string): string[] {
    const candidates: string[] = [];

    // (a) Original, lowercased, spaces → hyphens.
    const base = name.toLowerCase().trim().replace(/\s+/g, "-");

    // (b) Strip common TCG battle suffixes.
    const withoutSuffix = base.replace(
        /-(ex|gx|v|vmax|vstar|v-union|lv\.x|δ)$/i,
        ""
    );

    // (c) Remove apostrophes / periods (PokéAPI omits them)
    //     and convert gender symbols to PokéAPI’s suffixes.
    const cleaned = withoutSuffix
        .replace(/['’.]/g, "")
        .replace(/♀/g, "-f")
        .replace(/♂/g, "-m");

    candidates.push(cleaned);
    // Fallback: some older entries use no hyphens at all.
    candidates.push(cleaned.replace(/-/g, ""));

    // (d) If the name has a form prefix (Alolan, Galarian, …),
    //     also try the base species slug.
    const formMatch = cleaned.match(
        /^(alolan|galarian|hisuian|paldean|mega|origin|altered|therian|incarnate|shadow|purified)-(.+)$/
    );
    if (formMatch) {
        candidates.push(formMatch[2]);
    }

    // De-duplicate while preserving order.
    return [...new Set(candidates)];
}

// ------------------------------------------------------------
// 4. Fetch National Pokédex number + English flavor text
//    from PokéAPI, then build the Pokémon.com image URL.
// ------------------------------------------------------------
async function fetchPokemonInfo(name: string): Promise<PokemonInfo> {
    // Fast path: already cached.
    const cached = pokemonCache.get(name);
    if (cached) return cached;

    const slugs = buildSlugCandidates(name);

    // Try each slug variant until one succeeds.
    for (const slug of slugs) {
        if (!slug) continue;
        try {
            const res = await fetch(
                `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(slug)}`
            );
            if (!res.ok) continue; // 404 → try the next slug variant.

            const data = await res.json();

            // ----------------------------------------------------
            // 4a. Extract the first English flavor-text entry.
            //     PokéAPI returns entries per language; we want “en”.
            //     Newlines and form-feed characters are replaced with
            //     spaces so the text flows naturally in the card.
            // ----------------------------------------------------
            const englishEntry = (data.flavor_text_entries ?? []).find(
                (e: any) => e.language?.name === "en"
            );
            const extract = englishEntry
                ? englishEntry.flavor_text.replace(/[\n\f]/g, " ").trim()
                : null;

            // ----------------------------------------------------
            // 4b. National Pokédex number.
            //     For `/pokemon-species/{slug}`, `data.id` **is**
            //     the National Dex number (e.g. Exeggcute → 102).
            // ----------------------------------------------------
            const pokedexNumber: number | null = data.id ?? null;

            // ----------------------------------------------------
            // 4c. Build the official Pokémon.com artwork URL.
            //     Pattern confirmed from Pokémon.com’s static assets:
            //     https://www.pokemon.com/static-assets/content-assets/
            //       cms2/img/pokedex/full/{3‑digit number}.png
            //     Example: Exeggcute (102) → …/full/102.png
            //     Numbers are zero-padded to 3 digits (25 → 025).
            // ----------------------------------------------------
            const image = pokedexNumber
                ? `https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/${String(
                    pokedexNumber
                ).padStart(3, "0")}.png`
                : null;

            const info: PokemonInfo = { image, extract, pokedexNumber };
            pokemonCache.set(name, info);
            return info;
        } catch {
            // Network / JSON error → try the next slug.
        }
    }

    // Nothing resolved — cache the empty result so we do not retry.
    const empty: PokemonInfo = {
        image: null,
        extract: null,
        pokedexNumber: null,
    };
    pokemonCache.set(name, empty);
    return empty;
}

// ------------------------------------------------------------
// 5. Component props (unchanged).
// ------------------------------------------------------------
type DataCardProps = {
    title: string;
    subtitle?: string;
    href?: string;
    pokemonName?: string;
};

export default function DataCard({
                                     title,
                                     subtitle,
                                     href,
                                     pokemonName,
                                 }: DataCardProps) {
    const [info, setInfo] = useState<PokemonInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [pinned, setPinned] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // ------------------------------------------------------------
    // 6. Load PokéAPI data when the card scrolls near the viewport.
    //    Cached entries resolve immediately without a network call.
    // ------------------------------------------------------------
    useEffect(() => {
        if (!pokemonName) return;

        const cached = pokemonCache.get(pokemonName);
        if (cached) {
            setInfo(cached);
            return;
        }

        const el = cardRef.current;
        if (!el) return;

        let cancelled = false;

        const load = () => {
            setLoading(true);
            fetchPokemonInfo(pokemonName).then((result) => {
                if (!cancelled) {
                    setInfo(result);
                    setLoading(false);
                }
            });
        };

        // Fallback for environments without IntersectionObserver.
        if (typeof IntersectionObserver === "undefined") {
            load();
            return () => {
                cancelled = true;
            };
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    observer.disconnect();
                    load();
                }
            },
            { rootMargin: "300px" }
        );
        observer.observe(el);

        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [pokemonName]);

    const interactive = Boolean(pokemonName && !href);

    const handleClick = (e: React.MouseEvent) => {
        if (!interactive) return;
        e.preventDefault();
        setPinned((v) => !v);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPinned((v) => !v);
        }
    };

    const hasImage = Boolean(pokemonName);
    const hasInfo = Boolean(info?.extract);

    // ------------------------------------------------------------
    // 7. Build the visual content of the card once.
    //    This same block is reused whether wrapped in <Link> or not.
    // ------------------------------------------------------------
    const inner = (
        <div
            ref={cardRef}
            className={[
                styles.card,
                hasImage ? styles.hasImage : "",
                pinned ? styles.pinned : "",
            ]
                .filter(Boolean)
                .join(" ")}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-expanded={interactive ? pinned : undefined}
        >
            {/* ------------------------------------------------------------
                Image panel — now points at Pokémon.com official artwork.
                The URL is constructed in fetchPokemonInfo() above.
            ------------------------------------------------------------ */}
            {hasImage && (
                <div className={styles.imageWrapper}>
                    {info?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={info.image}
                            alt={pokemonName}
                            className={styles.pokemonImage}
                            loading="lazy"
                        />
                    ) : (
                        // Placeholder while loading, or when no image exists.
                        <div className={styles.imagePlaceholder}>
                            {loading ? "…" : "?"}
                        </div>
                    )}
                </div>
            )}

            {/* ------------------------------------------------------------
                Text column — title, subtitle, and the collapsible info block.
            ------------------------------------------------------------ */}
            <div className={styles.text}>
                <h3 className={styles.title}>{title}</h3>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

                {/* Collapsible info panel (hover or click to expand). */}
                {hasImage && (
                    <div className={styles.info}>
                        {hasInfo ? (
                            <p className={styles.extract}>{info?.extract}</p>
                        ) : loading ? (
                            <p className={styles.extract}>Loading description…</p>
                        ) : (
                            <p className={styles.extract}>
                                No description found for “{pokemonName}”.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // ------------------------------------------------------------
    // 8. If an href was provided, wrap the card in a Link for navigation.
    // ------------------------------------------------------------
    if (href) {
        return (
            <Link href={href} className={styles.linkWrapper}>
                {inner}
            </Link>
        );
    }

    // Otherwise, return the plain card (may still be interactive for expand).
    return inner;
}
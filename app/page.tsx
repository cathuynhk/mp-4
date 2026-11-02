// app/page.tsx
import { Suspense } from "react";
import { fetchSets, PokemonSet, LANGUAGES } from "@/lib/api";
import DataCard from "@/components/DataCard";
import styles from "./page.module.css";

export default function Home({
                                 searchParams,
                             }: {
    // Do NOT await searchParams here. Pass the Promise down instead.
    searchParams: Promise<{ lang?: string }>;
}) {
    return (
        <main className={styles.main}>
            <h1 className={styles.heading}>Pokémon TCG Sets</h1>
            <p className={styles.description}>
                Browse the newest sets. The free tier supports English; other
                languages require a paid plan — try them to see how the API responds.
            </p>

            {/*
                The form still submits as GET, so the URL becomes /?lang=<code>.
                The static shell (heading, description, form) renders instantly.
            */}
            <form action="/" method="GET" className={styles.langForm}>
                <label htmlFor="lang" className={styles.langLabel}>
                    Language:
                </label>
                <select
                    id="lang"
                    name="lang"
                    // We cannot know the selected lang without awaiting.
                    // Use "en" as the default in the static shell.
                    defaultValue="en"
                    className={styles.langSelect}
                >
                    {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                            {l.label}
                        </option>
                    ))}
                </select>
                <button type="submit" className={styles.langButton}>
                    Load
                </button>
            </form>

            {/*
                Pass the searchParams Promise into the child.
                The child awaits it inside this Suspense boundary.
            */}
            <Suspense fallback={<p>Loading sets…</p>}>
                <SetsList searchParams={searchParams} />
            </Suspense>
        </main>
    );
}

async function SetsList({
                            searchParams,
                        }: {
    searchParams: Promise<{ lang?: string }>;
}) {
    // Await the Promise here, INSIDE the Suspense boundary.
    const { lang: langParam } = await searchParams;
    const lang = langParam || "en";

    let sets: PokemonSet[] = [];
    let errorMessage: string | null = null;

    try {
        sets = await fetchSets(lang, 10);
    } catch (err: any) {
        errorMessage = err.message || "An unknown error occurred.";
    }

    if (errorMessage) {
        return (
            <div className={styles.errorBox}>
                <p className={styles.errorText}>⚠️ {errorMessage}</p>
                <p>Please check your API key or try again later.</p>
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {sets.length === 0 ? (
                <p>No sets returned for "{lang}".</p>
            ) : (
                sets.map((set) => (
                    <DataCard
                        key={set.id}
                        title={set.name}
                        subtitle={`${set.id}${set.total ? ` • ${set.total} cards` : ""}`}
                        href={`/sets/${encodeURIComponent(set.id)}`}
                    />
                ))
            )}
        </div>
    );
}
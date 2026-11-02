// lib/api.ts
// Server-only. Never imported by a Client Component.
// Every function below hits an endpoint that has been confirmed with curl.

// ------------------------------------------------------------
// 1. Types matching the real JSON shapes returned by the API.
//    All list responses share: { data: [...], pagination: {...} }.
// ------------------------------------------------------------
export type PokemonSet = {
    id: string;                // e.g. "en-base1", "ko-sv4a"
    name: string;
    name_en?: string | null;
    series?: string;
    release_date?: string;
    total?: number;
    printed_total?: number;
    language?: string;
    logo_url?: string | null;
    symbol_url?: string | null;
    card_count?: number;       // Only returned by GET /v1/sets?id=...
};

export type PokemonCard = {
    id: string;                // e.g. "en-base1-58"
    set_id: string;
    number: string;
    local_id?: string;
    name: string;
    supertype?: string;
    subtypes?: string[] | null;
    hp?: number | null;
    types?: string[] | null;
    rarity?: string | null;
    artist?: string | null;
    regulation_mark?: string | null;
    image_small?: string | null;
    image_large?: string | null;
    updated_at?: string;
    variants?: string[];       // Only returned by GET /v1/cards?id=...
};

// ------------------------------------------------------------
// 2. Supported languages (single source of truth for the UI).
//    Every language code here is accepted by the API's ?lang=
// ------------------------------------------------------------
export const LANGUAGES = [
    { code: "en",    label: "English" },
    { code: "ja",    label: "Japanese" },
    { code: "ko",    label: "Korean" },
    { code: "zh-tw", label: "Chinese (Traditional)" },
    { code: "zh-cn", label: "Chinese (Simplified)" },
    { code: "th",    label: "Thai" },
    { code: "id",    label: "Indonesian" },
    { code: "fr",    label: "French" },
    { code: "it",    label: "Italian" },
    { code: "de",    label: "German" },
    { code: "es",    label: "Spanish" },
    { code: "pt",    label: "Portuguese" },
    { code: "es-mx", label: "Spanish (Mexico)" },
    { code: "ru",    label: "Russian" },
    { code: "pl",    label: "Polish" },
    { code: "nl",    label: "Dutch" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

// ------------------------------------------------------------
// 3. Base URL and auth header.
//    The API expects the key as: Authorization: Bearer <key>
// ------------------------------------------------------------
const API_BASE_URL = "https://api.master-setter.com/v1";

const getHeaders = (): HeadersInit => {
    const apiKey = process.env.MASTER_SETTER_API_KEY;
    if (!apiKey) {
        throw new Error("MASTER_SETTER_API_KEY is missing. Check .env.local.");
    }
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    };
};

// ------------------------------------------------------------
// 4. Shared fetch helper.
//    - cache: "no-store" forces fresh SSR data on every request.
//    - Non-2xx responses become thrown errors caught by page components.
// ------------------------------------------------------------
async function safeFetch(url: string): Promise<any> {
    const response = await fetch(url, {
        headers: getHeaders(),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            `API error ${response.status} ${response.statusText} — ${url}`
        );
    }

    return response.json();
}

// ------------------------------------------------------------
// 5. list_sets — GET /v1/sets?lang=en&limit=10
//    Returns sets newest first.
// ------------------------------------------------------------
export async function fetchSets(
    lang: string = "en",
    limit: number = 10
): Promise<PokemonSet[]> {
    const url = `${API_BASE_URL}/sets?lang=${encodeURIComponent(lang)}&limit=${limit}`;
    const json = await safeFetch(url);
    return json.data ?? [];
}

// ------------------------------------------------------------
// 6. get_set — GET /v1/sets?id=en-base1
//    Returns one set. The API may wrap the object in `data`.
// ------------------------------------------------------------
export async function fetchSet(setId: string): Promise<PokemonSet | null> {
    const url = `${API_BASE_URL}/sets?id=${encodeURIComponent(setId)}`;
    const json = await safeFetch(url);

    if (Array.isArray(json.data)) {
        return json.data[0] ?? null;
    }
    return json.data ?? json;
}

// ------------------------------------------------------------
// 7. list_cards_in_set — GET /v1/cards?set=en-base1&limit=60
// ------------------------------------------------------------
export async function fetchCardsInSet(
    setId: string,
    limit: number = 60
): Promise<PokemonCard[]> {
    const url = `${API_BASE_URL}/cards?set=${encodeURIComponent(setId)}&limit=${limit}`;
    const json = await safeFetch(url);
    return json.data ?? [];
}

// ------------------------------------------------------------
// 8. search_cards — GET /v1/cards?q=pikachu&lang=en&limit=20
// ------------------------------------------------------------
export async function searchCards(
    q: string,
    lang: string = "en",
    limit: number = 20
): Promise<PokemonCard[]> {
    const url = `${API_BASE_URL}/cards?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}&limit=${limit}`;
    const json = await safeFetch(url);
    return json.data ?? [];
}

// ------------------------------------------------------------
// 9. get_card — GET /v1/cards?id=en-base1-4
//    Defined for completeness. Not used in the current pages.
// ------------------------------------------------------------
export async function fetchCard(
    cardId: string
): Promise<PokemonCard | null> {
    const url = `${API_BASE_URL}/cards?id=${encodeURIComponent(cardId)}`;
    const json = await safeFetch(url);

    if (Array.isArray(json.data)) {
        return json.data[0] ?? null;
    }
    return json.data ?? json;
}
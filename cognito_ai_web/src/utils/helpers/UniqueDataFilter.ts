export type UniqueByKeysOptions<T> = {
    prefer?: "first" | "last";
    resolver?: (current: T, next: T) => T;
};

export function uniqueByKeys<T>(
    items: T[],
    keys: string[],
    options: UniqueByKeysOptions<T> = {}
): T[] {
    const { prefer = "first", resolver } = options;
    if (!Array.isArray(items)) throw new TypeError("items must be an array");
    if (!Array.isArray(keys) || keys.length === 0)
        throw new TypeError("keys must be a non-empty array of strings");

    const map = new Map<string, T>();

    for (const item of items) {
        const vals = keys.map((k) => getByPath(item, k));
        const compoundKey = stableKey(vals);

        if (map.has(compoundKey)) {
            const current = map.get(compoundKey)!;
            map.set(
                compoundKey,
                resolver ? resolver(current, item) : prefer === "last" ? item : current
            );
        } else {
            map.set(compoundKey, item);
        }
    }

    return Array.from(map.values());
}

/* ---------- helpers ---------- */

function getByPath(obj: unknown, path: string | undefined | null): unknown {
    if (obj == null) return undefined;
    if (!path) return undefined;
    const segments = String(path)
        .replace(/\[(\w+)\]/g, ".$1")
        .replace(/^\./, "")
        .split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = obj;
    for (const seg of segments) {
        if (cur == null) return undefined;
        cur = cur[seg as keyof typeof cur];
    }
    return cur;
}

function stableKey(values: unknown[]): string {
    return JSON.stringify(
        values.map((v) => {
            if (typeof v === "number" && Number.isNaN(v)) return { t: "number", v: "NaN" };
            if (typeof v === "number" && !Number.isFinite(v)) return { t: "number", v: String(v) };
            if (Object.is(v, -0)) return { t: "number", v: "-0" };
            if (v instanceof Date) return { t: "date", v: v.toISOString() };
            const t = v === null ? "null" : typeof v;
            if (t === "object") return { t, v: JSON.stringify(v) };
            return { t, v };
        })
    );
}

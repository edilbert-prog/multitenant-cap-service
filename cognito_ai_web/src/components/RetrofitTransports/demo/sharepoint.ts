export function buildDownloadUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  if (!url.searchParams.has("download")) {
    url.searchParams.set("download", "1");
  }
  return url.toString();
}

export function directStreamDownload(rawUrl: string): void {
  const href = buildDownloadUrl(rawUrl);
  const a = document.createElement("a");
  a.href = href;
  a.setAttribute("download", "");
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadViaFetch(rawUrl: string, filename?: string): Promise<{ filename: string; blob: Blob }>
{
  const href = buildDownloadUrl(rawUrl);
  const resp = await fetch(href);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Download failed: ${resp.status} ${text}`);
  }

  const blob = await resp.blob();
  const cd = resp.headers.get("Content-Disposition") || "";
  const cdMatch = cd.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)/i);
  const inferred = cdMatch?.[1]
    ? decodeURIComponent(cdMatch[1].replace(/^UTF-8''/, "").replace(/"/g, ""))
    : (() => {
        try {
          const u = new URL(href);
          const last = u.pathname.split("/").filter(Boolean).pop() || "download.bin";
          return last.includes(".") ? last : filename ?? "download.bin";
        } catch {
          return filename ?? "download.bin";
        }
      })();

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename ?? inferred;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);

  return { filename: filename ?? inferred, blob };
}

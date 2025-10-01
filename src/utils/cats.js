// src/utils/cats.js
// Build right-sized Cataas URLs and preload them with <img>

export function sizeForContainer(containerEl) {
  const rect = containerEl?.getBoundingClientRect?.() || { width: 360 };
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR to avoid huge files
  const w = Math.min(900, Math.ceil(rect.width * dpr));  // cap width for bandwidth
  const h = Math.ceil(w * (4 / 3));                      // 3:4 aspect ratio
  return { w, h };
}

function cataasUrl(i, w, h) {
  // Random string avoids caching the same image
  const rnd = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;
  return `https://cataas.com/cat?width=${w}&height=${h}&random=${rnd}`;
}

// Preload an image with timeout
function preload(url, timeoutMs = 7000) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;

    const finish = (ok) => {
      if (!done) {
        done = true;
        resolve(ok ? url : null);
      }
    };

    const timer = setTimeout(() => finish(false), timeoutMs);

    img.onload = () => { clearTimeout(timer); finish(true); };
    img.onerror = () => { clearTimeout(timer); finish(false); };
    img.referrerPolicy = "no-referrer";
    img.decoding = "async";
    try { img.fetchPriority = "high"; } catch {}
    img.loading = "eager";
    img.src = url;
  });
}

/**
 * Generate + preload a batch of cat image URLs.
 *
 * @param {number} start   starting index for randomness seed
 * @param {number} count   how many to try
 * @param {number} w       target width
 * @param {number} h       target height
 * @returns {Promise<string[]>} Array of successfully preloaded cat image URLs
 */
export async function progressiveLoadCats(start, count, w, h) {
  const urls = Array.from({ length: count }, (_, k) => cataasUrl(start + k, w, h));

  // Try to preload each image
  const results = await Promise.allSettled(urls.map(preload));

  // Keep only successfully preloaded URLs
  const loaded = results
    .map((res, i) => (res.status === "fulfilled" && res.value ? urls[i] : null))
    .filter(Boolean);

  // If none loaded, fall back to the original URLs (so app doesn't break)
  return loaded.length > 0 ? loaded : urls;
}

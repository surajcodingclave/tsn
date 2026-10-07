/**
 * Server-side address -> lat/lng using the Google Geocoding API.
 * Requires GOOGLE_GEOCODE_API_KEY. Returns { lat, lng } or null on failure.
 */
export async function geocodeAddress(address) {
  const key = process.env.GOOGLE_GEOCODE_API_KEY;
  if (!key || !address) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${key}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    if (data.status === "OK" && data.results?.length) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (err) {
    console.error("geocode error:", err?.message);
    return null;
  }
}
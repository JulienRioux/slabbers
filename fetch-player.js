async function fetchNhlPlayerByName(query) {
  if (!query || typeof query !== "string") {
    throw new Error("Query must be a non-empty string");
  }

  const headers = {
    Accept: "application/json",
    "User-Agent": "tool-rent-slabbers/1.0 (+node)",
  };

  async function fetchJson(url) {
    const res = await fetch(url, { headers });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}: ${text.slice(0, 300)}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 300)}`);
    }
  }

  // 1️⃣ Search player by name (grab more than 1 result; API can return unexpected shapes)
  const searchUrl =
    `https://search.d3.nhle.com/api/v1/search/player` +
    `?culture=en-us&limit=20&q=${encodeURIComponent(query.trim())}`;

  const searchData = await fetchJson(searchUrl);

  const docs =
    (Array.isArray(searchData?.docs) && searchData.docs) ||
    (Array.isArray(searchData?.results) && searchData.results) ||
    (Array.isArray(searchData) && searchData) ||
    [];

  if (!docs.length) {
    throw new Error(
      `Player not found (no search results). Response keys: ${Object.keys(
        searchData ?? {}
      ).join(", ")}`
    );
  }

  const qNorm = query.trim().toLowerCase();
  const player =
    docs.find((d) => {
      const full = `${d?.firstName ?? ""} ${d?.lastName ?? ""}`
        .trim()
        .toLowerCase();
      const name = String(d?.name ?? "")
        .trim()
        .toLowerCase();
      return full === qNorm || name === qNorm;
    }) || docs[0];

  const playerId = player.playerId ?? player?.id ?? player?.playerID;
  if (!playerId) {
    throw new Error(
      `Search result missing playerId. Got: ${JSON.stringify(player).slice(
        0,
        300
      )}`
    );
  }

  // 2️⃣ Fetch full player profile
  const profileUrl = `https://api-web.nhle.com/v1/player/${playerId}/landing`;
  const profile = await fetchJson(profileUrl);

  // 3️⃣ Normalize output
  return {
    id: playerId,
    headshot: profile.currentTeamAbbrev
      ? `https://assets.nhle.com/mugs/nhl/20252026/${profile.currentTeamAbbrev}/${playerId}.png`
      : null,
    firstName: {
      default: profile.firstName?.default ?? player.firstName ?? null,
    },
    lastName: { default: profile.lastName?.default ?? player.lastName ?? null },
    sweaterNumber: profile.sweaterNumber ?? null,
    positionCode: profile.position ?? null,
    shootsCatches: profile.shootsCatches ?? null,
    heightInInches: profile.heightInInches ?? null,
    weightInPounds: profile.weightInPounds ?? null,
    heightInCentimeters: profile.heightInCentimeters ?? null,
    weightInKilograms: profile.weightInKilograms ?? null,
    birthDate: profile.birthDate ?? null,
    birthCity: { default: profile.birthCity?.default ?? null },
    birthCountry: profile.birthCountry ?? null,
    birthStateProvince: {
      default: profile.birthStateProvince?.default ?? null,
    },
  };
}

// Avoid top-level await so Node doesn't reparse as ESM (removes MODULE_TYPELESS_PACKAGE_JSON warning)
async function main() {
  const player = await fetchNhlPlayerByName("pk Subban");
  console.log(player);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

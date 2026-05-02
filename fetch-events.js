#!/usr/bin/env node
/**
 * Round Here NW — Eventbrite Event Aggregator
 * Fetches events across NW2, NW6, NW10 London and outputs events.json
 *
 * Usage:
 *   node fetch-events.js
 *
 * Requires:
 *   EVENTBRITE_TOKEN environment variable (or edit the fallback below)
 *
 * Output:
 *   events.json — loaded by the Round Here NW website
 */

const fs = require("fs");

// ── CONFIG ──────────────────────────────────────────────────────────────────
const TOKEN = process.env.EVENTBRITE_TOKEN || "A2TCYBCQN4RF5LXDRY";

// Each area is searched by postcode + a tight radius
const SEARCH_AREAS = [
  { label: "NW6", address: "NW6, London, UK", postcode: "NW6" },
  { label: "NW10", address: "NW10, London, UK", postcode: "NW10" },
  { label: "NW2", address: "NW2, London, UK", postcode: "NW2" },
];

const RADIUS = "2km";

// Eventbrite category IDs → our site categories
const CATEGORY_MAP = {
  "103": "music",        // Music
  "110": "food",         // Food & Drink
  "108": "sport",        // Sports & Fitness
  "105": "arts",         // Arts
  "113": "community",    // Community & Culture
  "107": "arts",         // Fashion (map to arts)
  "109": "community",    // Hobbies
  "111": "community",    // Government & Politics
  "112": "community",    // Science & Technology
  "114": "community",    // Religion & Spirituality
  "115": "kids",         // Family & Education
  "116": "community",    // Seasonal & Holiday
  "117": "community",    // Home & Lifestyle
  "118": "community",    // Auto, Boat & Air
  "119": "community",    // Charity & Causes
  "199": "community",    // Other
};

// Category emoji for display
const CATEGORY_EMOJI = {
  music: "🎵",
  food: "🍽",
  sport: "⚽",
  arts: "🎨",
  community: "🤝",
  markets: "🛍",
  kids: "👶",
  outdoors: "🌿",
};

// Category background colours for cards
const CATEGORY_BG = {
  music: "#EDE9FE",
  food: "#FEF9C3",
  sport: "#D1FAE5",
  arts: "#FCE7F3",
  community: "#DBEAFE",
  markets: "#FEF3C7",
  kids: "#CFFAFE",
  outdoors: "#DCFCE7",
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
async function fetchJSON(url) {
  const { default: https } = await import("https");
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Failed to parse JSON: " + data.slice(0, 200))); }
      });
    }).on("error", reject);
  });
}

function formatDate(isoString) {
  if (!isoString) return "Date TBC";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

function dateKey(isoString) {
  if (!isoString) return "future";
  const now = new Date();
  const event = new Date(isoString);
  const diffDays = Math.floor((event - now) / (1000 * 60 * 60 * 24));
  const dayOfWeek = event.getDay();
  if (diffDays < 0) return "past";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) {
    if (dayOfWeek === 0 || dayOfWeek === 6) return "weekend";
    return "week";
  }
  const nowMonth = now.getMonth();
  const eventMonth = event.getMonth();
  if (nowMonth === eventMonth) return "month";
  return "future";
}

function guessCategory(event) {
  // Try Eventbrite's category first
  const catId = event.category_id;
  if (catId && CATEGORY_MAP[catId]) return CATEGORY_MAP[catId];

  // Fall back to keyword matching on title + description
  const text = ((event.name?.text || "") + " " + (event.description?.text || "")).toLowerCase();
  if (/music|gig|concert|band|dj|jazz|choir|sing/.test(text)) return "music";
  if (/food|drink|wine|beer|cook|eat|taste|market/.test(text)) return "food";
  if (/sport|run|yoga|fitness|football|gym|swim|cycle|walk/.test(text)) return "sport";
  if (/art|gallery|paint|draw|theatre|film|photo|craft|exhibit/.test(text)) return "arts";
  if (/child|kid|family|baby|parent|toddler|school/.test(text)) return "kids";
  if (/garden|park|nature|outdoor|green|litter|clean/.test(text)) return "outdoors";
  if (/market|fair|stall|vendor/.test(text)) return "markets";
  return "community";
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function fetchEventsForArea(area) {
  const url = `https://www.eventbriteapi.com/v3/events/search/` +
    `?location.address=${encodeURIComponent(area.address)}` +
    `&location.within=${RADIUS}` +
    `&start_date.range_start=${new Date().toISOString()}` +
    `&expand=venue,category` +
    `&token=${TOKEN}` +
    `&page_size=50`;

  console.log(`  Fetching ${area.label}...`);
  const data = await fetchJSON(url);

  if (data.error) {
    console.error(`  ⚠ Eventbrite error for ${area.label}:`, data.error_description || data.error);
    return [];
  }

  const events = data.events || [];
  console.log(`  ✓ ${events.length} events found in ${area.label}`);
  return events.map((ev) => normalise(ev, area.postcode));
}

function normalise(ev, postcode) {
  const cat = guessCategory(ev);
  const venueName = ev.venue?.name || ev.venue?.address?.localized_address_display || "Venue TBC";
  const lat = parseFloat(ev.venue?.latitude) || null;
  const lng = parseFloat(ev.venue?.longitude) || null;

  return {
    id: ev.id,
    title: ev.name?.text || "Untitled Event",
    description: ev.description?.text?.slice(0, 300) || "",
    cat,
    postcode,
    venue: venueName,
    address: ev.venue?.address?.localized_address_display || "",
    date: formatDate(ev.start?.local),
    dateISO: ev.start?.local || null,
    dateKey: dateKey(ev.start?.local),
    url: ev.url,
    isFree: ev.is_free,
    emoji: CATEGORY_EMOJI[cat] || "📅",
    bg: CATEGORY_BG[cat] || "#F5EFE0",
    lat,
    lng,
  };
}

function deduplicateEvents(events) {
  const seen = new Set();
  return events.filter((ev) => {
    if (seen.has(ev.id)) return false;
    seen.add(ev.id);
    return true;
  });
}

async function main() {
  console.log("🔍 Round Here NW — Fetching events from Eventbrite...\n");

  const allEvents = [];

  for (const area of SEARCH_AREAS) {
    try {
      const events = await fetchEventsForArea(area);
      allEvents.push(...events);
      // Small delay to be kind to the API
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ✗ Failed to fetch ${area.label}:`, err.message);
    }
  }

  const deduped = deduplicateEvents(allEvents);
  // Sort by date
  deduped.sort((a, b) => {
    if (!a.dateISO) return 1;
    if (!b.dateISO) return -1;
    return new Date(a.dateISO) - new Date(b.dateISO);
  });

  const output = {
    lastUpdated: new Date().toISOString(),
    totalEvents: deduped.length,
    events: deduped,
  };

  fs.writeFileSync("events.json", JSON.stringify(output, null, 2));

  console.log(`\n✅ Done! ${deduped.length} events written to events.json`);
  console.log(`   Last updated: ${output.lastUpdated}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

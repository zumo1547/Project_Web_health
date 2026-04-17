import { getAppBaseUrl } from "@/lib/app-url";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const APP_USER_AGENT = `SeniorHealthCheck/1.0 (+${getAppBaseUrl()})`;
const DEFAULT_RADIUS_KM = 8;
const MAX_RADIUS_KM = 20;
const MAX_RESULTS = 6;

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type NominatimElement = {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
};

export type NearbyHospitalLocation = {
  latitude: number;
  longitude: number;
  label: string | null;
  updatedAt: string | null;
  source: "saved" | "live";
};

export type NearbyHospital = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  mapUrl: string;
  directionsUrl: string;
};

export function clampHospitalRadius(radiusKm?: number) {
  if (!radiusKm || Number.isNaN(radiusKm)) {
    return DEFAULT_RADIUS_KM;
  }

  return Math.min(Math.max(radiusKm, 1), MAX_RADIUS_KM);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const latitudeAInRadians = toRadians(latitudeA);
  const latitudeBInRadians = toRadians(latitudeB);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeAInRadians) *
      Math.cos(latitudeBInRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function buildHospitalMapUrl(latitude: number, longitude: number, name?: string) {
  const query = encodeURIComponent(
    name ? `${name} ${latitude},${longitude}` : `${latitude},${longitude}`,
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildHospitalDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function buildHospitalSearchUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/hospital/@${latitude},${longitude},14z`;
}

export function buildHospitalEmbedUrl(latitude: number, longitude: number) {
  const query = encodeURIComponent(`hospital near ${latitude},${longitude}`);
  return `https://www.google.com/maps?q=${query}&z=14&output=embed`;
}

export function buildSpecificHospitalEmbedUrl(
  latitude: number,
  longitude: number,
  name?: string,
) {
  const query = encodeURIComponent(
    name ? `${name} ${latitude},${longitude}` : `${latitude},${longitude}`,
  );
  return `https://www.google.com/maps?q=${query}&z=16&output=embed`;
}

function normalizeHospitalName(tags?: Record<string, string>) {
  return (
    tags?.name ||
    tags?.["name:th"] ||
    tags?.official_name ||
    tags?.operator ||
    "โรงพยาบาลใกล้คุณ"
  );
}

function normalizeHospitalAddress(tags?: Record<string, string>) {
  if (!tags) {
    return "ใช้ปุ่มเปิดแผนที่เพื่อดูเส้นทาง";
  }

  if (tags["addr:full"]) {
    return tags["addr:full"];
  }

  const street = [tags["addr:housenumber"], tags["addr:street"]]
    .filter(Boolean)
    .join(" ");
  const area = [
    tags["addr:subdistrict"],
    tags["addr:district"],
    tags["addr:city"],
    tags["addr:province"],
  ]
    .filter(Boolean)
    .join(" ");

  const pieces = [street, area].filter(Boolean);

  return pieces.length ? pieces.join(", ") : "ใช้ปุ่มเปิดแผนที่เพื่อดูเส้นทาง";
}

function buildHospitalRequestHeaders() {
  return {
    Accept: "application/json",
    "Accept-Language": "th,en;q=0.8",
    "User-Agent": APP_USER_AGENT,
  };
}

function buildNearbyHospital(
  id: string,
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  originLatitude: number,
  originLongitude: number,
) {
  return {
    id,
    name,
    address,
    latitude,
    longitude,
    distanceKm: calculateDistanceKm(
      originLatitude,
      originLongitude,
      latitude,
      longitude,
    ),
    mapUrl: buildHospitalMapUrl(latitude, longitude, name),
    directionsUrl: buildHospitalDirectionsUrl(latitude, longitude),
  } satisfies NearbyHospital;
}

function buildSearchViewBox(latitude: number, longitude: number, radiusKm: number) {
  const clampedRadius = clampHospitalRadius(radiusKm);
  const latitudeDelta = clampedRadius / 111;
  const longitudeDelta =
    clampedRadius / Math.max(111 * Math.cos(toRadians(latitude)), 0.1);

  return [
    longitude - longitudeDelta,
    latitude + latitudeDelta,
    longitude + longitudeDelta,
    latitude - latitudeDelta,
  ].join(",");
}

function normalizeNominatimName(element: NominatimElement) {
  return (
    element.name ||
    element.address?.hospital ||
    element.address?.amenity ||
    element.display_name?.split(",")[0]?.trim() ||
    "โรงพยาบาลใกล้คุณ"
  );
}

function normalizeNominatimAddress(element: NominatimElement) {
  if (!element.display_name) {
    return "ใช้ปุ่มเปิดแผนที่เพื่อดูเส้นทาง";
  }

  const pieces = element.display_name
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (pieces.length <= 1) {
    return element.display_name;
  }

  return pieces.slice(1).join(", ");
}

function buildOverpassQuery(latitude: number, longitude: number, radiusKm: number) {
  const radiusMeters = Math.round(clampHospitalRadius(radiusKm) * 1000);

  return `
[out:json][timeout:18];
(
  node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
  way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
  relation["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
);
out center tags;
  `.trim();
}

async function fetchNearbyHospitalsFromOverpass(
  latitude: number,
  longitude: number,
  radiusKm = DEFAULT_RADIUS_KM,
) {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...buildHospitalRequestHeaders(),
          "Content-Type": "text/plain;charset=UTF-8",
        },
        body: buildOverpassQuery(latitude, longitude, radiusKm),
        signal: AbortSignal.timeout(9000),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`OVERPASS_${response.status}`);
      }

      const payload = (await response.json()) as { elements?: OverpassElement[] };
      const seen = new Set<string>();

      const hospitals = (payload.elements ?? [])
        .map((element) => {
          const hospitalLatitude = element.lat ?? element.center?.lat;
          const hospitalLongitude = element.lon ?? element.center?.lon;

          if (
            hospitalLatitude === undefined ||
            hospitalLongitude === undefined ||
            Number.isNaN(hospitalLatitude) ||
            Number.isNaN(hospitalLongitude)
          ) {
            return null;
          }

          const name = normalizeHospitalName(element.tags);
          const address = normalizeHospitalAddress(element.tags);
          const dedupeKey = `${name}-${hospitalLatitude.toFixed(4)}-${hospitalLongitude.toFixed(4)}`;

          if (seen.has(dedupeKey)) {
            return null;
          }

          seen.add(dedupeKey);

          return buildNearbyHospital(
            `${element.id}`,
            name,
            address,
            hospitalLatitude,
            hospitalLongitude,
            latitude,
            longitude,
          );
        })
        .filter((hospital): hospital is NearbyHospital => Boolean(hospital))
        .sort((left, right) => left.distanceKm - right.distanceKm)
        .slice(0, MAX_RESULTS);

      if (hospitals.length) {
        return hospitals;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

async function fetchNearbyHospitalsFromNominatim(
  latitude: number,
  longitude: number,
  radiusKm = DEFAULT_RADIUS_KM,
) {
  const seen = new Set<string>();
  const hospitals: NearbyHospital[] = [];
  const queries = ["hospital", "โรงพยาบาล"];

  for (const query of queries) {
    const searchParams = new URLSearchParams({
      format: "jsonv2",
      q: query,
      limit: String(MAX_RESULTS * 3),
      bounded: "1",
      addressdetails: "1",
      viewbox: buildSearchViewBox(latitude, longitude, radiusKm),
    });

    const response = await fetch(`${NOMINATIM_ENDPOINT}?${searchParams.toString()}`, {
      headers: buildHospitalRequestHeaders(),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`NOMINATIM_${response.status}`);
    }

    const payload = (await response.json()) as NominatimElement[];

    for (const element of payload) {
      const hospitalLatitude = Number(element.lat);
      const hospitalLongitude = Number(element.lon);

      if (Number.isNaN(hospitalLatitude) || Number.isNaN(hospitalLongitude)) {
        continue;
      }

      const name = normalizeNominatimName(element);
      const dedupeKey = `${name}-${hospitalLatitude.toFixed(4)}-${hospitalLongitude.toFixed(4)}`;

      if (seen.has(dedupeKey)) {
        continue;
      }

      seen.add(dedupeKey);
      hospitals.push(
        buildNearbyHospital(
          `${element.place_id}`,
          name,
          normalizeNominatimAddress(element),
          hospitalLatitude,
          hospitalLongitude,
          latitude,
          longitude,
        ),
      );
    }
  }

  return hospitals
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, MAX_RESULTS);
}

export async function fetchNearbyHospitals(
  latitude: number,
  longitude: number,
  radiusKm = DEFAULT_RADIUS_KM,
) {
  let nominatimError: Error | null = null;
  let overpassError: Error | null = null;

  try {
    const hospitals = await fetchNearbyHospitalsFromNominatim(
      latitude,
      longitude,
      radiusKm,
    );

    if (hospitals.length) {
      return hospitals;
    }
  } catch (error) {
    nominatimError = error instanceof Error ? error : new Error(String(error));
  }

  try {
    const hospitals = await fetchNearbyHospitalsFromOverpass(
      latitude,
      longitude,
      radiusKm,
    );

    if (hospitals.length) {
      return hospitals;
    }
  } catch (error) {
    overpassError = error instanceof Error ? error : new Error(String(error));
  }

  if (nominatimError || overpassError) {
    throw nominatimError ?? overpassError ?? new Error("HOSPITAL_LOOKUP_FAILED");
  }

  return [];
}

export function formatHospitalDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} เมตร`;
  }

  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} กม.`;
}

export function formatLocationLabel(
  label: string | null | undefined,
  latitude: number,
  longitude: number,
) {
  if (label?.trim()) {
    return label.trim();
  }

  return `ตำแหน่งล่าสุด (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
}

export function buildHospitalShareMessage(
  patientName: string,
  hospitals: NearbyHospital[],
  locationLabel?: string | null,
) {
  const lines = [
    `รายชื่อโรงพยาบาลใกล้คุณสำหรับ ${patientName}`,
    locationLabel
      ? `อ้างอิงจากตำแหน่งล่าสุด: ${locationLabel}`
      : "อ้างอิงจากตำแหน่งล่าสุดที่แชร์ไว้",
    "หากมีอาการฉุกเฉินให้โทร 1669 ทันที",
    "",
  ];

  hospitals.slice(0, 3).forEach((hospital, index) => {
    lines.push(
      `${index + 1}. ${hospital.name} (${formatHospitalDistance(hospital.distanceKm)})`,
      `แผนที่: ${hospital.mapUrl}`,
      `เส้นทาง: ${hospital.directionsUrl}`,
      hospital.address ? `ที่อยู่: ${hospital.address}` : "",
      "",
    );
  });

  return lines.filter(Boolean).join("\n");
}

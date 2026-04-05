const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
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
  const query = encodeURIComponent(name ? `${name} ${latitude},${longitude}` : `${latitude},${longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildHospitalDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function buildHospitalSearchUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/hospital/@${latitude},${longitude},14z`;
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

  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
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

export async function fetchNearbyHospitals(
  latitude: number,
  longitude: number,
  radiusKm = DEFAULT_RADIUS_KM,
) {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: buildOverpassQuery(latitude, longitude, radiusKm),
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OVERPASS_${response.status}`);
  }

  const payload = (await response.json()) as { elements?: OverpassElement[] };
  const seen = new Set<string>();

  return (payload.elements ?? [])
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
      const distanceKm = calculateDistanceKm(
        latitude,
        longitude,
        hospitalLatitude,
        hospitalLongitude,
      );
      const dedupeKey = `${name}-${hospitalLatitude.toFixed(4)}-${hospitalLongitude.toFixed(4)}`;

      if (seen.has(dedupeKey)) {
        return null;
      }

      seen.add(dedupeKey);

      return {
        id: `${element.id}`,
        name,
        address,
        latitude: hospitalLatitude,
        longitude: hospitalLongitude,
        distanceKm,
        mapUrl: buildHospitalMapUrl(hospitalLatitude, hospitalLongitude, name),
        directionsUrl: buildHospitalDirectionsUrl(hospitalLatitude, hospitalLongitude),
      } satisfies NearbyHospital;
    })
    .filter((hospital): hospital is NearbyHospital => Boolean(hospital))
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, MAX_RESULTS);
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
    locationLabel ? `อ้างอิงจากตำแหน่งล่าสุด: ${locationLabel}` : "อ้างอิงจากตำแหน่งล่าสุดที่แชร์ไว้",
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

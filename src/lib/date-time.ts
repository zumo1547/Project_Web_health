function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: Date | string) {
  return formatSystemDateTime(value);
}

export function formatSystemDateTime(value: Date | string, short = false) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());

  if (short) {
    return `${day}/${month}/${year} ${hours}:${minutes} UTC`;
  }

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export function toLocalDateTimeInputValue(value = new Date()) {
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

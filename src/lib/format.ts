export function formatUpdatedAt(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const elapsedSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
  ];

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let value_ = elapsedSeconds;
  for (const [unit, step] of units) {
    if (Math.abs(value_) < step) return formatter.format(value_, unit);
    value_ = Math.round(value_ / step);
  }
  return date.toLocaleDateString();
}

import type { Language } from "./i18n";

let dateLocale = "en-GB";

export function setFormatLanguage(language: Language) {
  dateLocale = language === "zh" ? "zh-CN" : "en-GB";
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

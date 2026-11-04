import type { Lang } from "./i18n";

export interface City { id: string; en: string; fr: string; ar: string; lat: number; lon: number }

/** Order matters: it is the order of the locations in the single Open-Meteo request (see lib/weather.ts). */
export const CITIES: City[] = [
  { id: "casablanca", en: "Casablanca", fr: "Casablanca", ar: "الدار البيضاء", lat: 33.5731, lon: -7.5898 },
  { id: "rabat", en: "Rabat", fr: "Rabat", ar: "الرباط", lat: 34.0209, lon: -6.8416 },
  { id: "tangier", en: "Tangier", fr: "Tanger", ar: "طنجة", lat: 35.7595, lon: -5.834 },
  { id: "marrakech", en: "Marrakech", fr: "Marrakech", ar: "مراكش", lat: 31.6295, lon: -7.9811 },
  { id: "agadir", en: "Agadir", fr: "Agadir", ar: "أكادير", lat: 30.4278, lon: -9.5981 },
  { id: "fez", en: "Fes", fr: "Fès", ar: "فاس", lat: 34.0331, lon: -5.0003 },
  { id: "meknes", en: "Meknes", fr: "Meknès", ar: "مكناس", lat: 33.8935, lon: -5.5473 },
  { id: "oujda", en: "Oujda", fr: "Oujda", ar: "وجدة", lat: 34.6867, lon: -1.9114 },
  { id: "tetouan", en: "Tetouan", fr: "Tétouan", ar: "تطوان", lat: 35.5785, lon: -5.3684 },
  { id: "ifrane", en: "Ifrane", fr: "Ifrane", ar: "إفران", lat: 33.5228, lon: -5.1106 },
  { id: "ouarzazate", en: "Ouarzazate", fr: "Ouarzazate", ar: "ورزازات", lat: 30.9189, lon: -6.8934 },
  { id: "beni-mellal", en: "Beni Mellal", fr: "Béni Mellal", ar: "بني ملال", lat: 32.3373, lon: -6.3498 },
  { id: "laayoune", en: "Laayoune", fr: "Laâyoune", ar: "العيون", lat: 27.1253, lon: -13.1625 },
  { id: "dakhla", en: "Dakhla", fr: "Dakhla", ar: "الداخلة", lat: 23.6848, lon: -15.9579 },
  { id: "errachidia", en: "Errachidia", fr: "Errachidia", ar: "الرشيدية", lat: 31.9314, lon: -4.4244 },
  { id: "safi", en: "Safi", fr: "Safi", ar: "آسفي", lat: 32.2994, lon: -9.2372 },
  { id: "kenitra", en: "Kenitra", fr: "Kénitra", ar: "القنيطرة", lat: 34.261, lon: -6.5802 },
  { id: "nador", en: "Nador", fr: "Nador", ar: "الناظور", lat: 35.174, lon: -2.9287 },
  { id: "zagora", en: "Zagora", fr: "Zagora", ar: "زاكورة", lat: 30.3324, lon: -5.8384 },
  { id: "essaouira", en: "Essaouira", fr: "Essaouira", ar: "الصويرة", lat: 31.5085, lon: -9.7595 },
  { id: "taroudant", en: "Taroudant", fr: "Taroudant", ar: "تارودانت", lat: 30.4703, lon: -8.877 },
];

export const cityName = (c: City, lang: Lang): string => c[lang];

export type Lang = "en" | "ar";
const en = {
  title: "Morocco Weather Today", sub: "Live conditions from Open-Meteo", search: "Search a Moroccan city", noMatch: "No city matches your search.",
  feels: "Feels like", updated: "Updated", hourly: "Next 24 hours", daily: "Forecast", d7: "7 days", d14: "14 days",
  details: "Atmosphere", humidity: "Humidity", pressure: "Pressure", wind: "Wind", gusts: "Gusts", rainNow: "Rain now", prob: "Rain chance",
  thunder: "Thunderstorm tracker", thunderNone: "No thunderstorms forecast in the next 48 hours.", thunderAt: "Expected around",
  alerts: "Severe weather alerts", alertsNone: "No severe conditions in the 3-day forecast.",
  alertsNote: "Generated from Open-Meteo forecast thresholds. For official warnings see Direction Générale de la Météorologie (marocmeteo.ma).",
  map: "Weather map", lMap: "Map", lSat: "Satellite", lRain: "Precipitation", lCloud: "Clouds", radarNote: "Radar and cloud layers by RainViewer; coverage over Morocco may be partial.",
  overview: "Across Morocco", loading: "Loading live weather…", errTitle: "Weather data unavailable", errBody: "Could not reach Open-Meteo. Check your connection and try again.", retry: "Try again",
  high: "H", low: "L", today: "Today", kmh: "km/h", mm: "mm",
  lvl: { yellow: "Be aware", orange: "Be prepared", red: "Take action" },
  at: { wind: "Strong wind gusts", rain: "Heavy rain", heat: "Extreme heat", storm: "Thunderstorms" },
  wc: { clear: "Clear", partly: "Partly cloudy", cloudy: "Overcast", fog: "Fog", drizzle: "Drizzle", rain: "Rain", snow: "Snow", storm: "Thunderstorm" },
  dir: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
};
const ar: typeof en = {
  title: "طقس المغرب اليوم", sub: "أحوال مباشرة من Open-Meteo", search: "ابحث عن مدينة مغربية", noMatch: "لا توجد مدينة مطابقة.",
  feels: "تبدو كأنها", updated: "آخر تحديث", hourly: "الـ 24 ساعة القادمة", daily: "التوقعات", d7: "7 أيام", d14: "14 يومًا",
  details: "الغلاف الجوي", humidity: "الرطوبة", pressure: "الضغط الجوي", wind: "الرياح", gusts: "هبات الرياح", rainNow: "الأمطار الآن", prob: "احتمال المطر",
  thunder: "تتبع العواصف الرعدية", thunderNone: "لا عواصف رعدية متوقعة خلال 48 ساعة.", thunderAt: "متوقعة حوالي",
  alerts: "تنبيهات الطقس القاسي", alertsNone: "لا أحوال جوية قاسية في توقعات 3 أيام.",
  alertsNote: "تنبيهات مستخرجة من عتبات توقعات Open-Meteo. للنشرات الرسمية راجع المديرية العامة للأرصاد الجوية (marocmeteo.ma).",
  map: "خريطة الطقس", lMap: "الخريطة", lSat: "الأقمار الصناعية", lRain: "التساقطات", lCloud: "السحب", radarNote: "طبقتا الرادار والسحب من RainViewer وقد تكون التغطية فوق المغرب جزئية.",
  overview: "عبر المغرب", loading: "جارٍ تحميل الطقس المباشر…", errTitle: "بيانات الطقس غير متاحة", errBody: "تعذر الاتصال بـ Open-Meteo. تحقق من اتصالك وحاول مجددًا.", retry: "إعادة المحاولة",
  high: "ع", low: "د", today: "اليوم", kmh: "كم/س", mm: "مم",
  lvl: { yellow: "انتباه", orange: "استعداد", red: "تحرك" },
  at: { wind: "هبات رياح قوية", rain: "أمطار غزيرة", heat: "حرارة شديدة", storm: "عواصف رعدية" },
  wc: { clear: "صافٍ", partly: "غائم جزئيًا", cloudy: "غائم", fog: "ضباب", drizzle: "رذاذ", rain: "مطر", snow: "ثلج", storm: "عاصفة رعدية" },
  dir: ["شمال", "شمال شرق", "شرق", "جنوب شرق", "جنوب", "جنوب غرب", "غرب", "شمال غرب"],
};
export const T = { en, ar };
export type Dict = typeof en;

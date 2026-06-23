import { cookies } from "next/headers";
import { translations, type Lang } from "@/lib/i18n/translations";

export const LANG_COOKIE = "srg-lang";

/** Read the chosen language from the cookie (server-side). Defaults to Malay. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return v === "en" ? "en" : "ms";
}

/** Translation dictionary for the current request's language (server-side). */
export async function getDict() {
  return translations[await getLang()];
}

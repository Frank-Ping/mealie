import { createInstance } from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import enUS from "../../../frontend/app/lang/messages/en-US.json";

export const i18n = createInstance();
await i18n.use(initReactI18next).init({
  lng: "en-US", fallbackLng: "en-US", initAsync: false,
  resources: { "en-US": { translation: enUS } },
  interpolation: { escapeValue: false },
});

export class UnsupportedLegacyMessage extends Error {}
export function formatLegacyMessage(message: string, values: Readonly<Record<string, string | number>> = {}): string {
  // Only the demonstrated literal/named/positional subset is accepted here.
  // Pipe plurals, linked/literal syntax require reviewed full compatibility.
  if (message.includes("|") || message.includes("@") || /\{'|\{\{/.test(message)) {
    throw new UnsupportedLegacyMessage("R31: plural/linked/literal message syntax not implemented");
  }
  let result = "";
  for (let i = 0; i < message.length; i++) {
    const char = message[i]!;
    if (char === "}") throw new UnsupportedLegacyMessage("R31: unmatched brace");
    if (char !== "{") { result += char; continue; }
    const end = message.indexOf("}", i + 1);
    if (end < 0) throw new UnsupportedLegacyMessage("R31: unmatched brace");
    const key = message.slice(i + 1, end);
    if (!/^(?:[A-Za-z_]\w*|\d+)$/.test(key)) throw new UnsupportedLegacyMessage("R31: unsupported parameter");
    if (!(key in values)) throw new UnsupportedLegacyMessage(`R31: missing parameter ${key}`);
    result += String(values[key]);
    i = end;
  }
  return result;
}
export function useLegacyI18n() {
  const { i18n: instance } = useTranslation(undefined, { i18n });
  return { t(key: string, values?: Readonly<Record<string, string | number>>) {
    const message: unknown = instance.getResource(instance.resolvedLanguage || "en-US", "translation", key)
      ?? instance.getResource("en-US", "translation", key);
    if (typeof message !== "string") throw new UnsupportedLegacyMessage(`R31: missing/non-string key ${key}`);
    return formatLegacyMessage(message, values);
  } };
}

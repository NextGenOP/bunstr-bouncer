import { nip19 } from "nostr-tools";

export function decodenpubKeys(keys: string[]) {
  return keys?.map((key) => key.startsWith("npub") ? (nip19.decode(key).data as string) : key
  );
}
export function decodenpubKeysFromRecord(
  dict: Record<string, string>
): Record<string, string> {
  return Object.keys(dict)
    .map((key) => key.startsWith("npub") ? (nip19.decode(key).data as string) : key
    )
    .reduce((obj, key) => {
      obj[key] = obj[key];
      return obj;
    }, {});
}

import { nip19 } from "nostr-tools";
/**
 * Decodes nostr public keys from an array of strings
 * 
 * @param {string[]} keys - Array of public keys
 * @returns {string[]} Decoded public keys
 */
export function decodenpubKeys(keys: string[]): string[] {
  return keys?.map((key) => key.startsWith("npub") ? (nip19.decode(key).data as string) : key
  );
}
/**
 * Decodes nostr public keys from a record of strings
 * 
 * @param {Record<string, string>} dict - Record of public keys
 * @returns {Record<string, string>} Decoded record of public keys
 */

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

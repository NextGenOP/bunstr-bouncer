import { nip19 } from "nostr-tools";
/**
 * Decodes nostr public keys from an array of strings
 *
 * @param {string[]} keys - Array of public keys
 * @returns {string[]} Decoded public keys
 */
export function decodenpubKeysFromArray(keys: string[]): string[] {
  return keys?.map((key) =>
    key.startsWith("npub") ? decodenpubKey(key) : key
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
    .map((key) => (key.startsWith("npub") ? decodenpubKey(key) : key))
    .reduce((obj: Record<string, string>, key) => {
      obj[key] = obj[key];
      return obj;
    }, {});
}
/**
 * Decode nostr private key from string
 * @param {string} nsec
 * @returns {Uint8Array}
 */
export function decodensecKey(nsec: string): Uint8Array {
  return nip19.decode(nsec).data as Uint8Array;
}
/**
 * Decode nostr public key from string
 * @param {string} npub
 * @returns {string}
 */
export function decodenpubKey(npub: string): string {
  return nip19.decode(npub).data as string;
}

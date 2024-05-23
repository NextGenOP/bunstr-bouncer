import { validateEvent, verifyEvent, nip19 } from "nostr-tools";
import config from "../config";
import { decodenpubKeys, decodenpubKeysFromRecord } from "./decodenpubKeys";
import type { ServerWebSocket } from "bun";

const authorizedKeys = decodenpubKeys(config.authorized_keys);
const privateKeys = decodenpubKeysFromRecord(config.private_keys);

/**
 * Authenticates the incoming request.
 * @param {string} authKey - The authentication key.
 * @param {object} data - The data received from the request.
 * @param {ServerWebSocket} ws - The ServerWebSocket object.
 * @returns {boolean} Returns true if authentication succeeds, otherwise false.
 */
export function auth(authKey: string, data: object, ws: ServerWebSocket) {
  try {
    // Check if authorized_keys, private_keys are empty and noscraper flag is set
    if (!authorizedKeys.length && !Object.keys(privateKeys).length && !config.noscraper)
      return false;

    // Validate and verify event data
    if (!validateEvent(data) || !verifyEvent(data)) {
      throw new Error("Invalid challenge response.");
    }

    // Check if pubkey is authorized
    if (!authorizedKeys.includes(data.pubkey) && !privateKeys[data.pubkey] && !config.noscraper) {
      throw new Error("Unauthorized.");
    }

    // Check if data.kind is 22242
    if (data.kind !== 22242) {
      throw new Error("Not kind 22242.");
    }

    // Check if relay url matches
    const tags = Object.fromEntries(data.tags);
    if (!tags.relay?.includes(ws.data.host)) {
      throw new Error("Unmatched relay url.");
    }

    // Check if challenge string matches
    if (tags.challenge !== authKey) {
      throw new Error("Unmatched challenge string.");
    }

    // Send success message
    ws.send(JSON.stringify(["OK", data.id, true, `Hello ${data.pubkey}`]));
    return true;
  } catch (error) {
    // Send error message
    ws.send(JSON.stringify(["OK", data.id, false, error.message]));
    return false;
  }
}

export default auth;

import { ServerWebSocket } from "bun";
import config from "./config";
import { validateEvent, nip19 } from "nostr-tools";
import { decode } from "nostr-tools/nip19";

const authorized_keys: string[] = decodenpubKeys(config.authorized_keys);
const allowed_publishers: string[] = decodenpubKeys(config.allowed_publishers);
const blocked_publishers: string[] = decodenpubKeys(config.blocked_publishers);
const private_keys: Record<string, string> = decodenpubKeysFromRecord(
  config.private_keys
);
function decodenpubKeys(keys: string[]) {
  return keys?.map((key) =>
    key.startsWith("npub") ? (nip19.decode(key).data as string) : key
  );
}
function decodenpubKeysFromRecord(
  dict: Record<string, string>
): Record<string, string> {
  return Object.keys(dict)
    .map((key) =>
      key.startsWith("npub") ? (nip19.decode(key).data as string) : key
    )
    .reduce((obj, key) => {
      obj[key] = obj[key];
      return obj;
    }, {});
}

const bouncer = {
  handleOpen: (ws: ServerWebSocket<unknown>) => {
    ws.send(JSON.stringify(["AUTH", Date.now() + Math.random().toString(36)]));
  },
  handleMessage: (ws: ServerWebSocket<unknown>, message: string) => {},
  handleClose: (
    ws: ServerWebSocket<unknown>,
    code: number,
    reason: string
  ) => {},
};
export default bouncer;

import { ServerWebSocket } from "bun";
import config from "./config";
import { validateEvent } from "nostr-tools";
import { decodenpubKeys, decodenpubKeysFromRecord } from "./util/decodenpubKeys";

const authorized_keys: string[] = decodenpubKeys(config.authorized_keys);
const allowed_publishers: string[] = decodenpubKeys(config.allowed_publishers);
const blocked_publishers: string[] = decodenpubKeys(config.blocked_publishers);
const private_keys: Record<string, string> = decodenpubKeysFromRecord(
  config.private_keys
);
const bouncer = {
  handleOpen: (ws: ServerWebSocket<unknown>) => {
    ws.send(JSON.stringify(["AUTH", Date.now() + Math.random().toString(36)]));
  },
  handleMessage: (ws: ServerWebSocket<unknown>, message: string | Buffer) => {},
  handleClose: (
    ws: ServerWebSocket<unknown>,
    code: number,
    reason: string
  ) => {},
};
export default bouncer;

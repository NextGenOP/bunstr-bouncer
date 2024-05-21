import { ServerWebSocket } from "bun";
import config from "./config";
import { validateEvent } from "nostr-tools";
import {
  decodenpubKeys,
  decodenpubKeysFromRecord,
} from "./util/decodenpubKeys";

const authorized_keys: string[] = decodenpubKeys(config.authorized_keys);
const allowed_publishers: string[] = decodenpubKeys(config.allowed_publishers);
const blocked_publishers: string[] = decodenpubKeys(config.blocked_publishers);
const private_keys: Record<string, string> = decodenpubKeysFromRecord(
  config.private_keys
);

function parseQueryArray(query: string): number[] {
  return query?.split(",").map((item: string) => parseInt(item));
}

const bouncer = {
  handleOpen: (ws: ServerWebSocket<unknown>) => {
    ws.data.reject = parseQueryArray(ws.data?.query.reject);
    ws.data.accept = parseQueryArray(ws.data?.query.accept);
    ws.data.limit = parseInt(ws.data?.limit);
    ws.data.accurate = ws.data?.query.accurate === 1 ? true : false;
    ws.data.saveData = ws.data?.query.save === 1 ? true : false;
    console.log(`${ws.remoteAddress} connected`);
    if (config.noscraper || authorized_keys?.length) {
      ws.data.authorized = false;
      ws.send(
        JSON.stringify(["AUTH", Date.now() + Math.random().toString(36)])
      );
    } else if (Object.keys(private_keys?.length))
      ws.send(
        JSON.stringify(["AUTH", Date.now() + Math.random().toString(36)])
      );
  },
  handleMessage: (ws: ServerWebSocket<unknown>, message: string | Buffer) => {},
  handleClose: (
    ws: ServerWebSocket<unknown>,
    code: number,
    reason: string
  ) => {},
};
export default bouncer;

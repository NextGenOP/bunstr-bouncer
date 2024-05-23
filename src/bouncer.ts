import type { ServerWebSocket } from "bun";
import { validateEvent } from "nostr-tools";
import config from "./config";
import type { WSData } from "./lib/bunstrtype";
import auth from "./util/auth";
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

const worker = new Worker(__dirname + "/bouncer_worker.ts", {
  name: "Bunster (child)",
  smol: true,
});
worker.onmessage = (event) => {
  const { data } = event;
  switch (data.type) {
    case "toWSClient":
      if (!csess.hasOwnProperty(data.id)) return;
      csess[data.id].send(data.data);
      break;
  }
};

let csess: Record<string, ServerWebSocket<WSData>> = {};

function getLastArray(arr: string | string[] | undefined): string | undefined {
  return typeof arr === "string" ? arr : arr?.[arr.length - 1];
}
function parseQuerytoArray(
  query: string | string[] | undefined
): number[] | undefined {
  return Array.isArray(query)
    ? query.map((item: string) => parseInt(item))
    : query?.split(",").map((item: string) => parseInt(item));
}

const bouncer = {
  handleOpen: (ws: ServerWebSocket<WSData>) => {
    ws.data.reject = parseQuerytoArray(ws.data?.query.reject);
    ws.data.accept = parseQuerytoArray(ws.data?.query.accept);
    ws.data.limit = parseInt(getLastArray(ws.data?.query.limit) ?? "");
    ws.data.accurate = ws.data?.query.accurate === "1" ? true : undefined;
    ws.data.saveData = ws.data?.query.save === "1" ? true : undefined;
    ws.data.id = Date.now() + Math.random().toString(36);
    ws.data.authorized = true;

    console.log(`${ws.remoteAddress} connected`);
    csess[ws.data.id] = ws;
    worker.postMessage({
      type: "newclient",
      data: ws.data.id,
    });
    if (config.noscraper || authorized_keys?.length) {
      ws.data.authorized = false;
      ws.send(JSON.stringify(["AUTH", ws.data.id]));
    } else if (Object.keys(private_keys?.length))
      ws.send(JSON.stringify(["AUTH", ws.data.id]));
  },
  handleMessage: (ws: ServerWebSocket<WSData>, message_json: string) => {
    try {
      const message = JSON.parse(message_json);
      switch (message[0]) {
        case "EVENT":
          if (!ws.data.authorized)
            return ws.send(
              JSON.stringify(["OK", message[1].id, false, "auth: needed"])
            );
          if (message[1].kind == 22242)
            return ws.send(
              JSON.stringify([
                "OK",
                message[1].id,
                false,
                "rejected: kind 22242",
              ])
            );
          if (blocked_publishers?.includes(message[1].pubkey))
            return ws.send(
              JSON.stringify([
                "OK",
                message[1].id,
                false,
                "blocked: event author is blacklisted.",
              ])
            );
          if (
            allowed_publishers.length &&
            !allowed_publishers?.includes(message[1].pubkey)
          )
            return ws.send(
              JSON.stringify([
                "OK",
                message[1]?.id,
                false,
                "rejected: unauthorized",
              ])
            );
          if (!validateEvent(message[1]))
            return ws.send(
              JSON.stringify(["NOTICE", "rejected: invalid event"])
            );
          //
          break;
        case "REQ":
          if (!ws.data.authorized)
            return ws.send(
              JSON.stringify(["OK", message[1].id, false, "auth: needed"])
            );
          if (typeof message[1] !== "string")
            return ws.send(
              JSON.stringify(["NOTICE", "error: expected a subID string"])
            );
          if (typeof message[2] !== "object")
            return ws.send(
              JSON.stringify([
                "CLOSED",
                message[1],
                "error: expected a filters object",
              ])
            );
          //
          break;
        case "CLOSE":
          if (!ws.data.authorized) return;
          if (typeof message[1] !== "string")
            return ws.send(JSON.stringify(["NOTICE", "error: bad request."]));

          //
          break;
        case "AUTH":
          if (auth(ws.data.id, message[1], ws)) {
            ws.data.pubkey = message[1].pubkey;
            console.log(
              `${ws.remoteAddress} is authorized as  ${ws.data.pubkey} ${
                private_keys[ws.data.pubkey] ? "(admin)" : "(user)"
              }`
            );
            if (ws.data.authorized) return;
            ws.data.authorized = true;
          }
          break;
        default:
          ws.send(
            JSON.stringify([
              "NOTICE",
              `error: unrecognized command: ${message[0]}`,
            ])
          );
          break;
      }
    } catch (err) {
      const errorInvalid = JSON.stringify([
        "NOTICE",
        `ERROR: Invalid JSON, ${err}`,
      ]);
      console.log(`${ws.remoteAddress}: ${errorInvalid}`);
      ws.send(errorInvalid);
    }
  },
  handleClose: (ws: ServerWebSocket<WSData>, code: number, reason: string) => {
    console.log(`${ws.remoteAddress} disconnected (${code}), ${reason}`);
    delete csess[ws.data.id];
    worker.postMessage({
      type: "clientclose",
      data: ws.data.id,
    });
  },
};

export default bouncer;

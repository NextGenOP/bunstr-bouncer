import config from "./config.ts";
import bouncer from "./bouncer"

const useSSL = config.https?.privKey !== "" && config.https?.certificate !== "";

const wsUrlRegex = /(?:^- )(wss?:\/\/[^\s]+)/gm;

let fetchedInfo: string = "";

if (config.relays.length) {
  fetchedInfo += "Relays:\n";
  config.relays.forEach((r) => {
    fetchedInfo += `${r}\n`;
  });
  fetchedInfo += "\n";
}
if (config.loadbalancer.length) {
  // console.log("Fetching relay list from...",
  //             config.loadbalancer[0]?.replace(/^ws/, "http"));
  let res = await fetch(config.loadbalancer[0]?.replace(/^ws/, "http"), {
    method: "GET",
    headers: {
      "User-Agent": "bunstr/0.1",
    },
  }).then((r) => r.text());
  const matches = res.matchAll(wsUrlRegex);
  const relayList = [...matches].map((m) => m[1]);

  fetchedInfo += "Load Balance:\n";
  config.loadbalancer.forEach((r) => {
    fetchedInfo += `${r}\n`;
  });
  fetchedInfo += "\n";

  fetchedInfo += relayList.length
    ? "Load balance connected to Relays:\n"
    : "No Relays Connected through Load balance";
  relayList.forEach((r) => {
    fetchedInfo += `${r}\n`;
  });
}

const server = Bun.serve({
  port: config.port,
  fetch(req: Request, server: Server): Response | Promise<Response> | undefined {
    const url = new URL(req.url);
    const serverAddr: string = `${
      req.headers["x-forwarded-proto"]?.replace(/http/i, "ws") ??
      url.protocol.replace(/http/i, "ws").slice(0, -1)
    }://${req.headers["x-forwarded-host"] ?? url.host}`;
    if (req.headers["Accept"] === "application/nostr+json") {
      return new Response(JSON.stringify(config.server_meta), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    if (url.pathname === "/") {
      let info: string =
        "This is nostr bouncer relay.\n" +
        `Connect with: ${serverAddr}\n` +
        fetchedInfo;

      return new Response(info, { headers: { "Content-Type": "text/plain" } });
    }
    if (server.upgrade(req)) {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] || server.requestIP(req);
      if (config.blocked_hosts && config.blocked_hosts.includes(ip)) {
        return new Response("Blocked", { status: 403 });
      }
      return
    }
    return new Response("Not found", { status: 404 });
  },
  bouncer,
  ...(useSSL
    ? {
        tls: {
          cert: config.https?.certificate,
          key: config.https?.privKey,
          passphrase: config.https?.passphrase,
          dhParamsFile: config.https?.dhParams,
        },
      }
    : {}),
});

console.log(`Listening on localhost:${server.port}`);
console.log(`Bouncer Info:\n ${fetchedInfo}`);

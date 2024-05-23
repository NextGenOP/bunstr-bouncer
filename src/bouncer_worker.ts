let clients_id: string[] = [];
declare var self: Worker;
self.onmessage = (event) => {
  const { data } = event;
  switch (data.type) {
    case "newclient":
      clients_id.push(data.id);
      console.log("Client connected:", clients_id.length);
      break;
    case "clientclose":
      clients_id.splice(clients_id.indexOf(data.id), 1);
      console.log("Client disconnected:", clients_id.length);
      break;
  }
};
self.onerror = (e) => {
  console.error("(worker has error):", e);
};

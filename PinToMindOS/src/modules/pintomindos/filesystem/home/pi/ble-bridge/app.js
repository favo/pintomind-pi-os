import bleno from "bleno";
import { Server } from "socket.io";
import http from "http";
import {
  configurationService,
  bleCallbacks,
  SERVICE_UUID,
} from "./ble-service.js";
const io = new Server();

let blenoReady = false;
let isSubscribed = false;
let networkListCallback;
let networkListOffset;
let networkConnectionCallback;

bleno.on("stateChange", (state) => {
  console.log("on -> stateChange: " + state);
  if (state === "poweredOn") {
    blenoReady = true;
  }
});

bleno.on("advertisingStart", (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log("advertising...");
  bleno.setServices([configurationService]);
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("ble-enable", () => {
    console.log("ble-enable");
    if (blenoReady) {
      bleno.startAdvertising("pintomind-player", [SERVICE_UUID]);
      io.emit("ble-enabled");
    }
  });

  socket.on("ble-disable", () => {
    bleno.stopAdvertising();
    io.emit("ble-disabled");
  });

  socket.on("network-connection-result", (result) => {
    console.log("isSubscribed", isSubscribed);
    console.log("network-connection-result", networkConnectionCallback);
    if (isSubscribed && networkConnectionCallback != null) {
      console.log("network-connection-result socket.on", result);
      const buffer = new Buffer.from(result.toString());
      networkConnectionCallback(buffer);
    }
  });

  // https://github.com/noble/bleno/blob/master/test.js#L36
  socket.on("list-of-networks", (data) => {
    if (networkListCallback) {
      var result = bleno.Characteristic.RESULT_SUCCESS;
      var buffer = new Buffer.from(JSON.stringify(data), "utf8");
      
      if (networkListOffset > buffer.length) {
        result = bleno.Characteristic.RESULT_INVALID_OFFSET;
        buffer = null;
      } else {
        buffer = buffer.slice(networkListOffset);
      }
      
      networkListCallback(result, buffer);
    }
  });
});

bleCallbacks.onSetRoatation = (rotation) => {
  io.sockets.emit("rotation", rotation);
};

bleCallbacks.onSetWIFI = (data) => {
  console.log(data);
  io.sockets.emit("wifi", data);
};

bleCallbacks.onSetHost = (host) => {
  io.sockets.emit("host", host);
};

bleCallbacks.sendNetworkList = (offset, callback) => {
  networkListCallback = callback;
  networkListOffset = offset;
  io.sockets.emit("get-network-list");
};

bleCallbacks.notifyNetworkConnection = (status, callback) => {
  networkConnectionCallback = callback;
  isSubscribed = status;
};

bleCallbacks.finishSetup = () => {
  io.sockets.emit("finish-setup");
};

const httpServer = http.createServer();
io.attach(httpServer);
httpServer.listen(3333, "127.0.0.1");

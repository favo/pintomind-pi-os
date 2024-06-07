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

const deviceName = "Raspberry Pi";

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("ble-enable", (uuid) => {
    console.log("ble-enable");

    if (blenoReady) {
      //bleno.startAdvertising("pintomind-player", [SERVICE_UUID]);

      // Advertisement data in EIR format
      const advertisementData = Buffer.concat([
        Buffer.from([0x02, 0x01, 0x06]), // Flags
        Buffer.from([deviceName.length + 1, 0x09]), // Length and type for complete local name
        Buffer.from(deviceName), // Device name
        Buffer.from([uuid.length + 1, 0xff]), // Length and type for manufacturer-specific data
        Buffer.from(uuid), // Random 6-character string
      ]);

      const scanResponseData = Buffer.concat([
        Buffer.from([0x11, 0x07]), // Length and type for complete list of 128-bit Service UUIDs
        Buffer.from(
          SERVICE_UUID.match(/.{1,2}/g)
            .reverse()
            .join(""),
          "hex"
        ), // Service UUID in little-endian format
      ]);

      bleno.startAdvertisingWithEIRData(
        advertisementData,
        scanResponseData,
        (err) => {
          if (err) {
            console.error("Failed to start advertising:", err);
          } else {
            console.log("Advertising started successfully");
          }
        }
      );

      io.emit("ble-enabled");
    }
  });

  socket.on("ble-disable", () => {
    bleno.stopAdvertising();
    io.emit("ble-disabled");
  });

  socket.on("ethernet-status", (data) => {
      if (isSubscribed && networkConnectionCallback != null) {
        console.log("ethernet-status", data);
        console.log("network-connection-result socket.on", data);
        const result = data.success && data.stdout == "1";
        const json = { success: result, type: "ethernet" };
        var buffer = new Buffer.from(JSON.stringify(json), "utf8");
  
        networkConnectionCallback(buffer);
      }
  });

  socket.on("network-connection-result", (data) => {
    if (isSubscribed && networkConnectionCallback != null) {
      console.log("network-connection-result socket.on", data);
      const result = data.success && data.stdout == "1";
      const json = { success: result, type: "wifi" };
      var buffer = new Buffer.from(JSON.stringify(json), "utf8");

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

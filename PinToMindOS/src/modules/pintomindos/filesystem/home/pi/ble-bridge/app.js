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
let networkConnectionCallback;

let maxValueSizeNetworkList
let networkListSubscribed = false;
let networkListCallback;

let resolutionListCallback
let resolutionListMaxValue 
let resolutionListIsSubscribed 

let pincodeIsSubscribed
let pincodeCallback

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

bleno.on("accept", (clientAddress) => {
  console.log("Device accepted with clientAddress:", clientAddress);
  setTimeout(() => {
    io.sockets.emit("check-ethernet-status");
  }, 3000)
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

  socket.on("pincode", (data) => {
    if (pincodeIsSubscribed && pincodeCallback != null) {
      var buffer = new Buffer.from(JSON.stringify(data), "utf8");
      pincodeCallback(buffer);
    }
  })

  socket.on("ethernet-status", (data) => {
    if (isSubscribed && networkConnectionCallback != null) {
      console.log("network-connection-result socket.on", data);
      const result = data.success && data.stdout == "1";
      const json = { s: result, t: "e" };
      var buffer = new Buffer.from(JSON.stringify(json), "utf8");

      networkConnectionCallback(buffer);
    }
  });

  socket.on("network-connection-result", (data) => {
    if (isSubscribed && networkConnectionCallback != null) {
      console.log("network-connection-result socket.on", data);
      const result = data.success && data.stdout == "1";
      const json = { s: result, t: "w" };
      var buffer = new Buffer.from(JSON.stringify(json), "utf8");

      networkConnectionCallback(buffer);
    }
  });

  // https://github.com/noble/bleno/blob/master/test.js#L36
  socket.on("list-of-networks", (listData) => {

    if (networkListSubscribed && networkListCallback) {
      const data = JSON.stringify(listData);
      const chunkSize = maxValueSizeNetworkList;
      
      let offset = 0;
      const sendNextChunk = () => {
        if (offset >= data.length) return; 

        const chunk = Buffer.from(data.slice(offset, offset + chunkSize));
        networkListCallback(chunk);

        offset += chunkSize; 
        setTimeout(sendNextChunk, 20);
      };

      sendNextChunk();
    }
  });

  socket.on("list-of-resolutions", (data) => {
    if (resolutionListIsSubscribed && resolutionListCallback != null) {
      const stringData = JSON.stringify(data);
      const chunkSize = resolutionListMaxValue;
      
      let offset = 0;
      const sendNextChunk = () => {
        if (offset >= stringData.length) return; 

        const chunk = Buffer.from(stringData.slice(offset, offset + chunkSize));
        resolutionListCallback(chunk);

        offset += chunkSize; 
        setTimeout(sendNextChunk, 20);
      };

      sendNextChunk();
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

bleCallbacks.onSetResolution = (res) => {
  io.sockets.emit("resolution", res);
};

bleCallbacks.sendNetworkList = (status, maxValueSize, callback) => {
  networkListSubscribed = status;
  maxValueSizeNetworkList = maxValueSize
  networkListCallback = callback;
  io.sockets.emit("get-network-list");
};

bleCallbacks.sendResolutionList = (status, maxValueSize, callback) => {
  resolutionListIsSubscribed = status
  resolutionListMaxValue = maxValueSize
  resolutionListCallback = callback;

  io.sockets.emit("get-resolution-list");
};

bleCallbacks.notifyPincode = (status, callback) => {
  pincodeIsSubscribed = status
  pincodeCallback = callback
}

bleCallbacks.notifyNetworkConnection = (status, callback) => {
  isSubscribed = status;
  networkConnectionCallback = callback;
};

bleCallbacks.finishSetup = () => {
  io.sockets.emit("finish-setup");
};

bleCallbacks.goToScreen = () => {
  io.sockets.emit("go-to-screen");
};

const httpServer = http.createServer();
io.attach(httpServer);
httpServer.listen(3333, "127.0.0.1");

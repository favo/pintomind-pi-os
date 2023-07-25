import bleno from "bleno";
import { Server } from "socket.io";
import http from "http";
import { configurationService, bleCallbacks, SERVICE_UUID } from "./ble-service.js";
const io = new Server();


let blenoReady = false;
let lastSSID = "";

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
			bleno.startAdvertising('pintomind-player', [SERVICE_UUID]);
			io.emit("ble-enabled");
		}
	});

	socket.on("ble-disable", () => {
		bleno.stopAdvertising();
		io.emit("ble-disabled");
	});
});

bleCallbacks.onSetRoatation = (rotation) => {
	io.sockets.emit("rotation", rotation);
};

bleCallbacks.onSetSSID = (ssid) => {
	lastSSID = ssid;
};

bleCallbacks.onSetPSK = (psk) => {
	if (lastSSID === "") {
		return;
	}
	io.sockets.emit("wifi", JSON.stringify({ ssid: lastSSID, password: psk }));
};

const httpServer = http.createServer();
io.attach(httpServer);
httpServer.listen(3333, "127.0.0.1");


import bleno from "bleno";

// These can be any sequence of 32 hex digits
export const SERVICE_UUID = "89496822200000000000000000000000";
const ROTATION_CHARACTERISTIC_UUID = "89496822201000000000000000000000";
const WIFI_CHARACTERISTIC_UUID = "89496822202000000000000000000000";
const HOST_CHARACTERISTIC_UUID = "89496822204000000000000000000000";
const FINISH_CHARACTERISTIC_UUID = "89496822209000000000000000000000";

const READ_NETWORK_LIST_CHARACTERISTIC_UUID =
  "89496822205000000000000000000000";
const NOTIFY_NETWORK_CONNECTION_CHARACTERISTIC_UUID =
  "89496822206000000000000000000000";

export const bleCallbacks = {
  onSetRoatation: (rotation) => {},
  onSetWIFI: (ssid) => {},
  onSetHost: (host) => {},
  sendNetworkList: (callback) => {},
  notifyNetworkConnection: (isSubscribed, callback) => {},
  finishSetup: () => {},
};

const setRotationCharacteristic = new bleno.Characteristic({
  uuid: ROTATION_CHARACTERISTIC_UUID,
  properties: ["write"],
  onWriteRequest: (data, _offset, _withoutResponse, callback) => {
    const dataString = data.toString("utf-8");
    console.log(
      "setRotationCharacteristic write request: " + data.toString("utf-8")
    );
    if (["normal", "left", "right", "inverted"].includes(dataString)) {
      bleCallbacks.onSetRoatation(dataString);
      callback(bleno.Characteristic.RESULT_SUCCESS);
    } else {
      callback(bleno.Characteristic.RESULT_UNLIKELY_ERROR);
    }
  },
});

const setWIFICharacteristic = new bleno.Characteristic({
  uuid: WIFI_CHARACTERISTIC_UUID,
  properties: ["write"],
  onWriteRequest: (data, _offset, _withoutResponse, callback) => {
    console.log(
      "setWIFICharacteristic write request: " + data.toString("utf-8")
    );
    bleCallbacks.onSetWIFI(data.toString("utf-8"));
    callback(bleno.Characteristic.RESULT_SUCCESS);
  },
});

const setHostCharacteristic = new bleno.Characteristic({
  uuid: HOST_CHARACTERISTIC_UUID,
  properties: ["write"],
  onWriteRequest: (data, _offset, _withoutResponse, callback) => {
    console.log(
      "setHostCharacteristic write request: " + data.toString("utf-8")
    );
    bleCallbacks.onSetHost(data.toString("utf-8"));
    callback(bleno.Characteristic.RESULT_SUCCESS);
  },
});

const readNetworkListCharacteristic = new bleno.Characteristic({
  uuid: READ_NETWORK_LIST_CHARACTERISTIC_UUID,
  properties: ["read"],
  onReadRequest: (_offset, callback) => {
    console.log("readNetworkListCharacteristic read request");
    bleCallbacks.sendNetworkList(callback);
  },
});

const notifyNetworkConnectionCharacteristic = new bleno.Characteristic({
  uuid: NOTIFY_NETWORK_CONNECTION_CHARACTERISTIC_UUID,
  properties: ["notify"],
  onSubscribe: (maxValueSize, updateValueCallback) => {
    console.log("notifyNetworkConnectionCharacteristic - onSubscribe");
    bleCallbacks.notifyNetworkConnection(true, updateValueCallback);
  },
  onUnsubscribe: () => {
    console.log("notifyNetworkConnectionCharacteristic - onUnsubscribe");
    bleCallbacks.notifyNetworkConnection(false, null);
  },
});

const finishCharacteristic = new bleno.Characteristic({
  uuid: FINISH_CHARACTERISTIC_UUID,
  properties: ["write"],
  onWriteRequest: (data, _offset, _withoutResponse, callback) => {
    console.log(
      "finishCharacteristic write request: " + data.toString("utf-8")
    );
    bleCallbacks.finishSetup();
    callback(bleno.Characteristic.RESULT_SUCCESS);
  },
});

export const configurationService = new bleno.PrimaryService({
  uuid: SERVICE_UUID,
  characteristics: [
    setRotationCharacteristic,
    setWIFICharacteristic,
    setHostCharacteristic,
    readNetworkListCharacteristic,
    notifyNetworkConnectionCharacteristic,
    finishCharacteristic,
  ],
});

// Endre firstpage. Så heller man kan gå til settings

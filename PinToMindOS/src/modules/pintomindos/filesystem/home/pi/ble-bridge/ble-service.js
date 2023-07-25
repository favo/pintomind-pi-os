import bleno from "bleno";

// These can be any sequence of 32 hex digits
export const SERVICE_UUID = '89496822200000000000000000000000';
const ROTATION_CHARACTERISTIC_UUID = '89496822201000000000000000000000';
const SSID_CHARACTERISTIC_UUID = '89496822202000000000000000000000';
const PSK_CHARACTERISTIC_UUID = '89496822203000000000000000000000';

export const bleCallbacks = {
	onSetRoatation: (rotation) => {},
	onSetSSID: (ssid) => {},
	onSetPSK: (psk) => {},
};

const setRotationCharacteristic = new bleno.Characteristic({
	uuid: ROTATION_CHARACTERISTIC_UUID,
	properties: ['write'],
	onWriteRequest: (data, _offset, _withoutResponse, callback) => {
		const dataString = data.toString('utf-8');
		console.log('setRotationCharacteristic write request: ' + data.toString('utf-8'));
		if (['normal', 'left', 'right', 'inverted'].includes(dataString)) {
			bleCallbacks.onSetRoatation(dataString);
			callback(bleno.Characteristic.RESULT_SUCCESS);
		} else {
			callback(bleno.Characteristic.RESULT_UNLIKELY_ERROR);
		}
	},
});

const setSSIDCharacteristic = new bleno.Characteristic({
	uuid: SSID_CHARACTERISTIC_UUID,
	properties: ['read', 'write'],
	onReadRequest: (_offset, callback) => {
		console.log('setSSIDCharacteristic read request');
		callback(bleno.Characteristic.RESULT_SUCCESS, Buffer.from('Unimplemented'));
	},
	onWriteRequest: (data, _offset, _withoutResponse, callback) => {
		console.log('setSSIDCharacteristic write request: ' + data.toString('utf-8'));
		bleCallbacks.onSetSSID(data.toString('utf-8'));
		callback(bleno.Characteristic.RESULT_SUCCESS);
	},
});

const setPSKCharacteristic = new bleno.Characteristic({
	uuid: PSK_CHARACTERISTIC_UUID,
	properties: ['write'],
	onWriteRequest: (data, _offset, _withoutResponse, callback) => {
		console.log('setPSKCharacteristic write request: ' + data.toString('utf-8'));
		bleCallbacks.onSetPSK(data.toString('utf-8'));
		callback(bleno.Characteristic.RESULT_SUCCESS);
	},
});

export const configurationService = new bleno.PrimaryService({
	uuid: SERVICE_UUID,
	characteristics: [
		setRotationCharacteristic,
		setSSIDCharacteristic,
		setPSKCharacteristic,
	]
});


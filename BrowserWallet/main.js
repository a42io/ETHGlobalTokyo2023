

const LOCAL_STORAGE_KEY_MODULUS = "LOCAL_STORAGE_KEY_MODULUS";
const LOCAL_STORAGE_KEY_ADDRESS = "LOCAL_STORAGE_KEY_ADDRESS";

const SERVICE_UUID = '5F155D9E-CBC8-448D-B29B-EA686D158842'.toLowerCase();
const CHARCTERISTIC_UUID = '1B1D7724-59E0-41CF-BBAE-358999363D32'.toLowerCase();

const mynaSigner = {};

function toHexString(value) {
	return Array.from(new Uint8Array(value.buffer), function(byte) {
	  return ('0' + (byte & 0xFF).toString(16)).slice(-2)
	}).join('').toLowerCase();
}

function toArrayBuffer(hexString) {
    return new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(function (h) {
		return parseInt(h, 16)
	})).buffer;
}

// call from button
async function connectMynaSigner() {
	mynaSigner.device = await navigator.bluetooth.requestDevice({
		filters: [{
			services: [SERVICE_UUID]
		}]
	});

	mynaSigner.device.addEventListener(
		'gattserverdisconnected', 
		onMynaSignerDisconnected
	);
	
	const gattServer = await mynaSigner.device.gatt.connect();

	mynaSigner.service = await gattServer.getPrimaryService(SERVICE_UUID);
	mynaSigner.characteristic = await mynaSigner.service.getCharacteristic(CHARCTERISTIC_UUID);

	mynaSigner.characteristic.addEventListener(
		'characteristicvaluechanged',
		onCharacteristicValueChanged
	);

	mynaSigner.characteristic.startNotifications();
	onMynaSignerConnected()
}

// call from button
async function loadMynaWallet() {
	requestModulusMode();
}

// call from button
async function signTest() {
	const messageToSign = toArrayBuffer("68656c6c6f");	// hello
	await mynaSigner.characteristic.writeValueWithResponse(messageToSign);
	requestSignatureMode();
}

// call from button
async function reload() {
	showNotification("Reloaded!");
}

// call from button
async function reset() {
	if (window.confirm("Are you sure?")) {
		localStorage.clear();
	}
}

function showNotification(messsage) {
	$("#notification-body").text(messsage)
	$("#notification").toast("show")
}

function onMynaSignerConnected() {
	console.log("Connected to Myna Signer");
	showNotification("Connected to Myna Signer");
}

function onMynaSignerDisconnected() {
	console.log("Disconnected from Myna Signer");
	showNotification("Disconnected from Myna Signer");
}

async function requestModulusMode() {
	try {
		await mynaSigner.characteristic.writeValueWithResponse(new Uint8Array([1]));
	} catch (e) {
		console.log(e)
		onMynaSignerDisconnected()
	}
}

async function requestSignatureMode() {
	try {
		await mynaSigner.characteristic.writeValueWithResponse(new Uint8Array([2]));
	} catch (e) {
		console.log(e)
		onMynaSignerDisconnected()
	}
}

function onCharacteristicValueChanged (event) {
	console.log("BLE onCharacteristicValueChanged");
	const value = event.target.value;
	console.log(toHexString(value));
}

$(window).on('load', async () => {
	var toastElList = [].slice.call(document.querySelectorAll(".toast"));
	toastElList.map(function (toastEl) {
  		return new bootstrap.Toast(toastEl, null);
	});
})

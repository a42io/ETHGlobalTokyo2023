const SERVICE_UUID = '5F155D9E-CBC8-448D-B29B-EA686D158842'.toLowerCase()
const CHARCTERISTIC_UUID = '1B1D7724-59E0-41CF-BBAE-358999363D32'.toLowerCase()

const mynaSigner = {}

function toHexString(value) {
	return Array.from(new Uint8Array(value.buffer), function(byte) {
	  return ('0' + (byte & 0xFF).toString(16)).slice(-2)
	}).join('').toLowerCase()
}

async function connectMynaSigner() {
	mynaSigner.device = await navigator.bluetooth.requestDevice({
		filters: [{
			services: [SERVICE_UUID]
		}]
	})
	console.log(mynaSigner.device)

	const gattServer = await mynaSigner.device.gatt.connect()

	mynaSigner.service = await gattServer.getPrimaryService(SERVICE_UUID)
	mynaSigner.characteristic = await mynaSigner.service.getCharacteristic(CHARCTERISTIC_UUID)

	mynaSigner.characteristic.addEventListener(
		'characteristicvaluechanged',
		onCharacteristicValueChanged
	)

	mynaSigner.characteristic.startNotifications()

	// set modulus mode
	await mynaSigner.characteristic.writeValueWithResponse(new Uint8Array([1]))
	console.log("connected to mynaSigner")
}

function onCharacteristicValueChanged (event) {
	console.log("BLE onCharacteristicValueChanged")
	const value = event.target.value;
	console.log(toHexString(value))
}

function loadMynaWallet() {

}

$(window).on('load', async () => {

})

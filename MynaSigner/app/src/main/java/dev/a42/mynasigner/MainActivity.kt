package dev.a42.mynasigner

import android.Manifest
import android.bluetooth.*
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.content.pm.PackageManager
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import android.os.ParcelUuid
import android.util.Log
import android.widget.EditText
import android.widget.Toast
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresPermission
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import java.util.*


private const val TAG = "Main"
private val SERVICE_UUID = UUID.fromString("5F155D9E-CBC8-448D-B29B-EA686D158842")
private val CHARACTERISTIC_UUID = UUID.fromString("1B1D7724-59E0-41CF-BBAE-358999363D32")
private val DESCRIPTOR_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")

class MainActivity : AppCompatActivity(), NfcAdapter.ReaderCallback {

    private lateinit var editTextPIN: EditText

    private lateinit var nfcAdapter: NfcAdapter
    var reader: Reader? = null

    // BLE
    lateinit var btManager: BluetoothManager
    lateinit var bleAdvertiser: BluetoothLeAdvertiser
    lateinit var btGattServer: BluetoothGattServer
    lateinit var btGattService: BluetoothGattService
    lateinit var btGattCharacteristic: BluetoothGattCharacteristic
    lateinit var btCentralDevice: BluetoothDevice

    private val permissions = arrayOf(
        Manifest.permission.BLUETOOTH_CONNECT,
        Manifest.permission.BLUETOOTH_ADVERTISE
    )

    private val requestPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { isGranted: Map<String, Boolean> ->
        if (isGranted.containsValue(false)) {
        } else {
            Log.d(TAG, "permission granted")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        editTextPIN = findViewById<EditText>(R.id.editTextPIN);
//        testNFC()

        checkPermissions();
    }

    private fun checkPermissions() {
        for (perm in permissions) {
            if (ActivityCompat.checkSelfPermission(this, perm)
                == PackageManager.PERMISSION_GRANTED
            ) {
                Log.d(TAG, "permission has granted")
                createBlePeripheral()
            } else {
                requestPermissionsLauncher.launch(permissions)
            }
        }
    }

    private fun createBlePeripheral() {
        if (ActivityCompat.checkSelfPermission(
                this, Manifest.permission.BLUETOOTH_CONNECT
            )
            != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        btManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

        btGattServer = btManager.openGattServer(this, btGattServerCallback)

        btGattService = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)

        btGattCharacteristic = BluetoothGattCharacteristic(CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ or BluetoothGattCharacteristic.PERMISSION_WRITE
        )

        val btGattDescriptor = BluetoothGattDescriptor(DESCRIPTOR_UUID,BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE)
        btGattCharacteristic.addDescriptor(btGattDescriptor)

        btGattService.addCharacteristic(btGattCharacteristic)
        btGattServer.addService(btGattService)
        bleAdvertiser = btManager.adapter.bluetoothLeAdvertiser

        startBleAdvertising()
    }

    private fun startBleAdvertising() {
        if (ActivityCompat.checkSelfPermission(
                this, Manifest.permission.BLUETOOTH_ADVERTISE
            )
            != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val settingsBuilder = AdvertiseSettings.Builder()
        settingsBuilder.setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_BALANCED)
        settingsBuilder.setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
        settingsBuilder.setTimeout(0)
        settingsBuilder.setConnectable(true)

        val dataBuilder = AdvertiseData.Builder()
        dataBuilder.setIncludeTxPowerLevel(true)
        dataBuilder.addServiceUuid(ParcelUuid.fromString(SERVICE_UUID.toString()))

        val responseBuilder = AdvertiseData.Builder()
        responseBuilder.setIncludeDeviceName(true)

        bleAdvertiser.startAdvertising(
            settingsBuilder.build(),
            dataBuilder.build(),
            responseBuilder.build(),
            bleAdvertiseCallback
        )
    }



    fun testNFC() {
        nfcAdapter = NfcAdapter.getDefaultAdapter(this.applicationContext)
        nfcAdapter.enableReaderMode(
            this,
            this,
            NfcAdapter.FLAG_READER_NFC_B or NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
            null
        )
    }

    override fun onTagDiscovered(tag: Tag?) {
        if (tag == null) return
        Log.d(TAG, "onTagDiscovered")
        reader = Reader(tag)
        reader?.connect()

        readModulus()

        val messageHashString = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        sign(messageHashString.hexToByteArray())
    }

    fun readModulus() {
        val jpkiAP = reader?.selectJpkiAp()
        val cert = jpkiAP?.readAuthCertificate()
        val bytes = cert?.publicKey?.encoded!!
        val modulus = bytes.copyOfRange(33, (256+33))
        val modulusStr = "0x${modulus.toHexString().lowercase()}"
        Log.d(TAG, "modulus: $modulusStr")
    }

    fun sign(messageHash: ByteArray) {
        val pin = editTextPIN.text.toString()

        if (pin.length != 4) return

        val jpkiAP = reader?.selectJpkiAp()

        val count = jpkiAP?.lookupAuthPin()!!
        Log.d(TAG, "PIN COUNT: $count")

        if (count < 3) return

        if(jpkiAP?.verifyAuthPin(pin) != true) {
            Log.d(TAG, "Invalid PIN")
            return
        }

        val header = "3031300d060960864801650304020105000420".hexToByteArray()
        val digestInfo = header + messageHash

        val signature = jpkiAP?.authSignature(digestInfo)
        val signatureStr = "0x${signature?.toHexString()?.lowercase()}"
        Log.d(TAG, "signature: $signatureStr")
    }

    private val bleAdvertiseCallback = object: AdvertiseCallback() {

        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            super.onStartSuccess(settingsInEffect)
            Log.d(TAG, "BLE onStartSuccess")
        }

        override fun onStartFailure(errorCode: Int) {
            super.onStartFailure(errorCode)
            Log.d(TAG, "BLE onStartFailure")
        }
    }

    private val btGattServerCallback = object: BluetoothGattServerCallback() {

        override fun onConnectionStateChange(device: BluetoothDevice?, status: Int, newState: Int) {
            super.onConnectionStateChange(device, status, newState)
            Log.d(TAG, "BLE onConnectionStateChange")
            if (device != null) {
                btCentralDevice = device
            }
        }

        override fun onMtuChanged(device: BluetoothDevice?, mtu: Int) {
            super.onMtuChanged(device, mtu)
            Log.d(TAG, "BLE onMtuChanged")
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice?,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic?
        ) {
            super.onCharacteristicReadRequest(device, requestId, offset, characteristic)
            Log.d(TAG, "BLE onCharacteristicReadRequest")

            if (ActivityCompat.checkSelfPermission(
                    this@MainActivity, Manifest.permission.BLUETOOTH_CONNECT
                )
                != PackageManager.PERMISSION_GRANTED
            ) {
                return
            }
            if (characteristic == btGattCharacteristic) {
                val bytes = "hello".toByteArray()
                btGattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, bytes)
            }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice?,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic?,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            super.onCharacteristicWriteRequest(
                device,
                requestId,
                characteristic,
                preparedWrite,
                responseNeeded,
                offset,
                value
            )
            Log.d(TAG, "BLE onCharacteristicWriteRequest")
            if (ActivityCompat.checkSelfPermission(
                    this@MainActivity, Manifest.permission.BLUETOOTH_CONNECT
                )
                != PackageManager.PERMISSION_GRANTED
            ) {
                return
            }
            btGattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
            if (characteristic == btGattCharacteristic) {
                Log.d(TAG, value?.toHexString()!!)
            }
        }

        override fun onDescriptorReadRequest(
            device: BluetoothDevice?,
            requestId: Int,
            offset: Int,
            descriptor: BluetoothGattDescriptor?
        ) {
            super.onDescriptorReadRequest(device, requestId, offset, descriptor)
            Log.d(TAG, "BLE onDescriptorReadRequest")
            if (ActivityCompat.checkSelfPermission(
                    this@MainActivity, Manifest.permission.BLUETOOTH_CONNECT
                )
                != PackageManager.PERMISSION_GRANTED
            ) {
                return
            }
            btGattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
        }

        override fun onDescriptorWriteRequest(
            device: BluetoothDevice?,
            requestId: Int,
            descriptor: BluetoothGattDescriptor?,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            super.onDescriptorWriteRequest(
                device,
                requestId,
                descriptor,
                preparedWrite,
                responseNeeded,
                offset,
                value
            )
            Log.d(TAG, "BLE onDescriptorWriteRequest")
            if (ActivityCompat.checkSelfPermission(
                    this@MainActivity, Manifest.permission.BLUETOOTH_CONNECT
                )
                != PackageManager.PERMISSION_GRANTED
            ) {
                return
            }
            btGattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
        }
    }
}
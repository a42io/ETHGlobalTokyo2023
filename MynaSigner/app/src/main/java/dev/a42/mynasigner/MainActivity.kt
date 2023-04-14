package dev.a42.mynasigner

import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import android.util.Log
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity


private const val TAG = "Main"

class MainActivity : AppCompatActivity(), NfcAdapter.ReaderCallback {

    private lateinit var editTextPIN: EditText

    private lateinit var nfcAdapter: NfcAdapter
    var reader: Reader? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        editTextPIN = findViewById<EditText>(R.id.editTextPIN);

        testNFC()
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
}
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
//        readModulus()
        sign()
    }

    fun readModulus() {
        val jpkiAP = reader?.selectJpkiAp()
        val cert = jpkiAP?.readAuthCertificate()
        val bytes = cert?.publicKey?.encoded!!
        val modulus = bytes.copyOfRange(33, (256+33))
        val modulusStr = "0x${modulus.toHexString().lowercase()}"
        Log.d(TAG, "modulus: $modulusStr")
    }

    fun sign() {
        val pin = editTextPIN.text

        if (pin.length != 4) return

        val jpkiAP = reader?.selectJpkiAp()

        val count = jpkiAP?.lookupAuthPin()
        Log.d(TAG, "PIN COUNT: ${count}")

        if (count < 3) return

        // PIN2 の検証
        if(jpkiAP?.verifyAuthPin(pin) != true) {
            Log.d(TAG, "Invalid PIN")
            return
        }



    }
}
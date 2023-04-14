package dev.a42.mynasigner

import android.nfc.NfcAdapter
import android.nfc.Tag
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log

private const val TAG = "Main"

class MainActivity : AppCompatActivity(), NfcAdapter.ReaderCallback {

    private lateinit var nfcAdapter: NfcAdapter
    var reader: Reader? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
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
    }

    fun readModulus() {
        val jpkiAP = reader?.selectJpkiAp()
        val cert = jpkiAP?.readAuthCertificate()
        val bytes = cert?.publicKey?.encoded!!
        val modulus = bytes.copyOfRange(33, (256+33))
        val modulusStr = "0x${modulus.toHexString().lowercase()}"
        Log.d(TAG, "modulus: $modulusStr")
    }
}
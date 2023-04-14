package dev.a42.mynasigner

// https://github.com/ishihatta/mynacard-android-demo/blob/main/app/src/main/java/com/ishihata_tech/myna_card_demo/myna/Reader.kt
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.util.Log

/**
 * @see `https://github.com/jpki/myna`
 */
class Reader(nfcTag: Tag) {
    companion object {
        private const val LOG_TAG = "Reader"
    }

    private val isoDep = IsoDep.get(nfcTag)

    fun connect() {
        isoDep.connect()
    }

    fun close() {
        isoDep.close()
    }

    fun selectTextAp(): TextAP {
        selectDF("D3921000310001010408".hexToByteArray())
        return TextAP(this)
    }

    fun selectJpkiAp(): JpkiAP {
        selectDF("D392F000260100000001".hexToByteArray())
        return JpkiAP(this)
    }

    fun selectDF(bid: ByteArray) {
        val apdu = APDU.newAPDUCase3(0x00, 0xA4.toByte(), 0x04, 0x0C, bid)
        val (sw1, sw2, _) = trans(apdu)
        if (sw1 != 0x90.toByte() || sw2 != 0x00.toByte()) {
            throw APDUException(sw1, sw2)
        }
    }

    fun selectEF(bid: ByteArray) {
        val apdu = APDU.newAPDUCase3(0x00, 0xA4.toByte(), 0x02, 0x0C, bid)
        val (sw1, sw2, _) = trans(apdu)
        if (sw1 != 0x90.toByte() || sw2 != 0x00.toByte()) {
            throw APDUException(sw1, sw2)
        }
    }

    fun lookupPin(): Int {
        val apdu = APDU.newAPDUCase1(0x00, 0x20, 0x00, 0x80.toByte())
        val (sw1, sw2, _) = trans(apdu)
        return if (sw1 == 0x63.toByte()) {
            sw2.toInt() and 0x0F
        } else {
            -1
        }
    }

    fun verify(pin: String): Boolean {
        if (pin.isEmpty()) {
            return false
        }
        val bpin = pin.toByteArray()
        val apdu = APDU.newAPDUCase3(0x00, 0x20, 0x00, 0x80.toByte(), bpin)
        val (sw1, sw2, _) = trans(apdu)
        if (sw1 == 0x90.toByte() && sw2 == 0x00.toByte()) {
            return true
        } else if (sw1 == 0x63.toByte()) {
            val counter = sw2.toInt() and 0x0F
            if (counter == 0) {
                Log.e(LOG_TAG, "暗証番号が間違っています。ブロックされました")
                return false
            }
            Log.e(LOG_TAG, "暗証番号が間違っています。残り${counter}回")
            return false
        } else if (sw1 == 0x69.toByte() && sw2 == 0x84.toByte()) {
            Log.e(LOG_TAG, "暗証番号がブロックされています。")
            return false
        } else {
            Log.e(LOG_TAG, "不明なエラーです。")
            return false
        }
    }

    fun trans(apdu: APDU): Triple<Byte, Byte, ByteArray> {
        Log.d(LOG_TAG, "Request: ${apdu.command.toHexString()}")
        val ret = isoDep.transceive(apdu.command)
        Log.d(LOG_TAG, "Response: ${ret.toHexString()}")
        if (ret.size >= 2) {
            return Triple(ret[ret.size - 2], ret[ret.size - 1], ret.copyOfRange(0, ret.size - 2))
        }
        return Triple(0, 0, byteArrayOf())
    }

    fun readBinary(size: Int): ByteArray {
        val apdu = APDU.newAPDUCase2(0x00, 0xB0.toByte(), 0, 0, size)
        val (sw1, sw2, data) = trans(apdu)
        if (sw1 != 0x90.toByte() || sw2 != 0x00.toByte()) {
            Log.d(LOG_TAG, "Failure to read binary")
            return byteArrayOf()
        }
        return data
    }

    fun signature(data: ByteArray): ByteArray {
        val apdu = APDU.newAPDUCase4(0x80.toByte(), 0x2A, 0x00, 0x80.toByte(), data, 0)
        val previousTimeout = isoDep.timeout
        Log.d(LOG_TAG, "signature: previousTimeout=$previousTimeout")
        isoDep.timeout = 5000
        val (sw1, sw2, res) = trans(apdu)
        isoDep.timeout = previousTimeout
        if (sw1 == 0x90.toByte() && sw2 == 0x00.toByte()) {
            return res
        }
        return byteArrayOf()
    }
}
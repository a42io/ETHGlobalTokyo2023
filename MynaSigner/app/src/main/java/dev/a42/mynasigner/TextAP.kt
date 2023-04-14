package dev.a42.mynasigner

// source: https://github.com/ishihatta/mynacard-android-demo/blob/main/app/src/main/java/com/ishihata_tech/myna_card_demo/myna/TextAP.kt
import android.util.Log

class TextAP(private val reader: Reader) {
    companion object {
        private const val LOG_TAG = "TextAP"
    }

    data class Attributes(
        val name: String?,
        val address: String?,
        val birth: String?,
        val sex: String?,
    )

    fun lookupPin(): Int {
        reader.selectEF("0011".hexToByteArray()) // 券面事項入力補助用PIN
        return reader.lookupPin()
    }

    fun verifyPin(pin: String): Boolean {
        reader.selectEF("0011".hexToByteArray())
        return reader.verify(pin)
    }

    fun readMyNumber(): String {
        reader.selectEF("0001".hexToByteArray())
        val data = reader.readBinary(17)
        Log.d(LOG_TAG, "readMyNumber: data=${data.toHexString()}")

        val frame = data.asn1FrameIterator().next()
        if (frame.tag != 16 || frame.value == null) return ""
        return String(frame.value)
    }

    fun readAttributes(): Attributes? {
        reader.selectEF("0002".hexToByteArray())

        // 読み込むべきサイズを取得する
        val tempData = reader.readBinary(7)
        val sizeToRead = tempData.asn1FrameIterator().next().frameSize
        if (sizeToRead == 0) return null

        // 全体を読み込む
        val wrappedData = reader.readBinary(sizeToRead)
        val wrappedFrame = wrappedData.asn1FrameIterator().next()
        if (wrappedFrame.tag != 32) return null
        if (wrappedFrame.value == null) return null

        // シーケンスの中身をパースしていく
        var name: String? = null
        var address: String? = null
        var birth: String? = null
        var sex: String? = null
        wrappedFrame.value.asn1FrameIterator().forEach { frame ->
            val value = frame.value ?: return@forEach
            val valueString = String(value)
            when(frame.tag) {
                33 -> { // Header
                }
                34 -> { // Name
                    name = valueString
                }
                35 -> { // Address
                    address = valueString
                }
                36 -> { // Birth
                    birth = valueString
                }
                37 -> { // Sex
                    sex = when(valueString) {
                        "1" -> "男性"
                        "2" -> "女性"
                        "9" -> "適用不能"
                        else -> "不明"
                    }
                }
            }
        }
        return Attributes(name, address, birth, sex)
    }
}
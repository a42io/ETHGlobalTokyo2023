package dev.a42.mynasigner

// source: https://github.com/ishihatta/mynacard-android-demo/blob/main/app/src/main/java/com/ishihata_tech/myna_card_demo/myna/Extensions.kt
import com.hierynomus.asn1.ASN1InputStream
import com.hierynomus.asn1.encodingrules.der.DERDecoder
import java.io.ByteArrayInputStream

fun String.hexToByteArray(): ByteArray =
    chunked(2).map { it.toInt(16).toByte() }.toByteArray()

fun ByteArray.toHexString(): String = joinToString(separator = "") { eachByte -> "%02X".format(eachByte) }

fun ByteArray.asn1FrameIterator(): Iterator<ASN1Frame> {
    return object: Iterator<ASN1Frame> {
        private val decoder = DERDecoder()
        private val byteArrayInputStream = ByteArrayInputStream(this@asn1FrameIterator)
        private val asn1InputStream = ASN1InputStream(decoder, byteArrayInputStream)

        override fun hasNext(): Boolean = byteArrayInputStream.available() > 0

        override fun next(): ASN1Frame {
            if (!hasNext()) throw NoSuchElementException()
            val tag = decoder.readTag(asn1InputStream)
            val length = decoder.readLength(asn1InputStream)
            val position = this@asn1FrameIterator.size - byteArrayInputStream.available()
            val frameSize = length + position
            val value: ByteArray? = try {
                decoder.readValue(length, asn1InputStream)
            } catch (e: Exception) {
                null
            }
            return ASN1Frame(tag.tag, length, frameSize, value)
        }
    }
}
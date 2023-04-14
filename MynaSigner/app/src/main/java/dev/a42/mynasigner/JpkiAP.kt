package dev.a42.mynasigner

// source: https://github.com/ishihatta/mynacard-android-demo/blob/main/app/src/main/java/com/ishihata_tech/myna_card_demo/myna/JpkiAP.kt
import java.io.ByteArrayInputStream
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate

class JpkiAP(private val reader: Reader) {
    fun lookupAuthPin(): Int {
        reader.selectEF("0018".hexToByteArray()) // JPKI認証用PIN
        return reader.lookupPin()
    }

    fun verifyAuthPin(pin: String): Boolean {
        reader.selectEF("0018".hexToByteArray())
        return reader.verify(pin)
    }

    fun lookupSignPin(): Int {
        reader.selectEF("001B".hexToByteArray()) // JPKI署名用PIN
        return reader.lookupPin()
    }

    fun verifySignPin(pin: String): Boolean {
        reader.selectEF("001B".hexToByteArray())
        return reader.verify(pin)
    }

    fun readAuthCertificate(): X509Certificate {
        return readCertificate("000A".hexToByteArray())
    }

    fun readAuthCACertificate(): X509Certificate {
        return readCertificate("000B".hexToByteArray())
    }

    private fun readCertificate(efid: ByteArray): X509Certificate {
        reader.selectEF(efid)

        // 読み込むべきサイズを取得する
        val tempData = reader.readBinary(7)
        val sizeToRead = tempData.asn1FrameIterator().next().frameSize

        // 全体を読み込む
        val realData = reader.readBinary(sizeToRead)

        // 証明書のデコード
        val certificateFactory = CertificateFactory.getInstance("X.509")
        return certificateFactory.generateCertificate(ByteArrayInputStream(realData)) as X509Certificate
    }

    fun authSignature(nonce: ByteArray): ByteArray {
        reader.selectEF("0017".hexToByteArray()) // JPKI認証用秘密鍵
        return reader.signature(nonce)
    }
}
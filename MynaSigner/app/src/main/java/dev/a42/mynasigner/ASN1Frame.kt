package dev.a42.mynasigner

// source: https://github.com/ishihatta/mynacard-android-demo/blob/main/app/src/main/java/com/ishihata_tech/myna_card_demo/myna/ASN1Frame.kt
class ASN1Frame(
    val tag: Int,
    val length: Int,
    val frameSize: Int,
    val value: ByteArray? = null
)
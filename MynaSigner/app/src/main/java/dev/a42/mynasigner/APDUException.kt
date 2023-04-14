package dev.a42.mynasigner

// source: https://github.com/ishihatta/mynacard-android-demo/blob/main/app/src/main/java/com/ishihata_tech/myna_card_demo/myna/APDUException.kt
class APDUException(val sw1: Byte, val sw2: Byte): Exception()

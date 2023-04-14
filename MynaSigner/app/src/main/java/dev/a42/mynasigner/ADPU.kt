package dev.a42.mynasigner

// source: https://github.com/ishihatta/mynacard-android-demo/blob/main/app/src/main/java/com/ishihata_tech/myna_card_demo/myna/APDU.kt
class APDU(val command: ByteArray) {
    companion object {
        fun newAPDUCase1(cla: Byte, ins: Byte, p1: Byte, p2: Byte): APDU {
            return APDU(byteArrayOf(cla, ins, p1, p2))
        }

        fun newAPDUCase2(cla: Byte, ins: Byte, p1: Byte, p2: Byte, le: Int): APDU {
            return if (le <= 256) APDU(byteArrayOf(cla, ins, p1, p2, le.toByte()))
            else APDU(byteArrayOf(cla, ins, p1, p2, 0, le.shr(8).toByte(), le.toByte()))
        }

        fun newAPDUCase3(cla: Byte, ins: Byte, p1: Byte, p2: Byte, data: ByteArray): APDU {
            val lc = data.size
            return if (lc <= 256) {
                APDU(byteArrayOf(cla, ins, p1, p2, lc.toByte()) + data)
            } else {
                APDU(byteArrayOf(cla, ins, p1, p2, 0, lc.shr(8).toByte(), lc.toByte()) + data)
            }
        }

        fun newAPDUCase4(cla: Byte, ins: Byte, p1: Byte, p2: Byte, data: ByteArray, le: Int): APDU {
            val lc = data.size
            return if (lc <= 256 && le <= 256) {
                APDU(byteArrayOf(cla, ins, p1, p2, lc.toByte()) + data + le.toByte())
            } else {
                APDU(
                    byteArrayOf(cla, ins, p1, p2, 0, lc.shr(8).toByte(), lc.toByte())
                            + data
                            + byteArrayOf(le.shr(8).toByte(), le.toByte())
                )
            }
        }
    }
}
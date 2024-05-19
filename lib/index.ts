export function bytesArrayToHex(bytes: Uint8Array): string {
  return "0x" + Buffer.from(bytes).toString("hex")
}

export function hexToBytesArray(hex: string): Uint8Array {
  if (!hex.startsWith("0x")) {
    return Uint8Array.from(Buffer.from(hex, "hex"))
  }
  return Uint8Array.from(Buffer.from(hex.slice(2), "hex"))
}

export function truncateStringInMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  const mid = Math.floor(maxLength / 2)
  return str.slice(0, mid) + "..." + str.slice(-mid)
}

export function numberToFieldString(val: number) {
  return "0x" + val.toString(16).padStart(64, "0")
}

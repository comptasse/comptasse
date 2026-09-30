/**
 * Converts a positive integer to the letter code used to label matchings
 * ("lettrages"): 1 -> "A", 26 -> "Z", 27 -> "AA", 28 -> "AB", ...
 */
export function toMatchingCode(value: number): string {
    let code = ""
    let n = value
    while (n > 0) {
        n -= 1
        code = String.fromCharCode(65 + (n % 26)) + code
        n = Math.floor(n / 26)
    }
    return code
}

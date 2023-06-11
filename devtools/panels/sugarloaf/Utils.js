/**
 * Do nothing for a certain amount of time.
 * @aync
 * @param {Number} ms 
 * @returns {Promise} Timeout promise
 * @example
 * await asleep(2 * 1000) // sleeps for two seconds
 */
export function asleep(ms=0) {
  return new Promise(
    (resolve)=> setTimeout(resolve, ms))
}
import { asleep } from './Utils.js'
import { Constants, evalInPage } from './panel.js'

/**
 * Create an <input> element given a JavaScript value
 * @param {any} value 
 * @param {'string' | 'number' | 'checkbox'} type `<input type="">`
 * @param {String[]} statePath `SugarCube.State.active` value path
 * @returns {HTMLInputElement} `<input>`
 * @example
 * -> inputForValue('lorem')
 * <- <input type="string" (value="lorem")>
 * -> inputForValue(32)
 * <- <input type="number" (value="32")>
 * -> inputForValue(true)
 * <- <input type="checkbox" checked>
 */
function inputForValue(value, type, statePath) {
  // Turn path array into a string
  // This will later be used for a tab eval expression
  statePath = statePath
    .join('.')                   // ['a', 24, 'c'] -> 'a.24.c'
    .replace(/\.(\d+)/g, '[$1]') // 'a.24.c'       -> 'a[24].c'

  const input = document.createElement('input')

  input.type = type
  input.dataset.path = statePath
  input.placeholder = value
  
  // Figure out if we're working with `input.checked` or `input.value`
  const isCheckbox = (type === 'checkbox')
  const valueProperty = isCheckbox ? 'checked' : 'value'

  // Set the initial value (from current SugarCube state)
  input[valueProperty] = value

  /**
   * Update the current SugarCube state parameter with the current <input> value.
   * @param {Event} event
   * @returns {Promise<null>}
   */
  async function updateParameter(event) {
    // Guard clause for text inputs
    if (!isCheckbox && event.key !== 'Enter')
      return

    // Unfocus current <input>
    input.blur()

    // Just in case, give the value some time to change
    await asleep(500)

    // Value that will be overwrite the current state
    const newValue = isCheckbox
      ? Boolean(input[valueProperty]) // input.checked
      : input[valueProperty]          // input.value

    const finalValue = (typeof newValue === 'string')
      ? `'${newValue}'` // "'value'"
      : newValue        // 128

    const evalExpression =
      `${Constants.ACTIVE_SUGARCUBE_STATE_PATH}.${statePath} = ${finalValue}`

    console.log(evalExpression)

    // Overwrite the value in the active SugarCube state
    await evalInPage(evalExpression)
  }

  input.onkeydown = updateParameter
  input.onblur    = updateParameter
  input.onchange  = updateParameter

  return input
}

/**
 * Determines what type method should be used for a given value and applies it.
 * @returns {HTMLElement}
 * @example
 * -> Velement.determineMethod(64)
 * <- <input type="number" (value="64")> // typeof 64 -> 'number' -> Velement.number
 * -> Velement.determineMethod(()=> {})
 * <- <span>() => {}</span> // typeof (()=> {}) -> 'function' -> Velement.other
 */
function determineVelementMethod(value) {
  return Velement[typeof value] || Velement.other
}

/**
 * Turn a JavaScript value into an HTML element
 */
class Velement {
  static bigint  = Velement.number
  static number  = (value, path)=> inputForValue(value, 'number',   path)
  static string  = (value, path)=> inputForValue(value, 'text',     path)
  static boolean = (value, path)=> inputForValue(value, 'checkbox', path)

  /**
   * @param {Object} object 
   * @param {String[]} path `SugarCube.State.active` value path
   * @returns {HTMLDivElement} `<div>`
   */
  static object(object, path=[]) {
    const div = document.createElement('div')
    div.className = 'object'

    // Loop over the keys and values of the passed `object`
    // {a: 0, b: 1} -> [['a', 0], ['b', 1]]
    for (const [key, value] of Object.entries(object)) {
      // Skip properties with `Empty` values
      if (!value)
        continue

      // Copy of the current path, needed for recursivity
      const newPath = [...path]

      // Append current property name to the path copy
      newPath.push(key)

      // Create a <label> for the key
      const label = document.createElement('label')
      label.innerText = key

      // Append <label> to the parent object <div>
      div.appendChild(label)

      // If the current `value` is an object, it will result in another <div>
      // coming right after the <label>
      if (typeof value === 'object') {
        // So mark the <label> as clickable
        label.classList.add('clickable')
        
        // And collapse/expand the <div> upon clicking the <label>
        label.onclick =()=> label
          .nextElementSibling
          .classList
          .toggle('collapsed')
      }

      // Gets assign a Velement method
      const elementify = determineVelementMethod(value)

      // Create an HTML element with the appropriate Velement method
      const valueElement = elementify(value, newPath)

      // Append the value element to the parent object <div>
      div.appendChild(valueElement)
    }

    // Return parent
    return div
  }

  // Unhandled types get turned into a span
  static other(value) {
    const span = document.createElement(span)
    span.innerText = String(value)
    return span
  }
}

export default Velement
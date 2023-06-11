import Velement from './Velement.js'

export class Constants {
  static ACTIVE_SUGARCUBE_STATE_PATH = 'SugarCube.State.active'
}

// Container for initial DOM elements
export class Elements {
  static main = document.querySelector('main')

  static FloatingButtons = {
    collapseAll:
      document.getElementById('collapse-all'),
    expandAll:
      document.getElementById('expand-all'),
    refreshState:
      document.getElementById('refresh-state'),
  }
}

Elements.FloatingButtons.refreshState.onclick = refreshState

Elements.FloatingButtons.collapseAll.onclick = function() {
  for (const div of [...document.querySelectorAll('.object')])
    div.classList.add('collapsed')
}

Elements.FloatingButtons.expandAll.onclick = function() {
  for (const div of [...document.querySelectorAll('.object')])
    div.classList.remove('collapsed')
}

/**
 * Run `eval()` on the active tab's page and get the return value.
 * @async
 * @param {String} expression 
 * @returns {Promise} Eval result value or exception information
 * @example
 * -> await evalInPage('location.origin')
 * <- 'https://example.com'
 */
export function evalInPage(expression) {
  return new Promise((resolve, reject)=> {
    /**
     * @async
     * @param {any} evalResult
     * @param {String} error 
     * @returns 
     */
    function evalCallback(evalResult, error) {
      // Guard clause in case of error
      if (error) {
        console.error(error.value)
        return reject(error)
      }

      // If everything went swell resolve the promise with the resulted value
      return resolve(evalResult)
    }

    // Run eval on the page and use above callback to resolve
    // the encapsulating promise
    chrome.devtools.inspectedWindow
      .eval(expression, null, evalCallback)
  })
}

/**
 * Load the current SugarCube state into the DevTools panel
 * @async
 */
export async function refreshState() {
  const activeStateObject = await evalInPage(Constants.ACTIVE_SUGARCUBE_STATE_PATH)
  console.log(activeStateObject)

  const parameterElements = [...Velement.object(activeStateObject).children]

  Elements.main.innerHTML = ''

  for (const element of parameterElements)
    Elements.main.append(element)
}

;(async ()=> {
  console.clear()
  await refreshState()
})()
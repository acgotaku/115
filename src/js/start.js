const iframe = document.querySelector('iframe[rel="wangpan"]')
function add115JS () {
  if (iframe.contentDocument.querySelector('#js_top_panel_box')) {
    const script = document.createElement('script')
    script.src = chrome.runtime.getURL('js/115.js')
    document.body.appendChild(script)
    chrome.runtime.sendMessage({
      method: 'addScript',
      data: 'js/home.js'
    })
  }
}

if (iframe) {
  iframe.addEventListener('load', add115JS)
}

function requestAddScript (name) {
  chrome.runtime.sendMessage({
    method: 'addScript',
    data: `js/${name}.js`
  })
}
window.addEventListener('message', function (event) {
  if (event.data.type === 'yunData') {
    window.yunData = event.data.data
    requestAddScript('home')
  }
})

const iframe = document.querySelector('iframe[rel="wangpan"]')
function add115JS () {
  const script = iframe.createElement('script')
  script.src = chrome.runtime.getURL('js/115.js')
  iframe.contentDocument.body.appendChild(script)
}

if (iframe.readyState === 'complete') {
  add115JS()
} else {
  iframe.addEventListener('load', add115JS)
}

const iframe = document.querySelector('iframe[rel="wangpan"]').contentDocument
function add115JS () {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL('js/115.js')
  document.body.appendChild(script)
  chrome.runtime.sendMessage({
    method: 'addScript',
    data: 'js/home.js'
  })
}

if (iframe.contentDocument && top.location === location && iframe.contentDocument.readyState === 'complete') {
  // run on firefox
  add115JS()
} else {
  // run on chrome
  window.addEventListener('load', add115JS)
}

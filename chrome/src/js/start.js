function add115JS () {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL('js/115.js')
  document.body.appendChild(script)
  chrome.runtime.sendMessage({
    method: 'addScript',
    data: 'js/home.js'
  })
}

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    add115JS()
  }
}

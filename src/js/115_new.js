// Runs in MAIN world (injected via <script> tag).
// Intercepts fetch to cache file listing data, handles toast notifications,
// and responds to postMessage queries for selected/hovered files.

window.__115_filesCache = new Map()
window.__115_hoveredIndex = -1

const _origFetch = window.fetch
window.fetch = async function (...args) {
  const response = await _origFetch.apply(this, args)
  try {
    const url = typeof args[0] === 'string'
      ? args[0]
      : (args[0] instanceof URL ? args[0].href : (args[0] && args[0].url) || '')
    if (url && url.includes('webapi.115.com/files') && !url.includes('/download')) {
      const clone = response.clone()
      clone.json().then(data => {
        if (data && Array.isArray(data.data)) {
          const cid = new URL(url).searchParams.get('cid') || '0'
          window.__115_filesCache.set(cid, data.data)
        }
      }).catch(() => {})
    }
  } catch (e) {}
  return response
}

function getCurrentCid () {
  return new URLSearchParams(location.search).get('cid') || '0'
}

function getFileInfoFromIndex (index) {
  const cached = window.__115_filesCache.get(getCurrentCid())
  if (!cached || cached[index] === undefined) return null
  const item = cached[index]
  if (!item.sha) {
    return { isdir: true, cate_id: item.cid, path: '' }
  }
  return { isdir: false, sha1: item.sha, pick_code: item.pc, path: '' }
}

function getSelectedFiles () {
  const result = []
  document.querySelectorAll('.file-list-item[data-index]').forEach((item) => {
    const checkbox = item.querySelector('.checkbox-area input[type="checkbox"]')
    if (checkbox && checkbox.checked) {
      const index = parseInt(item.dataset.index)
      if (!isNaN(index)) {
        const info = getFileInfoFromIndex(index)
        if (info) result.push(info)
      }
    }
  })
  return result
}

function getHoveredFiles () {
  if (window.__115_hoveredIndex < 0) return []
  const info = getFileInfoFromIndex(window.__115_hoveredIndex)
  return info ? [info] : []
}

document.addEventListener('contextmenu', (event) => {
  const item = event.target.closest('.file-list-item[data-index]')
  if (item) {
    window.__115_hoveredIndex = parseInt(item.dataset.index)
  }
}, true)

function showToast (message, type) {
  let toast = document.getElementById('__115_ext_toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = '__115_ext_toast'
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '2147483647',
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#fff',
      transition: 'opacity 0.3s ease',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      pointerEvents: 'none'
    })
    document.body.appendChild(toast)
  }
  const colors = { inf: '#4caf50', err: '#f44336', war: '#ff9800' }
  toast.style.background = colors[type] || colors.inf
  toast.style.opacity = '1'
  toast.textContent = message
  clearTimeout(toast._timer)
  toast._timer = setTimeout(() => { toast.style.opacity = '0' }, 3000)
}

window.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return
  switch (event.data.type) {
    case 'getSelected':
      window.postMessage({ type: 'selected', data: getSelectedFiles() }, location.origin)
      break
    case 'getHovered':
      window.postMessage({ type: 'hovered', data: getHoveredFiles() }, location.origin)
      break
    case 'showToast':
      showToast(event.data.data.message, event.data.data.type)
      break
  }
})

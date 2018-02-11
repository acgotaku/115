class Disk {
  constructor () {
    this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument
  }
  // Type类型有
  // inf err war
  showToast ({message, type}) {
    window.Core.MinMessage.Show({
      text: message,
      type: type,
      timeout: 1000
    })
  }
  startListen () {
    window.addEventListener('message', (event) => {
      if (event.data.type && event.data.type === 'getSelected') {
        window.postMessage({ type: 'selected', data: this.getSelected() }, location.origin)
      }
      if (event.data.type && event.data.type === 'showToast') {
        this.showToast(event.data.data)
      }
    })
  }
  getSelected () {
    const selected = []
    const list = this.context.querySelectorAll('li[rel="item"]')
    Array.from(list).forEach((item) => {
      const type = item.getAttribute('file_type')
      // file
      if (type === '1' && item.classList.contains('selected')) {
        selected.push({
          isdir: false,
          sha1: item.getAttribute('sha1'),
          pick_code: item.getAttribute('pick_code'),
          path: ''
        })
      }
      // fold
      if (type === '0' && item.classList.contains('selected')) {
        selected.push({
          isdir: true,
          cate_id: item.getAttribute('cate_id'),
          path: ''
        })
      }
    })
    return selected
  }
}

const disk = new Disk()

disk.startListen()

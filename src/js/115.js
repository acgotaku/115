class Disk {
  constructor () {
    this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument
  }

  // Type类型有
  // inf err war
  showToast ({ message, type }) {
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
      if (event.data.type && event.data.type === 'getHovered') {
        window.postMessage({ type: 'hovered', data: this.getHovered() }, location.origin)
      }
      if (event.data.type && event.data.type === 'showToast') {
        this.showToast(event.data.data)
      }
      if (event.data.type && event.data.type === 'refresh') {
        this.refresh()
      }
    })
  }

  refresh () {
    this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument
  }

  getFileInfoFromElements (list) {
    const selected = []
    Array.from(list).forEach((item) => {
      const type = item.getAttribute('file_type')
      // file
      if (type === '1') {
        selected.push({
          isdir: false,
          sha1: item.getAttribute('sha1'),
          pick_code: item.getAttribute('pick_code'),
          path: ''
        })
      }
      // fold
      if (type === '0') {
        selected.push({
          isdir: true,
          cate_id: item.getAttribute('cate_id'),
          path: ''
        })
      }
    })
    return selected
  }

  getSelected () {
    const list = this.context.querySelectorAll('li[rel="item"].selected')
    return this.getFileInfoFromElements(list)
  }

  getHovered () {
    const list = this.context.querySelectorAll('li[rel="item"].hover')
    return this.getFileInfoFromElements(list)
  }
}

const disk = new Disk()

disk.startListen()

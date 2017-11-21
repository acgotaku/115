class Disk {
  constructor () {
    this.context = document.querySelector('iframe[rel="wangpan"]')
  }
  // 封装的百度的Toast提示消息
  // Type类型有
  // caution       警告  failure       失败  loading      加载 success      成功
  showToast ({message, type}) {
    this.context.ui.tip({
      mode: type,
      msg: message
    })
  }
  startListen () {
    window.addEventListener('message', (event) => {
      if (event.data.type && event.data.type === 'getSelected') {
        window.postMessage({ type: 'selected', data: this.context.list.getSelected() }, location.origin)
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
          pick_code: item.getAttribute('pick_code')
        })
      }
      // fold
      if (type === '0' && item.classList.contains('selected')) {
        selected.push({
          isdir: true,
          cate_id: item.getAttribute('cate_id')
        })
      }
    })
    return selected
  }
}

const disk = new Disk()

disk.startListen()

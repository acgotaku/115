import Core from './lib/core'
import UI from './lib/ui'
import Downloader from './lib/downloader'

class Home extends Downloader {
  constructor () {
    const search = {
      dir: '',
      channel: 'chunlei',
      clienttype: 0,
      web: 1
    }
    const listParameter = {
      search,
      url: `/api/list?`,
      options: {
        credentials: 'include',
        method: 'GET'
      }
    }
    super(listParameter)
    this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument
    console.log(this.context)
    UI.init()
    UI.addMenu(this.context.querySelector('#js_top_panel_box'), 'beforeend')
    Core.requestCookies([{ url: 'http://115.com/', name: 'UID' }, { url: 'http://115.com/', name: 'CID' }, { url: 'http://115.com/', name: 'SEID' }])
    Core.showToast('初始化成功!', 'inf')
    this.mode = 'RPC'
    this.rpcURL = 'http://localhost:6800/jsonrpc'
  }

  startListen () {
    window.addEventListener('message', (event) => {
      if (event.source !== window) {
        return
      }

      if (event.data.type && event.data.type === 'selected') {
        this.reset()
        const selectedFile = event.data.data
        if (selectedFile.length === 0) {
          Core.showToast('请选择一下你要保存的文件哦', 'failure')
          return
        }
        selectedFile.forEach((item) => {
          if (item.isdir) {
            this.addFolder(item.path)
          } else {
            this.addFile(item)
          }
        })
        this.start(Core.getConfigData('interval'), (fileDownloadInfo) => {
          if (this.mode === 'RPC') {
            Core.aria2RPCMode(this.rpcURL, fileDownloadInfo)
          }
          if (this.mode === 'TXT') {
            Core.aria2TXTMode(fileDownloadInfo)
            document.querySelector('#textMenu').classList.add('open-o')
          }
        })
      }
    })
    const menuButton = document.querySelector('#aria2List')
    menuButton.addEventListener('click', (event) => {
      const rpcURL = event.target.dataset.url
      if (rpcURL) {
        this.rpcURL = rpcURL
        this.getSelected()
        this.mode = 'RPC'
      }
      if (event.target.id === 'aria2Text') {
        this.getSelected()
        this.mode = 'TXT'
      }
    })
  }

  getSelected () {
    window.postMessage({ type: 'getSelected' }, location.origin)
  }
  getPrefixLength () {
    const path = Core.getHashParameter('list/path') || Core.getHashParameter('path')
    return path.length === 1 ? path.length : path.length + 1
  }
  getFiles (files) {
    const prefix = this.getPrefixLength()
    for (let key in files) {
      this.fileDownloadInfo.push({
        name: files[key].path.substr(prefix),
        link: `${location.protocol}//pcs.baidu.com/rest/2.0/pcs/file?method=download&app_id=250528&path=${encodeURIComponent(files[key].path)}`,
        md5: files[key].md5
      })
    }
    return Promise.resolve()
  }
}

const home = new Home()

home.startListen()

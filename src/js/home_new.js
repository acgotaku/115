import Core from './lib/core'
import UI from './lib/ui'
import Downloader from './lib/downloader'
import Secret from './lib/secret'
import Store from './lib/store'

class HomeNew extends Downloader {
  constructor () {
    const search = {
      aid: 1,
      limit: 1000,
      show_dir: 1,
      cid: ''
    }
    const listParameter = {
      search,
      url: `${location.protocol}//webapi.115.com/files?`,
      options: {
        credentials: 'include',
        method: 'GET'
      }
    }
    super(listParameter)
    this.mode = 'RPC'
    this.rpcURL = 'http://localhost:6800/jsonrpc'
  }

  initialize () {
    UI.addSettingUI()
    UI.addTextExport()
    this.injectMenu()
    Store.on('updateView', (configData) => {
      this.updateRPCMenu(configData)
    })
    Store.trigger('initConfigData')
    Core.showToast('初始化成功!', 'inf')
    return this
  }

  injectMenu () {
    if (document.querySelector('#exportMenu')) return
    const moreButton = document.querySelector('button[title="更多操作"]')
    if (!moreButton) return

    const menuHTML = `
      <div id="exportMenu" class="export">
        <a class="export-button">导出下载</a>
        <div id="aria2List" class="export-menu">
          <a class="export-menu-item" id="batchOpen" href="javascript:void(0);">批量打开</a>
          <a class="export-menu-item" id="aria2Text" href="javascript:void(0);">文本导出</a>
          <a class="export-menu-item" id="settingButton" href="javascript:void(0);">设置</a>
        </div>
      </div>`

    moreButton.insertAdjacentHTML('beforebegin', menuHTML)

    const exportMenu = document.querySelector('#exportMenu')
    exportMenu.addEventListener('mouseenter', () => exportMenu.classList.add('open-o'))
    exportMenu.addEventListener('mouseleave', () => exportMenu.classList.remove('open-o'))

    document.querySelector('#settingButton').addEventListener('click', () => {
      document.querySelector('#settingMenu').classList.add('open-o')
    })

    document.querySelector('#aria2Text').addEventListener('click', () => {
      this.mode = 'TXT'
      this.getSelected()
    })

    document.querySelector('#batchOpen').addEventListener('click', () => {
      this.mode = 'OPEN'
      this.getSelected()
    })

    // Prevent clicks inside dropdown from deselecting files
    document.querySelector('#aria2List').addEventListener('mousedown', (event) => {
      event.stopPropagation()
    })

    // Populate RPC buttons if config already loaded
    const configData = Store.getConfigData()
    if (configData && configData.rpcList) {
      this.updateRPCMenu(configData)
    }
  }

  updateRPCMenu (configData) {
    const aria2List = document.querySelector('#aria2List')
    if (!aria2List) return

    aria2List.querySelectorAll('.rpc-button').forEach(btn => btn.remove())

    const { rpcList } = configData
    let html = ''
    rpcList.forEach((rpc) => {
      html += `<a class="export-menu-item rpc-button" href="javascript:void(0);" data-url="${rpc.url}">${rpc.name}</a>`
    })
    aria2List.insertAdjacentHTML('afterbegin', html)

    aria2List.querySelectorAll('.rpc-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.rpcURL = btn.dataset.url
        this.mode = 'RPC'
        this.getSelected()
      })
    })
  }

  startListen () {
    const exportFiles = (files) => {
      files.forEach((item) => {
        if (item.isdir) {
          this.addFolder(item)
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
        if (this.mode === 'OPEN') {
          for (const f of fileDownloadInfo) {
            window.open('https://115.com/?ct=play&ac=location&pickcode=' + f.pickcode)
          }
        }
      })
    }

    window.addEventListener('message', (event) => {
      const type = event.data && event.data.type
      if (!type) return
      if (type === 'selected' || type === 'hovered') {
        this.reset()
        const selectedFile = event.data.data
        if (selectedFile.length === 0) {
          Core.showToast('请选择一下你要保存的文件哦', 'war')
          return
        }
        exportFiles(selectedFile)
      }
    })

    // Re-inject menu when React re-renders the toolbar during SPA navigation
    const observer = new MutationObserver(() => {
      if (!document.querySelector('#exportMenu') && document.querySelector('button[title="更多操作"]')) {
        this.injectMenu()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    // Also catch history.pushState-based navigation
    const origPushState = history.pushState
    history.pushState = (...args) => {
      origPushState.apply(history, args)
      this.onNavigate()
    }
    window.addEventListener('popstate', () => this.onNavigate())
  }

  onNavigate () {
    setTimeout(() => {
      if (!document.querySelector('#exportMenu') && document.querySelector('button[title="更多操作"]')) {
        this.injectMenu()
      }
    }, 500)
  }

  getSelected () {
    window.postMessage({ type: 'getSelected' }, location.origin)
  }

  getHovered () {
    window.postMessage({ type: 'getHovered' }, location.origin)
  }

  getFile (pickcode) {
    return Core.getConfigData('vip')
      ? this.getFileFromProAPI(pickcode)
      : this.getFileFromWebAPI(pickcode)
  }

  getFileFromWebAPI (pickcode) {
    const options = { credentials: 'include', method: 'GET' }
    return new Promise((resolve) => {
      Core.sendToBackground('fetch', {
        url: `${location.protocol}//webapi.115.com/files/download?pickcode=${pickcode}`,
        options
      }, (data) => {
        if (data.file_url) {
          const pathMatch = data.file_url.match(/.*115.com(\/.*\/)/)
          const path = pathMatch ? pathMatch[1] : '/'
          Core.requestCookies([{ path }]).then((cookies) => {
            data.cookies = cookies
            resolve(data)
          })
        } else {
          Core.showToast('无法获取下载地址!', 'err')
          resolve(pickcode)
        }
      })
    })
  }

  getFileFromProAPI (pickcode) {
    const now = Date.now()
    const timestamp = Math.floor(now / 1000)
    const { data, key } = Secret.encode(JSON.stringify({ pickcode }), timestamp)
    const options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      method: 'POST',
      body: `data=${encodeURIComponent(data)}`
    }
    return new Promise((resolve) => {
      Core.sendToBackground('fetch', {
        url: `https://proapi.115.com/app/chrome/downurl?t=${timestamp}`,
        options
      }, (json) => {
        if (json.state) {
          const result = JSON.parse(Secret.decode(json.data, key))
          const fileData = Object.values(result).pop()
          fileData.pickcode = fileData.pick_code
          fileData.file_url = fileData.url.url
          if (fileData.file_url) {
            Core.requestCookies([{ url: 'https://proapi.115.com/', name: 'acw_tc' }]).then((cookies) => {
              fileData.cookies = cookies
              resolve(fileData)
            })
          } else {
            Core.showToast('无法获取下载地址!', 'err')
            resolve(pickcode)
          }
        } else {
          resolve(pickcode)
        }
      })
    })
  }

  async getFiles (files) {
    for (const pickcode in files) {
      await this.sleep(Core.getConfigData('interval'))
      const file = await this.getFile(pickcode)
      if (this.isObject(file)) {
        this.fileDownloadInfo.push({
          name: files[file.pickcode].path + file.file_name,
          link: file.file_url,
          size: file.file_size,
          sha1: files[file.pickcode].sha1,
          cookies: file.cookies,
          pickcode: file.pickcode
        })
      } else {
        console.log(files[file])
      }
    }
  }

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  isObject (obj) {
    return obj !== null && typeof obj === 'object'
  }
}

function waitForElement (selector, callback, timeout = 15000) {
  if (document.querySelector(selector)) {
    callback()
    return
  }
  const observer = new MutationObserver(() => {
    if (document.querySelector(selector)) {
      observer.disconnect()
      callback()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  setTimeout(() => observer.disconnect(), timeout)
}

const homeNew = new HomeNew()

waitForElement('button[title="更多操作"]', () => {
  homeNew.initialize().startListen()
})

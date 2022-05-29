import Store from './store'

class Core {
  constructor () {
    this.cookies = {}
  }

  httpSend ({ url, options }, resolve, reject) {
    fetch(url, options).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          resolve(data)
        })
      } else {
        reject(response)
      }
    }).catch((err) => {
      reject(err)
    })
  }

  getConfigData (key = null) {
    return Store.getConfigData(key)
  }

  objectToQueryString (obj) {
    return Object.keys(obj).map((key) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`
    }).join('&')
  }

  sendToBackground (method, data, callback) {
    chrome.runtime.sendMessage({
      method,
      data
    }, callback)
  }

  showToast (message, type) {
    window.postMessage({ type: 'showToast', data: { message, type } }, location.origin)
  }

  getHashParameter (name) {
    const hash = window.location.hash
    const paramsString = hash.substr(1)
    const searchParams = new URLSearchParams(paramsString)
    return searchParams.get(name)
  }

  formatCookies () {
    const cookies = []
    for (const key in this.cookies) {
      cookies.push(`${key}=${this.cookies[key]}`)
    }
    return cookies.join('; ')
  }

  getHeader (type = 'RPC') {
    const headerOption = []
    const useBrowserUA = this.getConfigData('browserUserAgent')
    let userAgent = this.getConfigData('userAgent')
    if (useBrowserUA) {
      const browserUA = navigator.userAgent
      if (browserUA && browserUA.length) {
        userAgent = browserUA
      }
    }
    headerOption.push(`User-Agent: ${userAgent}`)
    headerOption.push(`Referer: ${this.getConfigData('referer')}`)
    headerOption.push(`Cookie: ${this.formatCookies()}`)
    const headers = this.getConfigData('headers')
    if (headers) {
      headers.split('\n').forEach((item) => {
        headerOption.push(item)
      })
    }
    if (type === 'RPC') {
      return headerOption
    } else if (type === 'aria2Cmd') {
      return headerOption.map(item => `--header ${JSON.stringify(item)}`).join(' ')
    } else if (type === 'aria2c') {
      return headerOption.map(item => ` header=${item}`).join('\n')
    } else if (type === 'idm') {
      return headerOption.map((item) => {
        const headers = item.split(': ')
        return `${headers[0].toLowerCase()}: ${headers[1]}`
      }).join('\r\n')
    }
  }

  // 解析 RPC地址 返回验证数据 和地址
  parseURL (url) {
    const parseURL = new URL(url)
    let authStr = parseURL.username ? `${parseURL.username}:${decodeURI(parseURL.password)}` : null
    if (authStr) {
      if (!authStr.includes('token:')) {
        authStr = `Basic ${btoa(authStr)}`
      }
    }
    const paramsString = parseURL.hash.substr(1)
    const options = {}
    const searchParams = new URLSearchParams(paramsString)
    for (const searchParam of searchParams) {
      const [option, value] = searchParam
      options[option] = value.length ? value : 'enabled'
    }
    const path = parseURL.origin + parseURL.pathname
    return { authStr, path, options }
  }

  generateParameter (authStr, path, data) {
    if (authStr && authStr.startsWith('token')) {
      data.params.unshift(authStr)
    }
    const parameter = {
      url: path,
      options: {
        method: 'POST',
        headers: {},
        body: JSON.stringify(data)
      }
    }
    if (authStr && authStr.startsWith('Basic')) {
      parameter.options.headers.Authorization = authStr
    }
    return parameter
  }

  // get aria2 version
  getVersion (rpcPath, element) {
    const data = {
      jsonrpc: '2.0',
      method: 'aria2.getVersion',
      id: 1,
      params: []
    }
    const { authStr, path } = this.parseURL(rpcPath)
    this.sendToBackground('rpcVersion', this.generateParameter(authStr, path, data), (version) => {
      if (version) {
        element.innerText = `Aria2版本为: ${version}`
      } else {
        element.innerText = '错误,请查看是否开启Aria2'
      }
    })
  }

  copyText (text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('拷贝成功~', 'inf')
      }).catch(() => {
        this.showToast('拷贝失败 QAQ', 'err')
      })
    } else {
      this.showToast('拷贝失败 QAQ', 'err')
    }
  }

  // cookies format  [{"url": "http://pan.baidu.com/", "name": "BDUSS"},{"url": "http://pcs.baidu.com/", "name": "pcsett"}]
  requestCookies (cookies) {
    return new Promise((resolve) => {
      this.sendToBackground('getCookies', cookies, (value) => {
        resolve(value)
      })
    })
  }

  aria2RPCMode (rpcPath, fileDownloadInfo) {
    const { authStr, path, options } = this.parseURL(rpcPath)
    const small = this.getConfigData('small')

    if (small) {
      fileDownloadInfo.sort((a, b) => a.size - b.size)
    }

    fileDownloadInfo.forEach((file) => {
      this.cookies = file.cookies
      const rpcData = {
        jsonrpc: '2.0',
        method: 'aria2.addUri',
        id: new Date().getTime(),
        params: [
          [file.link], {
            out: file.name,
            header: this.getHeader()
          }
        ]
      }
      const sha1Check = this.getConfigData('sha1Check')
      const rpcOption = rpcData.params[1]
      const dir = this.getConfigData('downloadPath')
      if (dir) {
        rpcOption.dir = dir
      }
      if (sha1Check) {
        rpcOption.checksum = `sha-1=${file.sha1}`
      }
      if (options) {
        for (const key in options) {
          rpcOption[key] = options[key]
        }
      }
      this.sendToBackground('rpcData', this.generateParameter(authStr, path, rpcData), (success) => {
        if (success) {
          this.showToast('下载成功!赶紧去看看吧~', 'inf')
        } else {
          this.showToast('下载失败!是不是没有开启Aria2?', 'err')
        }
      })
    })
  }

  aria2TXTMode (fileDownloadInfo) {
    const aria2CmdTxt = []
    const aria2Txt = []
    const idmTxt = []
    const downloadLinkTxt = []
    const prefixTxt = 'data:text/plain;charset=utf-8,'
    fileDownloadInfo.forEach((file) => {
      this.cookies = file.cookies
      let aria2CmdLine = `aria2c -c -s10 -k1M -x16 --enable-rpc=false -o ${JSON.stringify(file.name)} ${this.getHeader('aria2Cmd')} ${JSON.stringify(file.link)}`
      let aria2Line = [file.link, this.getHeader('aria2c'), ` out=${file.name}`].join('\n')
      const sha1Check = this.getConfigData('sha1Check')
      if (sha1Check) {
        aria2CmdLine += ` --checksum=sha-1=${file.sha1}`
        aria2Line += `\n checksum=sha-1=${file.sha1}`
      }
      aria2CmdTxt.push(aria2CmdLine)
      aria2Txt.push(aria2Line)
      const idmLine = ['<', file.link, this.getHeader('idm'), '>'].join('\r\n')
      idmTxt.push(idmLine)
      downloadLinkTxt.push(file.link)
    })
    document.querySelector('#aria2CmdTxt').value = `${aria2CmdTxt.join('\n')}`
    document.querySelector('#aria2Txt').href = `${prefixTxt}${encodeURIComponent(aria2Txt.join('\n'))}`
    document.querySelector('#idmTxt').href = `${prefixTxt}${encodeURIComponent(idmTxt.join('\r\n') + '\r\n')}`
    document.querySelector('#downloadLinkTxt').href = `${prefixTxt}${encodeURIComponent(downloadLinkTxt.join('\n'))}`
    document.querySelector('#copyDownloadLinkTxt').dataset.link = downloadLinkTxt.join('\n')
  }
}

export default new Core()

import Core from './core'

class Downloader {
  constructor (listParameter) {
    this.listParameter = listParameter
    this.fileDownloadInfo = []
    this.currentTaskId = 0
    this.completedCount = 0
    this.folders = []
    this.files = {}
  }

  start (interval = 300, done) {
    this.interval = interval
    this.done = done
    this.currentTaskId = new Date().getTime()
    this.getNextFile(this.currentTaskId)
  }

  reset () {
    this.fileDownloadInfo = []
    this.currentTaskId = 0
    this.folders = []
    this.files = {}
    this.completedCount = 0
  }

  addFolder (item) {
    this.folders.push(item)
  }

  addFile (file) {
    this.files[file.pick_code] = file
  }

  getNextFile (taskId) {
    if (taskId !== this.currentTaskId) {
      return
    }
    if (this.folders.length !== 0) {
      this.completedCount++
      Core.showToast(`正在获取文件列表... ${this.completedCount}/${this.completedCount + this.folders.length - 1}`, 'inf')
      const fold = this.folders.pop()
      this.listParameter.search.cid = fold.cate_id
      fetch(`${this.listParameter.url}${Core.objectToQueryString(this.listParameter.search)}`, this.listParameter.options).then((response) => {
        if (response.ok) {
          response.json().then((data) => {
            setTimeout(() => this.getNextFile(taskId), this.interval)
            const path = fold.path + data.path[data.path.length - 1].name + '/'
            data.data.forEach((item) => {
              if (!item.sha) {
                this.folders.push({
                  cate_id: item.cid,
                  path
                })
              } else {
                this.files[item.pc] = {
                  path,
                  isdir: false,
                  sha1: item.sha,
                  pick_code: item.pc
                }
              }
            })
          })
        } else {
          console.log(response)
        }
      }).catch((err) => {
        Core.showToast('网络请求失败', 'err')
        console.log(err)
        setTimeout(() => this.getNextFile(taskId), this.interval)
      })
    } else if (this.files.length !== 0) {
      Core.showToast('正在获取下载地址...', 'inf')
      this.getFiles(this.files).then(() => {
        this.done(this.fileDownloadInfo)
      })
    } else {
      Core.showToast('一个文件都没有哦...', 'war')
      this.reset()
    }
  }

  getFiles (files) {
    throw new Error('subclass should implement this method!')
  }
}

export default Downloader

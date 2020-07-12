(function () {
  'use strict';

  var EventEmitter = function EventEmitter () {
    this._listeners = {};
  };

  /**
   * @param {string} name - event name
   * @param {function(data: *): void} fn - listener function
   */
  EventEmitter.prototype.on = function on (name, fn) {
    var list = this._listeners[name] = this._listeners[name] || [];
    list.push(fn);
  };

  /**
   * @param {string} name - event name
   * @param {*} data - data to emit event listeners
   */
  EventEmitter.prototype.trigger = function trigger (name, data) {
    var fns = this._listeners[name] || [];
    fns.forEach(function (fn) { return fn(data); });
  };

  /**
   * @param {string} name - event name
   */
  EventEmitter.prototype.off = function off (name) {
    delete this._listeners[name];
  };

  var Store = /*@__PURE__*/(function (EventEmitter) {
    function Store () {
      EventEmitter.call(this);
      this.defaultRPC = [{ name: 'ARIA2 RPC', url: 'http://localhost:6800/jsonrpc' }];
      this.defaultUserAgent = 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36 115Browser/5.1.3';
      this.defaultReferer = 'https://115.com/';
      this.defaultConfigData = {
        rpcList: this.defaultRPC,
        configSync: false,
        sha1Check: false,
        ssl: false,
        interval: 300,
        downloadPath: '',
        userAgent: this.defaultUserAgent,
        browserUserAgent: true,
        referer: this.defaultReferer,
        headers: ''
      };
      this.configData = {};
      this.on('initConfigData', this.init.bind(this));
      this.on('setConfigData', this.set.bind(this));
      this.on('clearConfigData', this.clear.bind(this));
    }

    if ( EventEmitter ) Store.__proto__ = EventEmitter;
    Store.prototype = Object.create( EventEmitter && EventEmitter.prototype );
    Store.prototype.constructor = Store;

    Store.prototype.init = function init () {
      var this$1 = this;

      chrome.storage.sync.get(null, function (items) {
        var loop = function ( key ) {
          chrome.storage.local.set({ key: items[key] }, function () {
            console.log('chrome first local set: %s, %s', key, items[key]);
          });
        };

        for (var key in items) loop( key );
      });
      chrome.storage.local.get(null, function (items) {
        this$1.configData = Object.assign({}, this$1.defaultConfigData, items);
        this$1.trigger('updateView', this$1.configData);
      });
    };

    Store.prototype.getConfigData = function getConfigData (key) {
      if ( key === void 0 ) key = null;

      if (key) {
        return this.configData[key]
      } else {
        return this.configData
      }
    };

    Store.prototype.set = function set (configData) {
      this.configData = configData;
      this.save(configData);
      this.trigger('updateView', configData);
    };

    Store.prototype.save = function save (configData) {
      var obj, obj$1;

      var loop = function ( key ) {
        chrome.storage.local.set(( obj = {}, obj[key] = configData[key], obj ), function () {
          console.log('chrome local set: %s, %s', key, configData[key]);
        });
        if (configData.configSync === true) {
          chrome.storage.sync.set(( obj$1 = {}, obj$1[key] = configData[key], obj$1 ), function () {
            console.log('chrome sync set: %s, %s', key, configData[key]);
          });
        }
      };

      for (var key in configData) loop( key );
    };

    Store.prototype.clear = function clear () {
      chrome.storage.sync.clear();
      chrome.storage.local.clear();
      this.configData = this.defaultConfigData;
      this.trigger('updateView', this.configData);
    };

    return Store;
  }(EventEmitter));

  var Store$1 = new Store();

  var Core = function Core () {
    this.cookies = {};
  };

  Core.prototype.httpSend = function httpSend (ref, resolve, reject) {
      var url = ref.url;
      var options = ref.options;

    fetch(url, options).then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          resolve(data);
        });
      } else {
        reject(response);
      }
    }).catch(function (err) {
      reject(err);
    });
  };

  Core.prototype.getConfigData = function getConfigData (key) {
      if ( key === void 0 ) key = null;

    return Store$1.getConfigData(key)
  };

  Core.prototype.objectToQueryString = function objectToQueryString (obj) {
    return Object.keys(obj).map(function (key) {
      return ((encodeURIComponent(key)) + "=" + (encodeURIComponent(obj[key])))
    }).join('&')
  };

  Core.prototype.sendToBackground = function sendToBackground (method, data, callback) {
    chrome.runtime.sendMessage({
      method: method,
      data: data
    }, callback);
  };

  Core.prototype.showToast = function showToast (message, type) {
    window.postMessage({ type: 'showToast', data: { message: message, type: type } }, location.origin);
  };

  Core.prototype.getHashParameter = function getHashParameter (name) {
    var hash = window.location.hash;
    var paramsString = hash.substr(1);
    var searchParams = new URLSearchParams(paramsString);
    return searchParams.get(name)
  };

  Core.prototype.formatCookies = function formatCookies () {
    var cookies = [];
    for (var key in this.cookies) {
      cookies.push((key + "=" + (this.cookies[key])));
    }
    return cookies.join('; ')
  };

  Core.prototype.getHeader = function getHeader (type) {
      if ( type === void 0 ) type = 'RPC';

    var headerOption = [];
    var useBrowserUA = this.getConfigData('browserUserAgent');
    var userAgent = this.getConfigData('userAgent');
    if (useBrowserUA) {
      var browserUA = navigator.userAgent;
      if (browserUA && browserUA.length) {
        userAgent = browserUA;
      }
    }
    headerOption.push(("User-Agent: " + userAgent));
    headerOption.push(("Referer: " + (this.getConfigData('referer'))));
    headerOption.push(("Cookie: " + (this.formatCookies())));
    var headers = this.getConfigData('headers');
    if (headers) {
      headers.split('\n').forEach(function (item) {
        headerOption.push(item);
      });
    }
    if (type === 'RPC') {
      return headerOption
    } else if (type === 'aria2Cmd') {
      return headerOption.map(function (item) { return ("--header " + (JSON.stringify(item))); }).join(' ')
    } else if (type === 'aria2c') {
      return headerOption.map(function (item) { return (" header=" + item); }).join('\n')
    } else if (type === 'idm') {
      return headerOption.map(function (item) {
        var headers = item.split(': ');
        return ((headers[0].toLowerCase()) + ": " + (headers[1]))
      }).join('\r\n')
    }
  };

  // 解析 RPC地址 返回验证数据 和地址
  Core.prototype.parseURL = function parseURL (url) {
    var parseURL = new URL(url);
    var authStr = parseURL.username ? ((parseURL.username) + ":" + (decodeURI(parseURL.password))) : null;
    if (authStr) {
      if (!authStr.includes('token:')) {
        authStr = "Basic " + (btoa(authStr));
      }
    }
    var paramsString = parseURL.hash.substr(1);
    var options = {};
    var searchParams = new URLSearchParams(paramsString);
    for (var key of searchParams) {
      options[key[0]] = key.length === 2 ? key[1] : 'enabled';
    }
    var path = parseURL.origin + parseURL.pathname;
    return { authStr: authStr, path: path, options: options }
  };

  Core.prototype.generateParameter = function generateParameter (authStr, path, data) {
    if (authStr && authStr.startsWith('token')) {
      data.params.unshift(authStr);
    }
    var parameter = {
      url: path,
      options: {
        method: 'POST',
        headers: {},
        body: JSON.stringify(data)
      }
    };
    if (authStr && authStr.startsWith('Basic')) {
      parameter.options.headers.Authorization = authStr;
    }
    return parameter
  };

  // get aria2 version
  Core.prototype.getVersion = function getVersion (rpcPath, element) {
    var data = {
      jsonrpc: '2.0',
      method: 'aria2.getVersion',
      id: 1,
      params: []
    };
    var ref = this.parseURL(rpcPath);
      var authStr = ref.authStr;
      var path = ref.path;
    this.sendToBackground('rpcVersion', this.generateParameter(authStr, path, data), function (version) {
      if (version) {
        element.innerText = "Aria2版本为: " + version;
      } else {
        element.innerText = '错误,请查看是否开启Aria2';
      }
    });
  };

  Core.prototype.copyText = function copyText (text) {
    var input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = text;
    input.focus();
    input.select();
    var result = document.execCommand('copy');
    input.remove();
    if (result) {
      this.showToast('拷贝成功~', 'inf');
    } else {
      this.showToast('拷贝失败 QAQ', 'err');
    }
  };

  // cookies format[{"url": "http://pan.baidu.com/", "name": "BDUSS"},{"url": "http://pcs.baidu.com/", "name": "pcsett"}]
  Core.prototype.requestCookies = function requestCookies (cookies) {
      var this$1 = this;

    return new Promise(function (resolve) {
      this$1.sendToBackground('getCookies', cookies, function (value) {
        resolve(value);
      });
    })
  };

  Core.prototype.aria2RPCMode = function aria2RPCMode (rpcPath, fileDownloadInfo) {
      var this$1 = this;

    var ref = this.parseURL(rpcPath);
      var authStr = ref.authStr;
      var path = ref.path;
      var options = ref.options;
    var ssl = this.getConfigData('ssl');
    fileDownloadInfo.forEach(function (file) {
      this$1.cookies = file.cookies;
      if (ssl) {
        file.link = file.link.replace(/^(http:\/\/)/, 'https://');
      }
      var rpcData = {
        jsonrpc: '2.0',
        method: 'aria2.addUri',
        id: new Date().getTime(),
        params: [
          [file.link], {
            out: file.name,
            header: this$1.getHeader()
          }
        ]
      };
      var sha1Check = this$1.getConfigData('sha1Check');
      var rpcOption = rpcData.params[1];
      var dir = this$1.getConfigData('downloadPath');
      if (dir) {
        rpcOption.dir = dir;
      }
      if (sha1Check) {
        rpcOption.checksum = "sha-1=" + (file.sha1);
      }
      if (options) {
        for (var key in options) {
          rpcOption[key] = options[key];
        }
      }
      this$1.sendToBackground('rpcData', this$1.generateParameter(authStr, path, rpcData), function (success) {
        if (success) {
          this$1.showToast('下载成功!赶紧去看看吧~', 'inf');
        } else {
          this$1.showToast('下载失败!是不是没有开启Aria2?', 'err');
        }
      });
    });
  };

  Core.prototype.aria2TXTMode = function aria2TXTMode (fileDownloadInfo) {
      var this$1 = this;

    var aria2CmdTxt = [];
    var aria2Txt = [];
    var idmTxt = [];
    var downloadLinkTxt = [];
    var prefixTxt = 'data:text/plain;charset=utf-8,';
    var ssl = this.getConfigData('ssl');
    fileDownloadInfo.forEach(function (file) {
      this$1.cookies = file.cookies;
      if (ssl) {
        file.link = file.link.replace(/^(http:\/\/)/, 'https://');
      }
      var aria2CmdLine = "aria2c -c -s10 -k1M -x16 --enable-rpc=false -o " + (JSON.stringify(file.name)) + " " + (this$1.getHeader('aria2Cmd')) + " " + (JSON.stringify(file.link));
      var aria2Line = [file.link, this$1.getHeader('aria2c'), (" out=" + (file.name))].join('\n');
      var sha1Check = this$1.getConfigData('sha1Check');
      if (sha1Check) {
        aria2CmdLine += " --checksum=sha-1=" + (file.sha1);
        aria2Line += "\n checksum=sha-1=" + (file.sha1);
      }
      aria2CmdTxt.push(aria2CmdLine);
      aria2Txt.push(aria2Line);
      var idmLine = ['<', file.link, this$1.getHeader('idm'), '>'].join('\r\n');
      idmTxt.push(idmLine);
      downloadLinkTxt.push(file.link);
    });
    document.querySelector('#aria2CmdTxt').value = "" + (aria2CmdTxt.join('\n'));
    document.querySelector('#aria2Txt').href = "" + prefixTxt + (encodeURIComponent(aria2Txt.join('\n')));
    document.querySelector('#idmTxt').href = "" + prefixTxt + (encodeURIComponent(idmTxt.join('\r\n') + '\r\n'));
    document.querySelector('#downloadLinkTxt').href = "" + prefixTxt + (encodeURIComponent(downloadLinkTxt.join('\n')));
    document.querySelector('#copyDownloadLinkTxt').dataset.link = downloadLinkTxt.join('\n');
  };

  var Core$1 = new Core();

  var UI = function UI () {
    var this$1 = this;

    this.version = '0.3.6';
    this.updateDate = '2019/12/13';
    Store$1.on('updateView', function (configData) {
      this$1.updateSetting(configData);
      this$1.updateMenu(configData);
    });
  };

  UI.prototype.init = function init () {
    this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument;
    this.addSettingUI();
    this.addTextExport();
    Store$1.trigger('initConfigData');
  };

  UI.prototype.addMenu = function addMenu (element, position) {
    var menu = "\n      <div id=\"exportMenu\" class=\"export\">\n        <a class=\"export-button\">导出下载</a>\n        <div id=\"aria2List\" class=\"export-menu\">\n          <a class=\"export-menu-item\" id=\"batchOpen\" href=\"javascript:void(0);\">批量打开</a>\n          <a class=\"export-menu-item\" id=\"aria2Text\" href=\"javascript:void(0);\">文本导出</a>\n          <a class=\"export-menu-item\" id=\"settingButton\" href=\"javascript:void(0);\">设置</a>\n        </div>\n      </div>";
    if (element) {
      element.insertAdjacentHTML(position, menu);
    } else {
      return
    }
    var exportMenu = this.context.querySelector('#exportMenu');
    exportMenu.addEventListener('mouseenter', function () {
      exportMenu.classList.add('open-o');
    });
    exportMenu.addEventListener('mouseleave', function () {
      exportMenu.classList.remove('open-o');
    });
    var settingButton = this.context.querySelector('#settingButton');
    var settingMenu = document.querySelector('#settingMenu');
    settingButton.addEventListener('click', function (event) {
      settingMenu.classList.add('open-o');
    });
    // fix click select file
    var aria2List = this.context.querySelector('#aria2List');
    aria2List.addEventListener('mousedown', function (event) {
      event.stopPropagation();
    });
  };

  UI.prototype.addContextMenuRPCSectionWithCallback = function addContextMenuRPCSectionWithCallback (callback) {
      var this$1 = this;

    var addContextMenuRPCSection = function (node) {
      var dom = '<div class="cell" id="more-menu-rpc-section"><ul></ul></div>';
      node.insertAdjacentHTML('beforebegin', dom);
      if (this$1.mostRecentConfigData) {
        this$1.updateMenu(this$1.mostRecentConfigData);
      }
      if (callback) {
        callback();
      }
    };

    var contextMenuNode = this.context.querySelector('body > .context-menu .cell');
    if (contextMenuNode) {
      addContextMenuRPCSection(contextMenuNode);
    } else if ('MutationObserver' in window) {
      var body = this.context.querySelector('body');
      var observer = new MutationObserver(function (mutationsList) {
        var contextMenuNode = this$1.context.querySelector('body > .context-menu .cell');
        if (contextMenuNode) {
          observer.disconnect();
          addContextMenuRPCSection(contextMenuNode);
        }
      });
      observer.observe(body, {
        childList: true
      });
    }
  };

  UI.prototype.resetMenu = function resetMenu () {
    this.context.querySelectorAll('#more-menu-rpc-section li').forEach(function (item) {
      item.remove();
    });
    this.context.querySelectorAll('.rpc-button').forEach(function (rpc) {
      rpc.remove();
    });
  };

  UI.prototype.updateMenu = function updateMenu (configData) {
    this.resetMenu();
    var rpcList = configData.rpcList;
    var rpcDOMList = '';
    var contextMenuDOMList = '';
    rpcList.forEach(function (rpc) {
      var rpcDOM = "<a class=\"export-menu-item rpc-button\" href=\"javascript:void(0);\" data-url=" + (rpc.url) + ">" + (rpc.name) + "</a>";
      rpcDOMList += rpcDOM;
      contextMenuDOMList += "<li><a href=\"javascript:void(0);\" data-url=" + (rpc.url) + ">" + (rpc.name) + "</a></li>";
    });
    this.context.querySelector('#aria2List').insertAdjacentHTML('afterbegin', rpcDOMList);

    var contextMenuSection = this.context.querySelector('#more-menu-rpc-section ul');
    if (contextMenuSection) {
      contextMenuSection.insertAdjacentHTML('afterbegin', contextMenuDOMList);
    }
  };

  UI.prototype.addTextExport = function addTextExport () {
      var this$1 = this;

    var text = "\n      <div id=\"textMenu\" class=\"modal text-menu\">\n        <div class=\"modal-inner\">\n          <div class=\"modal-header\">\n            <div class=\"modal-title\">文本导出</div>\n            <div class=\"modal-close\">×</div>\n          </div>\n          <div class=\"modal-body\">\n            <div class=\"text-menu-row\">\n              <a class=\"text-menu-button\" href=\"javascript:void(0);\" id=\"aria2Txt\" download=\"aria2c.down\">存为Aria2文件</a>\n              <a class=\"text-menu-button\" href=\"javascript:void(0);\" id=\"idmTxt\" download=\"idm.ef2\">存为IDM文件</a>\n              <a class=\"text-menu-button\" href=\"javascript:void(0);\" id=\"downloadLinkTxt\" download=\"link.txt\">保存下载链接</a>\n              <a class=\"text-menu-button\" href=\"javascript:void(0);\" id=\"copyDownloadLinkTxt\">拷贝下载链接</a>\n            </div>\n            <div class=\"text-menu-row\">\n              <textarea class=\"text-menu-textarea\" type=\"textarea\" wrap=\"off\" spellcheck=\"false\" id=\"aria2CmdTxt\"></textarea>\n            </div>\n          </div>\n        </div>\n      </div>";
    document.body.insertAdjacentHTML('beforeend', text);
    var textMenu = document.querySelector('#textMenu');
    var close = textMenu.querySelector('.modal-close');
    var copyDownloadLinkTxt = textMenu.querySelector('#copyDownloadLinkTxt');
    copyDownloadLinkTxt.addEventListener('click', function () {
      Core$1.copyText(copyDownloadLinkTxt.dataset.link);
    });
    close.addEventListener('click', function () {
      textMenu.classList.remove('open-o');
      this$1.resetTextExport();
    });
  };

  UI.prototype.resetTextExport = function resetTextExport () {
    var textMenu = document.querySelector('#textMenu');
    textMenu.querySelector('#aria2Txt').href = '';
    textMenu.querySelector('#idmTxt').href = '';
    textMenu.querySelector('#downloadLinkTxt').href = '';
    textMenu.querySelector('#aria2CmdTxt').value = '';
    textMenu.querySelector('#copyDownloadLinkTxt').dataset.link = '';
  };

  UI.prototype.addSettingUI = function addSettingUI () {
      var this$1 = this;

    var setting = "\n      <div id=\"settingMenu\" class=\"modal setting-menu\">\n        <div class=\"modal-inner\">\n          <div class=\"modal-header\">\n            <div class=\"modal-title\">导出设置</div>\n            <div class=\"modal-close\">×</div>\n          </div>\n          <div class=\"modal-body\">\n            <div class=\"setting-menu-message\">\n              <label class=\"setting-menu-label orange-o\" id=\"message\"></label>\n            </div>\n            <div class=\"setting-menu-row rpc-s\">\n              <div class=\"setting-menu-name\">\n                <input class=\"setting-menu-input name-s\" spellcheck=\"false\">\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input url-s\" spellcheck=\"false\">\n                <a class=\"setting-menu-button\" id=\"addRPC\" href=\"javascript:void(0);\">添加RPC地址</a>\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">配置同步</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input type=\"checkbox\" class=\"setting-menu-checkbox configSync-s\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">SHA1校验</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input type=\"checkbox\" class=\"setting-menu-checkbox sha1Check-s\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">强制SSL下载</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input type=\"checkbox\" class=\"setting-menu-checkbox ssl-s\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">递归下载间隔</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input small-o interval-s\" type=\"number\" spellcheck=\"false\">\n                <label class=\"setting-menu-label\">(单位:毫秒)</label>\n                <a class=\"setting-menu-button version-s\" id=\"testAria2\" href=\"javascript:void(0);\">测试连接，成功显示版本号</a>\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">下载路径</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input downloadPath-s\" placeholder=\"只能设置为绝对路径\" spellcheck=\"false\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">User-Agent</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input userAgent-s\" spellcheck=\"false\">\n                <label class=\"setting-menu-label\"></label>\n                <input type=\"checkbox\" class=\"setting-menu-checkbox browser-userAgent-s\">\n                <label class=\"setting-menu-label for-checkbox\">使用浏览器 UA</label>\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">Referer</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input referer-s\" spellcheck=\"false\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">Headers</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <textarea class=\"setting-menu-input textarea-o headers-s\" type=\"textarea\" spellcheck=\"false\"></textarea>\n              </div>\n            </div><!-- /.setting-menu-row -->\n          </div><!-- /.setting-menu-body -->\n          <div class=\"modal-footer\">\n            <div class=\"setting-menu-copyright\">\n              <div class=\"setting-menu-item\">\n                <label class=\"setting-menu-label\">&copy; Copyright</label>\n                <a class=\"setting-menu-link\" href=\"https://github.com/acgotaku/115\" target=\"_blank\">雪月秋水</a>\n              </div>\n              <div class=\"setting-menu-item\">\n                <label class=\"setting-menu-label\">Version: " + (this.version) + "</label>\n                <label class=\"setting-menu-label\">Update date: " + (this.updateDate) + "</label>\n              </div>\n            </div><!-- /.setting-menu-copyright -->\n            <div class=\"setting-menu-operate\">\n              <a class=\"setting-menu-button large-o blue-o\" id=\"apply\" href=\"javascript:void(0);\">应用</a>\n              <a class=\"setting-menu-button large-o\" id=\"reset\" href=\"javascript:void(0);\">重置</a>\n            </div>\n          </div>\n        </div>\n      </div>";
    document.body.insertAdjacentHTML('beforeend', setting);
    var settingMenu = document.querySelector('#settingMenu');
    var close = settingMenu.querySelector('.modal-close');
    close.addEventListener('click', function () {
      settingMenu.classList.remove('open-o');
      this$1.resetSetting();
    });
    var addRPC = document.querySelector('#addRPC');
    addRPC.addEventListener('click', function () {
      var rpcDOMList = document.querySelectorAll('.rpc-s');
      var RPC = "\n        <div class=\"setting-menu-row rpc-s\">\n          <div class=\"setting-menu-name\">\n            <input class=\"setting-menu-input name-s\" spellcheck=\"false\">\n          </div>\n          <div class=\"setting-menu-value\">\n            <input class=\"setting-menu-input url-s\" spellcheck=\"false\">\n          </div>\n        </div><!-- /.setting-menu-row -->";
      Array.from(rpcDOMList).pop().insertAdjacentHTML('afterend', RPC);
    });
    var apply = document.querySelector('#apply');
    var message = document.querySelector('#message');
    apply.addEventListener('click', function () {
      this$1.saveSetting();
      message.innerText = '设置已保存';
    });

    var reset = document.querySelector('#reset');
    reset.addEventListener('click', function () {
      Store$1.trigger('clearConfigData');
      message.innerText = '设置已重置';
    });

    var testAria2 = document.querySelector('#testAria2');
    testAria2.addEventListener('click', function () {
      Core$1.getVersion(Store$1.getConfigData('rpcList')[0].url, testAria2);
    });

    var userAgentField = document.querySelector('.userAgent-s');
    var browserUACheckbox = document.querySelector('.browser-userAgent-s');
    browserUACheckbox.addEventListener('change', function () {
      userAgentField.disabled = browserUACheckbox.checked;
    });
  };

  UI.prototype.resetSetting = function resetSetting () {
    var message = document.querySelector('#message');
    message.innerText = '';
    var testAria2 = document.querySelector('#testAria2');
    testAria2.innerText = '测试连接，成功显示版本号';
  };

  UI.prototype.updateSetting = function updateSetting (configData) {
    var rpcList = configData.rpcList;
      var configSync = configData.configSync;
      var sha1Check = configData.sha1Check;
      var ssl = configData.ssl;
      var interval = configData.interval;
      var downloadPath = configData.downloadPath;
      var userAgent = configData.userAgent;
      var browserUserAgent = configData.browserUserAgent;
      var referer = configData.referer;
      var headers = configData.headers;
    // reset dom
    document.querySelectorAll('.rpc-s').forEach(function (rpc, index) {
      if (index !== 0) {
        rpc.remove();
      }
    });
    rpcList.forEach(function (rpc, index) {
      var rpcDOMList = document.querySelectorAll('.rpc-s');
      if (index === 0) {
        rpcDOMList[index].querySelector('.name-s').value = rpc.name;
        rpcDOMList[index].querySelector('.url-s').value = rpc.url;
      } else {
        var RPC = "\n          <div class=\"setting-menu-row rpc-s\">\n            <div class=\"setting-menu-name\">\n              <input class=\"setting-menu-input name-s\" value=\"" + (rpc.name) + "\" spellcheck=\"false\">\n            </div>\n            <div class=\"setting-menu-value\">\n              <input class=\"setting-menu-input url-s\" value=\"" + (rpc.url) + "\" spellcheck=\"false\">\n            </div>\n          </div><!-- /.setting-menu-row -->";
        Array.from(rpcDOMList).pop().insertAdjacentHTML('afterend', RPC);
      }
    });
    document.querySelector('.configSync-s').checked = configSync;
    document.querySelector('.sha1Check-s').checked = sha1Check;
    document.querySelector('.ssl-s').checked = ssl;
    document.querySelector('.interval-s').value = interval;
    document.querySelector('.downloadPath-s').value = downloadPath;
    document.querySelector('.userAgent-s').value = userAgent;
    document.querySelector('.userAgent-s').disabled = browserUserAgent;
    document.querySelector('.browser-userAgent-s').checked = browserUserAgent;
    document.querySelector('.referer-s').value = referer;
    document.querySelector('.headers-s').value = headers;

    this.mostRecentConfigData = configData;
  };

  UI.prototype.saveSetting = function saveSetting () {
    var rpcDOMList = document.querySelectorAll('.rpc-s');
    var rpcList = Array.from(rpcDOMList).map(function (rpc) {
      var name = rpc.querySelector('.name-s').value;
      var url = rpc.querySelector('.url-s').value;
      if (name && url) {
        return { name: name, url: url }
      }
    }).filter(function (el) { return el; });
    var configSync = document.querySelector('.configSync-s').checked;
    var sha1Check = document.querySelector('.sha1Check-s').checked;
    var ssl = document.querySelector('.ssl-s').checked;
    var interval = document.querySelector('.interval-s').value;
    var downloadPath = document.querySelector('.downloadPath-s').value;
    var userAgent = document.querySelector('.userAgent-s').value;
    var browserUserAgent = document.querySelector('.browser-userAgent-s').checked;
    var referer = document.querySelector('.referer-s').value;
    var headers = document.querySelector('.headers-s').value;

    var configData = {
      rpcList: rpcList,
      configSync: configSync,
      sha1Check: sha1Check,
      ssl: ssl,
      interval: interval,
      downloadPath: downloadPath,
      userAgent: userAgent,
      browserUserAgent: browserUserAgent,
      referer: referer,
      headers: headers
    };
    Store$1.trigger('setConfigData', configData);
  };

  var UI$1 = new UI();

  var Downloader = function Downloader (listParameter) {
    this.listParameter = listParameter;
    this.fileDownloadInfo = [];
    this.currentTaskId = 0;
    this.completedCount = 0;
    this.folders = [];
    this.files = {};
  };

  Downloader.prototype.start = function start (interval, done) {
      if ( interval === void 0 ) interval = 300;

    this.interval = interval;
    this.done = done;
    this.currentTaskId = new Date().getTime();
    this.getNextFile(this.currentTaskId);
  };

  Downloader.prototype.reset = function reset () {
    this.fileDownloadInfo = [];
    this.currentTaskId = 0;
    this.folders = [];
    this.files = {};
    this.completedCount = 0;
  };

  Downloader.prototype.addFolder = function addFolder (item) {
    this.folders.push(item);
  };

  Downloader.prototype.addFile = function addFile (file) {
    this.files[file.pick_code] = file;
  };

  Downloader.prototype.getNextFile = function getNextFile (taskId) {
      var this$1 = this;

    if (taskId !== this.currentTaskId) {
      return
    }
    if (this.folders.length !== 0) {
      this.completedCount++;
      Core$1.showToast(("正在获取文件列表... " + (this.completedCount) + "/" + (this.completedCount + this.folders.length - 1)), 'inf');
      var fold = this.folders.pop();
      this.listParameter.search.cid = fold.cate_id;
      Core$1.sendToBackground('fetch', {
        url: ("" + (this.listParameter.url) + (Core$1.objectToQueryString(this.listParameter.search))),
        options: this.listParameter.options
      }, function (data) {
        setTimeout(function () { return this$1.getNextFile(taskId); }, this$1.interval);
        var path = fold.path + data.path[data.path.length - 1].name + '/';
        data.data.forEach(function (item) {
          if (!item.sha) {
            this$1.folders.push({
              cate_id: item.cid,
              path: path
            });
          } else {
            this$1.files[item.pc] = {
              path: path,
              isdir: false,
              sha1: item.sha,
              pick_code: item.pc
            };
          }
        });
      });
    } else if (this.files.length !== 0) {
      Core$1.showToast('正在获取下载地址...', 'inf');
      this.getFiles(this.files).then(function () {
        this$1.done(this$1.fileDownloadInfo);
      });
    } else {
      Core$1.showToast('一个文件都没有哦...', 'war');
      this.reset();
    }
  };

  Downloader.prototype.getFiles = function getFiles (files) {
    throw new Error('subclass should implement this method!')
  };

  var Home = /*@__PURE__*/(function (Downloader) {
    function Home () {
      var search = {
        aid: 1,
        limit: 1000,
        show_dir: 1,
        cid: ''
      };
      var listParameter = {
        search: search,
        url: ((location.protocol) + "//webapi.115.com/files?"),
        options: {
          credentials: 'include',
          method: 'GET'
        }
      };
      Downloader.call(this, listParameter);
      this.mode = 'RPC';
      this.rpcURL = 'http://localhost:6800/jsonrpc';
      this.iframe = document.querySelector('iframe[rel="wangpan"]');
    }

    if ( Downloader ) Home.__proto__ = Downloader;
    Home.prototype = Object.create( Downloader && Downloader.prototype );
    Home.prototype.constructor = Home;

    Home.prototype.initialize = function initialize () {
      var this$1 = this;

      this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument;
      UI$1.init();
      UI$1.addMenu(this.context.querySelector('#js_fake_path'), 'beforebegin');
      this.context.querySelector('.right-tvf').style.display = 'block';
      this.addMenuButtonEventListener();
      UI$1.addContextMenuRPCSectionWithCallback(function () {
        this$1.addContextMenuEventListener();
      });
      Core$1.showToast('初始化成功!', 'inf');
      return this
    };

    Home.prototype.startListen = function startListen () {
      var this$1 = this;

      var exportFiles = function (files) {
        files.forEach(function (item) {
          if (item.isdir) {
            this$1.addFolder(item);
          } else {
            this$1.addFile(item);
          }
        });
        this$1.start(Core$1.getConfigData('interval'), function (fileDownloadInfo) {
          if (this$1.mode === 'RPC') {
            Core$1.aria2RPCMode(this$1.rpcURL, fileDownloadInfo);
          }
          if (this$1.mode === 'TXT') {
            Core$1.aria2TXTMode(fileDownloadInfo);
            document.querySelector('#textMenu').classList.add('open-o');
          }
          if (this$1.mode === 'OPEN') {
            for (var f of fileDownloadInfo) {
              window.open('https://115.com/?ct=play&ac=location&pickcode=' + f.pickcode);
            }
          }
        });
      };

      window.addEventListener('message', function (event) {
        var type = event.data.type;
        if (!type) {
          return
        }
        if (type === 'selected' || type === 'hovered') {
          this$1.reset();
          var selectedFile = event.data.data;
          if (selectedFile.length === 0) {
            Core$1.showToast('请选择一下你要保存的文件哦', 'war');
            return
          }
          exportFiles(selectedFile);
        }
      });
      this.iframe.addEventListener('load', function () {
        this$1.initialize();
        window.postMessage({ type: 'refresh' }, location.origin);
      });
    };

    Home.prototype.addMenuButtonEventListener = function addMenuButtonEventListener () {
      var this$1 = this;

      var menuButton = this.context.querySelector('#aria2List');
      menuButton.addEventListener('click', function (event) {
        var rpcURL = event.target.dataset.url;
        if (rpcURL) {
          this$1.rpcURL = rpcURL;
          this$1.getSelected();
          this$1.mode = 'RPC';
        }
        if (event.target.id === 'aria2Text') {
          this$1.getSelected();
          this$1.mode = 'TXT';
        }
        if (event.target.id === 'batchOpen') {
          this$1.getSelected();
          this$1.mode = 'OPEN';
        }
      });
    };

    Home.prototype.addContextMenuEventListener = function addContextMenuEventListener () {
      var this$1 = this;

      var section = this.context.querySelector('#more-menu-rpc-section');
      section.addEventListener('click', function (event) {
        var rpcURL = event.target.dataset.url;
        if (rpcURL) {
          this$1.rpcURL = rpcURL;
          this$1.getHovered();
          this$1.mode = 'RPC';
        }
      });
    };

    Home.prototype.getSelected = function getSelected () {
      window.postMessage({ type: 'getSelected' }, location.origin);
    };

    Home.prototype.getHovered = function getHovered () {
      window.postMessage({ type: 'getHovered' }, location.origin);
    };

    Home.prototype.getFile = function getFile (file) {
      var options = {
        credentials: 'include',
        method: 'GET'
      };
      return new Promise(function (resolve) {
        Core$1.sendToBackground('fetch', {
          url: ((location.protocol) + "//webapi.115.com/files/download?pickcode=" + file),
          options: options
        }, function (data) {
          var path = data.file_url.match(/.*115.com(\/.*\/)/)[1];
          Core$1.requestCookies([{ path: path }]).then(function (cookies) {
            data.cookies = cookies;
            resolve(data);
          });
        });
      })
    };

    Home.prototype.getFiles = function getFiles (files) {
      var this$1 = this;

      var list = Object.keys(files).map(function (item) { return this$1.getFile(item); });
      return new Promise(function (resolve) {
        Promise.all(list).then(function (items) {
          items.forEach(function (item) {
            this$1.fileDownloadInfo.push({
              name: files[item.pickcode].path + item.file_name,
              link: item.file_url,
              sha1: files[item.pickcode].sha1,
              cookies: item.cookies,
              pickcode: item.pickcode
            });
            resolve();
          });
        });
      })
    };

    return Home;
  }(Downloader));

  var home = new Home();

  home.initialize().startListen();

}());

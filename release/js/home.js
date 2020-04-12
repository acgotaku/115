(function () {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  var EventEmitter =
  /*#__PURE__*/
  function () {
    function EventEmitter() {
      _classCallCheck(this, EventEmitter);

      this._listeners = {};
    }
    /**
     * @param {string} name - event name
     * @param {function(data: *): void} fn - listener function
     */


    _createClass(EventEmitter, [{
      key: "on",
      value: function on(name, fn) {
        var list = this._listeners[name] = this._listeners[name] || [];
        list.push(fn);
      }
      /**
       * @param {string} name - event name
       * @param {*} data - data to emit event listeners
       */

    }, {
      key: "trigger",
      value: function trigger(name, data) {
        var fns = this._listeners[name] || [];
        fns.forEach(function (fn) {
          return fn(data);
        });
      }
      /**
       * @param {string} name - event name
       */

    }, {
      key: "off",
      value: function off(name) {
        delete this._listeners[name];
      }
    }]);

    return EventEmitter;
  }();

  var Store =
  /*#__PURE__*/
  function (_EventEmitter) {
    _inherits(Store, _EventEmitter);

    function Store() {
      var _this;

      _classCallCheck(this, Store);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(Store).call(this));
      _this.defaultRPC = [{
        name: 'ARIA2 RPC',
        url: 'http://localhost:6800/jsonrpc'
      }];
      _this.defaultUserAgent = 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36 115Browser/5.1.3';
      _this.defaultReferer = 'https://115.com/';
      _this.defaultConfigData = {
        rpcList: _this.defaultRPC,
        configSync: false,
        sha1Check: false,
        ssl: false,
        interval: 300,
        downloadPath: '',
        userAgent: _this.defaultUserAgent,
        browserUserAgent: true,
        referer: _this.defaultReferer,
        headers: ''
      };
      _this.configData = {};

      _this.on('initConfigData', _this.init.bind(_assertThisInitialized(_this)));

      _this.on('setConfigData', _this.set.bind(_assertThisInitialized(_this)));

      _this.on('clearConfigData', _this.clear.bind(_assertThisInitialized(_this)));

      return _this;
    }

    _createClass(Store, [{
      key: "init",
      value: function init() {
        var _this2 = this;

        chrome.storage.sync.get(null, function (items) {
          var _loop = function _loop(key) {
            chrome.storage.local.set({
              key: items[key]
            }, function () {
              console.log('chrome first local set: %s, %s', key, items[key]);
            });
          };

          for (var key in items) {
            _loop(key);
          }
        });
        chrome.storage.local.get(null, function (items) {
          _this2.configData = Object.assign({}, _this2.defaultConfigData, items);

          _this2.trigger('updateView', _this2.configData);
        });
      }
    }, {
      key: "getConfigData",
      value: function getConfigData() {
        var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        if (key) {
          return this.configData[key];
        } else {
          return this.configData;
        }
      }
    }, {
      key: "set",
      value: function set(configData) {
        this.configData = configData;
        this.save(configData);
        this.trigger('updateView', configData);
      }
    }, {
      key: "save",
      value: function save(configData) {
        var _loop2 = function _loop2(key) {
          chrome.storage.local.set(_defineProperty({}, key, configData[key]), function () {
            console.log('chrome local set: %s, %s', key, configData[key]);
          });

          if (configData.configSync === true) {
            chrome.storage.sync.set(_defineProperty({}, key, configData[key]), function () {
              console.log('chrome sync set: %s, %s', key, configData[key]);
            });
          }
        };

        for (var key in configData) {
          _loop2(key);
        }
      }
    }, {
      key: "clear",
      value: function clear() {
        chrome.storage.sync.clear();
        chrome.storage.local.clear();
        this.configData = this.defaultConfigData;
        this.trigger('updateView', this.configData);
      }
    }]);

    return Store;
  }(EventEmitter);

  var Store$1 = new Store();

  var Core =
  /*#__PURE__*/
  function () {
    function Core() {
      _classCallCheck(this, Core);

      this.cookies = {};
    }

    _createClass(Core, [{
      key: "httpSend",
      value: function httpSend(_ref, resolve, reject) {
        var url = _ref.url,
            options = _ref.options;
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
      }
    }, {
      key: "getConfigData",
      value: function getConfigData() {
        var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        return Store$1.getConfigData(key);
      }
    }, {
      key: "objectToQueryString",
      value: function objectToQueryString(obj) {
        return Object.keys(obj).map(function (key) {
          return "".concat(encodeURIComponent(key), "=").concat(encodeURIComponent(obj[key]));
        }).join('&');
      }
    }, {
      key: "sendToBackground",
      value: function sendToBackground(method, data, callback) {
        chrome.runtime.sendMessage({
          method: method,
          data: data
        }, callback);
      }
    }, {
      key: "showToast",
      value: function showToast(message, type) {
        window.postMessage({
          type: 'showToast',
          data: {
            message: message,
            type: type
          }
        }, location.origin);
      }
    }, {
      key: "getHashParameter",
      value: function getHashParameter(name) {
        var hash = window.location.hash;
        var paramsString = hash.substr(1);
        var searchParams = new URLSearchParams(paramsString);
        return searchParams.get(name);
      }
    }, {
      key: "formatCookies",
      value: function formatCookies() {
        var cookies = [];

        for (var key in this.cookies) {
          cookies.push("".concat(key, "=").concat(this.cookies[key]));
        }

        return cookies.join('; ');
      }
    }, {
      key: "getHeader",
      value: function getHeader() {
        var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'RPC';
        var headerOption = [];
        var useBrowserUA = this.getConfigData('browserUserAgent');
        var userAgent = this.getConfigData('userAgent');

        if (useBrowserUA) {
          var browserUA = navigator.userAgent;

          if (browserUA && browserUA.length) {
            userAgent = browserUA;
          }
        }

        headerOption.push("User-Agent: ".concat(userAgent));
        headerOption.push("Referer: ".concat(this.getConfigData('referer')));
        headerOption.push("Cookie: ".concat(this.formatCookies()));
        var headers = this.getConfigData('headers');

        if (headers) {
          headers.split('\n').forEach(function (item) {
            headerOption.push(item);
          });
        }

        if (type === 'RPC') {
          return headerOption;
        } else if (type === 'aria2Cmd') {
          return headerOption.map(function (item) {
            return "--header ".concat(JSON.stringify(item));
          }).join(' ');
        } else if (type === 'aria2c') {
          return headerOption.map(function (item) {
            return " header=".concat(item);
          }).join('\n');
        } else if (type === 'idm') {
          return headerOption.map(function (item) {
            var headers = item.split(': ');
            return "".concat(headers[0].toLowerCase(), ": ").concat(headers[1]);
          }).join('\r\n');
        }
      } // 解析 RPC地址 返回验证数据 和地址

    }, {
      key: "parseURL",
      value: function parseURL(url) {
        var parseURL = new URL(url);
        var authStr = parseURL.username ? "".concat(parseURL.username, ":").concat(decodeURI(parseURL.password)) : null;

        if (authStr) {
          if (!authStr.includes('token:')) {
            authStr = "Basic ".concat(btoa(authStr));
          }
        }

        var paramsString = parseURL.hash.substr(1);
        var options = {};
        var searchParams = new URLSearchParams(paramsString);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = searchParams[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;
            options[key[0]] = key.length === 2 ? key[1] : 'enabled';
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        var path = parseURL.origin + parseURL.pathname;
        return {
          authStr: authStr,
          path: path,
          options: options
        };
      }
    }, {
      key: "generateParameter",
      value: function generateParameter(authStr, path, data) {
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

        return parameter;
      } // get aria2 version

    }, {
      key: "getVersion",
      value: function getVersion(rpcPath, element) {
        var data = {
          jsonrpc: '2.0',
          method: 'aria2.getVersion',
          id: 1,
          params: []
        };

        var _this$parseURL = this.parseURL(rpcPath),
            authStr = _this$parseURL.authStr,
            path = _this$parseURL.path;

        this.sendToBackground('rpcVersion', this.generateParameter(authStr, path, data), function (version) {
          if (version) {
            element.innerText = "Aria2\u7248\u672C\u4E3A: ".concat(version);
          } else {
            element.innerText = '错误,请查看是否开启Aria2';
          }
        });
      }
    }, {
      key: "copyText",
      value: function copyText(text) {
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
      } // cookies format  [{"url": "http://pan.baidu.com/", "name": "BDUSS"},{"url": "http://pcs.baidu.com/", "name": "pcsett"}]

    }, {
      key: "requestCookies",
      value: function requestCookies(cookies) {
        var _this = this;

        return new Promise(function (resolve) {
          _this.sendToBackground('getCookies', cookies, function (value) {
            resolve(value);
          });
        });
      }
    }, {
      key: "aria2RPCMode",
      value: function aria2RPCMode(rpcPath, fileDownloadInfo) {
        var _this2 = this;

        var _this$parseURL2 = this.parseURL(rpcPath),
            authStr = _this$parseURL2.authStr,
            path = _this$parseURL2.path,
            options = _this$parseURL2.options;

        var ssl = this.getConfigData('ssl');
        fileDownloadInfo.forEach(function (file) {
          _this2.cookies = file.cookies;

          if (ssl) {
            file.link = file.link.replace(/^(http:\/\/)/, 'https://');
          }

          var rpcData = {
            jsonrpc: '2.0',
            method: 'aria2.addUri',
            id: new Date().getTime(),
            params: [[file.link], {
              out: file.name,
              header: _this2.getHeader()
            }]
          };

          var sha1Check = _this2.getConfigData('sha1Check');

          var rpcOption = rpcData.params[1];

          var dir = _this2.getConfigData('downloadPath');

          if (dir) {
            rpcOption.dir = dir;
          }

          if (sha1Check) {
            rpcOption.checksum = "sha-1=".concat(file.sha1);
          }

          if (options) {
            for (var key in options) {
              rpcOption[key] = options[key];
            }
          }

          _this2.sendToBackground('rpcData', _this2.generateParameter(authStr, path, rpcData), function (success) {
            if (success) {
              _this2.showToast('下载成功!赶紧去看看吧~', 'inf');
            } else {
              _this2.showToast('下载失败!是不是没有开启Aria2?', 'err');
            }
          });
        });
      }
    }, {
      key: "aria2TXTMode",
      value: function aria2TXTMode(fileDownloadInfo) {
        var _this3 = this;

        var aria2CmdTxt = [];
        var aria2Txt = [];
        var idmTxt = [];
        var downloadLinkTxt = [];
        var prefixTxt = 'data:text/plain;charset=utf-8,';
        var ssl = this.getConfigData('ssl');
        fileDownloadInfo.forEach(function (file) {
          _this3.cookies = file.cookies;

          if (ssl) {
            file.link = file.link.replace(/^(http:\/\/)/, 'https://');
          }

          var aria2CmdLine = "aria2c -c -s10 -k1M -x16 --enable-rpc=false -o ".concat(JSON.stringify(file.name), " ").concat(_this3.getHeader('aria2Cmd'), " ").concat(JSON.stringify(file.link));
          var aria2Line = [file.link, _this3.getHeader('aria2c'), " out=".concat(file.name)].join('\n');

          var sha1Check = _this3.getConfigData('sha1Check');

          if (sha1Check) {
            aria2CmdLine += " --checksum=sha-1=".concat(file.sha1);
            aria2Line += "\n checksum=sha-1=".concat(file.sha1);
          }

          aria2CmdTxt.push(aria2CmdLine);
          aria2Txt.push(aria2Line);
          var idmLine = ['<', file.link, _this3.getHeader('idm'), '>'].join('\r\n');
          idmTxt.push(idmLine);
          downloadLinkTxt.push(file.link);
        });
        document.querySelector('#aria2CmdTxt').value = "".concat(aria2CmdTxt.join('\n'));
        document.querySelector('#aria2Txt').href = "".concat(prefixTxt).concat(encodeURIComponent(aria2Txt.join('\n')));
        document.querySelector('#idmTxt').href = "".concat(prefixTxt).concat(encodeURIComponent(idmTxt.join('\r\n') + '\r\n'));
        document.querySelector('#downloadLinkTxt').href = "".concat(prefixTxt).concat(encodeURIComponent(downloadLinkTxt.join('\n')));
        document.querySelector('#copyDownloadLinkTxt').dataset.link = downloadLinkTxt.join('\n');
      }
    }]);

    return Core;
  }();

  var Core$1 = new Core();

  var UI =
  /*#__PURE__*/
  function () {
    function UI() {
      var _this = this;

      _classCallCheck(this, UI);

      this.version = '0.3.6';
      this.updateDate = '2019/12/13';
      Store$1.on('updateView', function (configData) {
        _this.updateSetting(configData);

        _this.updateMenu(configData);
      });
    }

    _createClass(UI, [{
      key: "init",
      value: function init() {
        this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument;
        this.addSettingUI();
        this.addTextExport();
        Store$1.trigger('initConfigData');
      }
    }, {
      key: "addMenu",
      value: function addMenu(element, position) {
        var menu = "\n      <div id=\"exportMenu\" class=\"export\">\n        <a class=\"export-button\">\u5BFC\u51FA\u4E0B\u8F7D</a>\n        <div id=\"aria2List\" class=\"export-menu\">\n          <a class=\"export-menu-item\" id=\"batchOpen\" href=\"javascript:void(0);\">\u6279\u91CF\u6253\u5F00</a>\n          <a class=\"export-menu-item\" id=\"aria2Text\" href=\"javascript:void(0);\">\u6587\u672C\u5BFC\u51FA</a>\n          <a class=\"export-menu-item\" id=\"settingButton\" href=\"javascript:void(0);\">\u8BBE\u7F6E</a>\n        </div>\n      </div>";

        if (element) {
          element.insertAdjacentHTML(position, menu);
        } else {
          return;
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
        }); // fix click select file

        var aria2List = this.context.querySelector('#aria2List');
        aria2List.addEventListener('mousedown', function (event) {
          event.stopPropagation();
        });
      }
    }, {
      key: "addContextMenuRPCSectionWithCallback",
      value: function addContextMenuRPCSectionWithCallback(callback) {
        var _this2 = this;

        var addContextMenuRPCSection = function addContextMenuRPCSection(node) {
          var dom = '<div class="cell" id="more-menu-rpc-section"><ul></ul></div>';
          node.insertAdjacentHTML('beforebegin', dom);

          if (_this2.mostRecentConfigData) {
            _this2.updateMenu(_this2.mostRecentConfigData);
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
            var contextMenuNode = _this2.context.querySelector('body > .context-menu .cell');

            if (contextMenuNode) {
              observer.disconnect();
              addContextMenuRPCSection(contextMenuNode);
            }
          });
          observer.observe(body, {
            childList: true
          });
        }
      }
    }, {
      key: "resetMenu",
      value: function resetMenu() {
        this.context.querySelectorAll('#more-menu-rpc-section li').forEach(function (item) {
          item.remove();
        });
        this.context.querySelectorAll('.rpc-button').forEach(function (rpc) {
          rpc.remove();
        });
      }
    }, {
      key: "updateMenu",
      value: function updateMenu(configData) {
        this.resetMenu();
        var rpcList = configData.rpcList;
        var rpcDOMList = '';
        var contextMenuDOMList = '';
        rpcList.forEach(function (rpc) {
          var rpcDOM = "<a class=\"export-menu-item rpc-button\" href=\"javascript:void(0);\" data-url=".concat(rpc.url, ">").concat(rpc.name, "</a>");
          rpcDOMList += rpcDOM;
          contextMenuDOMList += "<li><a href=\"javascript:void(0);\" data-url=".concat(rpc.url, ">").concat(rpc.name, "</a></li>");
        });
        this.context.querySelector('#aria2List').insertAdjacentHTML('afterbegin', rpcDOMList);
        var contextMenuSection = this.context.querySelector('#more-menu-rpc-section ul');

        if (contextMenuSection) {
          contextMenuSection.insertAdjacentHTML('afterbegin', contextMenuDOMList);
        }
      }
    }, {
      key: "addTextExport",
      value: function addTextExport() {
        var _this3 = this;

        var text = "\n      <div id=\"textMenu\" class=\"modal text-menu\">\n        <div class=\"modal-inner\">\n          <div class=\"modal-header\">\n            <div class=\"modal-title\">\u6587\u672C\u5BFC\u51FA</div>\n            <div class=\"modal-close\">\xD7</div>\n          </div>\n          <div class=\"modal-body\">\n            <div class=\"text-menu-row\">\n              <a class=\"text-menu-button\" href=\"javascript:void(0);\" id=\"aria2Txt\" download=\"aria2c.down\">\u5B58\u4E3AAria2\u6587\u4EF6</a>\n              <a class=\"text-menu-button\" href=\"javascript:void(0);\" id=\"idmTxt\" download=\"idm.ef2\">\u5B58\u4E3AIDM\u6587\u4EF6</a>\n              <a class=\"text-menu-button\" href=\"javascript:void(0);\" id=\"downloadLinkTxt\" download=\"link.txt\">\u4FDD\u5B58\u4E0B\u8F7D\u94FE\u63A5</a>\n              <a class=\"text-menu-button\" href=\"javascript:void(0);\" id=\"copyDownloadLinkTxt\">\u62F7\u8D1D\u4E0B\u8F7D\u94FE\u63A5</a>\n            </div>\n            <div class=\"text-menu-row\">\n              <textarea class=\"text-menu-textarea\" type=\"textarea\" wrap=\"off\" spellcheck=\"false\" id=\"aria2CmdTxt\"></textarea>\n            </div>\n          </div>\n        </div>\n      </div>";
        document.body.insertAdjacentHTML('beforeend', text);
        var textMenu = document.querySelector('#textMenu');
        var close = textMenu.querySelector('.modal-close');
        var copyDownloadLinkTxt = textMenu.querySelector('#copyDownloadLinkTxt');
        copyDownloadLinkTxt.addEventListener('click', function () {
          Core$1.copyText(copyDownloadLinkTxt.dataset.link);
        });
        close.addEventListener('click', function () {
          textMenu.classList.remove('open-o');

          _this3.resetTextExport();
        });
      }
    }, {
      key: "resetTextExport",
      value: function resetTextExport() {
        var textMenu = document.querySelector('#textMenu');
        textMenu.querySelector('#aria2Txt').href = '';
        textMenu.querySelector('#idmTxt').href = '';
        textMenu.querySelector('#downloadLinkTxt').href = '';
        textMenu.querySelector('#aria2CmdTxt').value = '';
        textMenu.querySelector('#copyDownloadLinkTxt').dataset.link = '';
      }
    }, {
      key: "addSettingUI",
      value: function addSettingUI() {
        var _this4 = this;

        var setting = "\n      <div id=\"settingMenu\" class=\"modal setting-menu\">\n        <div class=\"modal-inner\">\n          <div class=\"modal-header\">\n            <div class=\"modal-title\">\u5BFC\u51FA\u8BBE\u7F6E</div>\n            <div class=\"modal-close\">\xD7</div>\n          </div>\n          <div class=\"modal-body\">\n            <div class=\"setting-menu-message\">\n              <label class=\"setting-menu-label orange-o\" id=\"message\"></label>\n            </div>\n            <div class=\"setting-menu-row rpc-s\">\n              <div class=\"setting-menu-name\">\n                <input class=\"setting-menu-input name-s\" spellcheck=\"false\">\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input url-s\" spellcheck=\"false\">\n                <a class=\"setting-menu-button\" id=\"addRPC\" href=\"javascript:void(0);\">\u6DFB\u52A0RPC\u5730\u5740</a>\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">\u914D\u7F6E\u540C\u6B65</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input type=\"checkbox\" class=\"setting-menu-checkbox configSync-s\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">SHA1\u6821\u9A8C</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input type=\"checkbox\" class=\"setting-menu-checkbox sha1Check-s\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">\u5F3A\u5236SSL\u4E0B\u8F7D</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input type=\"checkbox\" class=\"setting-menu-checkbox ssl-s\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">\u9012\u5F52\u4E0B\u8F7D\u95F4\u9694</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input small-o interval-s\" type=\"number\" spellcheck=\"false\">\n                <label class=\"setting-menu-label\">(\u5355\u4F4D:\u6BEB\u79D2)</label>\n                <a class=\"setting-menu-button version-s\" id=\"testAria2\" href=\"javascript:void(0);\">\u6D4B\u8BD5\u8FDE\u63A5\uFF0C\u6210\u529F\u663E\u793A\u7248\u672C\u53F7</a>\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">\u4E0B\u8F7D\u8DEF\u5F84</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input downloadPath-s\" placeholder=\"\u53EA\u80FD\u8BBE\u7F6E\u4E3A\u7EDD\u5BF9\u8DEF\u5F84\" spellcheck=\"false\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">User-Agent</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input userAgent-s\" spellcheck=\"false\">\n                <label class=\"setting-menu-label\"></label>\n                <input type=\"checkbox\" class=\"setting-menu-checkbox browser-userAgent-s\">\n                <label class=\"setting-menu-label for-checkbox\">\u4F7F\u7528\u6D4F\u89C8\u5668 UA</label>\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">Referer</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <input class=\"setting-menu-input referer-s\" spellcheck=\"false\">\n              </div>\n            </div><!-- /.setting-menu-row -->\n            <div class=\"setting-menu-row\">\n              <div class=\"setting-menu-name\">\n                <label class=\"setting-menu-label\">Headers</label>\n              </div>\n              <div class=\"setting-menu-value\">\n                <textarea class=\"setting-menu-input textarea-o headers-s\" type=\"textarea\" spellcheck=\"false\"></textarea>\n              </div>\n            </div><!-- /.setting-menu-row -->\n          </div><!-- /.setting-menu-body -->\n          <div class=\"modal-footer\">\n            <div class=\"setting-menu-copyright\">\n              <div class=\"setting-menu-item\">\n                <label class=\"setting-menu-label\">&copy; Copyright</label>\n                <a class=\"setting-menu-link\" href=\"https://github.com/acgotaku/BaiduExporter\" target=\"_blank\">\u96EA\u6708\u79CB\u6C34</a>\n              </div>\n              <div class=\"setting-menu-item\">\n                <label class=\"setting-menu-label\">Version: ".concat(this.version, "</label>\n                <label class=\"setting-menu-label\">Update date: ").concat(this.updateDate, "</label>\n              </div>\n            </div><!-- /.setting-menu-copyright -->\n            <div class=\"setting-menu-operate\">\n              <a class=\"setting-menu-button large-o blue-o\" id=\"apply\" href=\"javascript:void(0);\">\u5E94\u7528</a>\n              <a class=\"setting-menu-button large-o\" id=\"reset\" href=\"javascript:void(0);\">\u91CD\u7F6E</a>\n            </div>\n          </div>\n        </div>\n      </div>");
        document.body.insertAdjacentHTML('beforeend', setting);
        var settingMenu = document.querySelector('#settingMenu');
        var close = settingMenu.querySelector('.modal-close');
        close.addEventListener('click', function () {
          settingMenu.classList.remove('open-o');

          _this4.resetSetting();
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
          _this4.saveSetting();

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
      }
    }, {
      key: "resetSetting",
      value: function resetSetting() {
        var message = document.querySelector('#message');
        message.innerText = '';
        var testAria2 = document.querySelector('#testAria2');
        testAria2.innerText = '测试连接，成功显示版本号';
      }
    }, {
      key: "updateSetting",
      value: function updateSetting(configData) {
        var rpcList = configData.rpcList,
            configSync = configData.configSync,
            sha1Check = configData.sha1Check,
            ssl = configData.ssl,
            interval = configData.interval,
            downloadPath = configData.downloadPath,
            userAgent = configData.userAgent,
            browserUserAgent = configData.browserUserAgent,
            referer = configData.referer,
            headers = configData.headers; // reset dom

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
            var RPC = "\n          <div class=\"setting-menu-row rpc-s\">\n            <div class=\"setting-menu-name\">\n              <input class=\"setting-menu-input name-s\" value=\"".concat(rpc.name, "\" spellcheck=\"false\">\n            </div>\n            <div class=\"setting-menu-value\">\n              <input class=\"setting-menu-input url-s\" value=\"").concat(rpc.url, "\" spellcheck=\"false\">\n            </div>\n          </div><!-- /.setting-menu-row -->");
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
      }
    }, {
      key: "saveSetting",
      value: function saveSetting() {
        var rpcDOMList = document.querySelectorAll('.rpc-s');
        var rpcList = Array.from(rpcDOMList).map(function (rpc) {
          var name = rpc.querySelector('.name-s').value;
          var url = rpc.querySelector('.url-s').value;

          if (name && url) {
            return {
              name: name,
              url: url
            };
          }
        }).filter(function (el) {
          return el;
        });
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
      }
    }]);

    return UI;
  }();

  var UI$1 = new UI();

  var Downloader =
  /*#__PURE__*/
  function () {
    function Downloader(listParameter) {
      _classCallCheck(this, Downloader);

      this.listParameter = listParameter;
      this.fileDownloadInfo = [];
      this.currentTaskId = 0;
      this.completedCount = 0;
      this.folders = [];
      this.files = {};
    }

    _createClass(Downloader, [{
      key: "start",
      value: function start() {
        var interval = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 300;
        var done = arguments.length > 1 ? arguments[1] : undefined;
        this.interval = interval;
        this.done = done;
        this.currentTaskId = new Date().getTime();
        this.getNextFile(this.currentTaskId);
      }
    }, {
      key: "reset",
      value: function reset() {
        this.fileDownloadInfo = [];
        this.currentTaskId = 0;
        this.folders = [];
        this.files = {};
        this.completedCount = 0;
      }
    }, {
      key: "addFolder",
      value: function addFolder(item) {
        this.folders.push(item);
      }
    }, {
      key: "addFile",
      value: function addFile(file) {
        this.files[file.pick_code] = file;
      }
    }, {
      key: "getNextFile",
      value: function getNextFile(taskId) {
        var _this = this;

        if (taskId !== this.currentTaskId) {
          return;
        }

        if (this.folders.length !== 0) {
          this.completedCount++;
          Core$1.showToast("\u6B63\u5728\u83B7\u53D6\u6587\u4EF6\u5217\u8868... ".concat(this.completedCount, "/").concat(this.completedCount + this.folders.length - 1), 'inf');
          var fold = this.folders.pop();
          this.listParameter.search.cid = fold.cate_id;
          Core$1.sendToBackground('fetch', {
            url: "".concat(this.listParameter.url).concat(Core$1.objectToQueryString(this.listParameter.search)),
            options: this.listParameter.options
          }, function (data) {
            setTimeout(function () {
              return _this.getNextFile(taskId);
            }, _this.interval);
            var path = fold.path + data.path[data.path.length - 1].name + '/';
            data.data.forEach(function (item) {
              if (!item.sha) {
                _this.folders.push({
                  cate_id: item.cid,
                  path: path
                });
              } else {
                _this.files[item.pc] = {
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
            _this.done(_this.fileDownloadInfo);
          });
        } else {
          Core$1.showToast('一个文件都没有哦...', 'war');
          this.reset();
        }
      }
    }, {
      key: "getFiles",
      value: function getFiles(files) {
        throw new Error('subclass should implement this method!');
      }
    }]);

    return Downloader;
  }();

  var Home =
  /*#__PURE__*/
  function (_Downloader) {
    _inherits(Home, _Downloader);

    function Home() {
      var _this;

      _classCallCheck(this, Home);

      var search = {
        aid: 1,
        limit: 1000,
        show_dir: 1,
        cid: ''
      };
      var listParameter = {
        search: search,
        url: "".concat(location.protocol, "//webapi.115.com/files?"),
        options: {
          credentials: 'include',
          method: 'GET'
        }
      };
      _this = _possibleConstructorReturn(this, _getPrototypeOf(Home).call(this, listParameter));
      _this.mode = 'RPC';
      _this.rpcURL = 'http://localhost:6800/jsonrpc';
      _this.iframe = document.querySelector('iframe[rel="wangpan"]');
      return _this;
    }

    _createClass(Home, [{
      key: "initialize",
      value: function initialize() {
        var _this2 = this;

        this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument;
        UI$1.init();
        UI$1.addMenu(this.context.querySelector('#js_fake_path'), 'beforebegin');
        this.context.querySelector('.right-tvf').style.display = 'block';
        this.addMenuButtonEventListener();
        UI$1.addContextMenuRPCSectionWithCallback(function () {
          _this2.addContextMenuEventListener();
        });
        Core$1.showToast('初始化成功!', 'inf');
        return this;
      }
    }, {
      key: "startListen",
      value: function startListen() {
        var _this3 = this;

        var exportFiles = function exportFiles(files) {
          files.forEach(function (item) {
            if (item.isdir) {
              _this3.addFolder(item);
            } else {
              _this3.addFile(item);
            }
          });

          _this3.start(Core$1.getConfigData('interval'), function (fileDownloadInfo) {
            if (_this3.mode === 'RPC') {
              Core$1.aria2RPCMode(_this3.rpcURL, fileDownloadInfo);
            }

            if (_this3.mode === 'TXT') {
              Core$1.aria2TXTMode(fileDownloadInfo);
              document.querySelector('#textMenu').classList.add('open-o');
            }

            if (_this3.mode === 'OPEN') {
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = fileDownloadInfo[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var f = _step.value;
                  window.open('https://115.com/?ct=play&ac=location&pickcode=' + f.pickcode);
                }
              } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                  }
                } finally {
                  if (_didIteratorError) {
                    throw _iteratorError;
                  }
                }
              }
            }
          });
        };

        window.addEventListener('message', function (event) {
          var type = event.data.type;

          if (!type) {
            return;
          }

          if (type === 'selected' || type === 'hovered') {
            _this3.reset();

            var selectedFile = event.data.data;

            if (selectedFile.length === 0) {
              Core$1.showToast('请选择一下你要保存的文件哦', 'war');
              return;
            }

            exportFiles(selectedFile);
          }
        });
        this.iframe.addEventListener('load', function () {
          _this3.initialize();

          window.postMessage({
            type: 'refresh'
          }, location.origin);
        });
      }
    }, {
      key: "addMenuButtonEventListener",
      value: function addMenuButtonEventListener() {
        var _this4 = this;

        var menuButton = this.context.querySelector('#aria2List');
        menuButton.addEventListener('click', function (event) {
          var rpcURL = event.target.dataset.url;

          if (rpcURL) {
            _this4.rpcURL = rpcURL;

            _this4.getSelected();

            _this4.mode = 'RPC';
          }

          if (event.target.id === 'aria2Text') {
            _this4.getSelected();

            _this4.mode = 'TXT';
          }

          if (event.target.id === 'batchOpen') {
            _this4.getSelected();

            _this4.mode = 'OPEN';
          }
        });
      }
    }, {
      key: "addContextMenuEventListener",
      value: function addContextMenuEventListener() {
        var _this5 = this;

        var section = this.context.querySelector('#more-menu-rpc-section');
        section.addEventListener('click', function (event) {
          var rpcURL = event.target.dataset.url;

          if (rpcURL) {
            _this5.rpcURL = rpcURL;

            _this5.getHovered();

            _this5.mode = 'RPC';
          }
        });
      }
    }, {
      key: "getSelected",
      value: function getSelected() {
        window.postMessage({
          type: 'getSelected'
        }, location.origin);
      }
    }, {
      key: "getHovered",
      value: function getHovered() {
        window.postMessage({
          type: 'getHovered'
        }, location.origin);
      }
    }, {
      key: "getFile",
      value: function getFile(file) {
        var options = {
          credentials: 'include',
          method: 'GET'
        };
        return new Promise(function (resolve) {
          Core$1.sendToBackground('fetch', {
            url: "".concat(location.protocol, "//webapi.115.com/files/download?pickcode=").concat(file),
            options: options
          }, function (data) {
            var path = data.file_url.match(/.*115.com(\/.*\/)/)[1];
            Core$1.requestCookies([{
              path: path
            }]).then(function (cookies) {
              data.cookies = cookies;
              resolve(data);
            });
          });
        });
      }
    }, {
      key: "getFiles",
      value: function getFiles(files) {
        var _this6 = this;

        var list = Object.keys(files).map(function (item) {
          return _this6.getFile(item);
        });
        return new Promise(function (resolve) {
          Promise.all(list).then(function (items) {
            items.forEach(function (item) {
              _this6.fileDownloadInfo.push({
                name: files[item.pickcode].path + item.file_name,
                link: item.file_url,
                sha1: files[item.pickcode].sha1,
                cookies: item.cookies,
                pickcode: item.pickcode
              });

              resolve();
            });
          });
        });
      }
    }]);

    return Home;
  }(Downloader);

  var home = new Home();
  home.initialize().startListen();

}());

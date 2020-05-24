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

  var Disk = /*#__PURE__*/function () {
    function Disk() {
      _classCallCheck(this, Disk);

      this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument;
    } // Type类型有
    // inf err war


    _createClass(Disk, [{
      key: "showToast",
      value: function showToast(_ref) {
        var message = _ref.message,
            type = _ref.type;
        window.Core.MinMessage.Show({
          text: message,
          type: type,
          timeout: 1000
        });
      }
    }, {
      key: "startListen",
      value: function startListen() {
        var _this = this;

        window.addEventListener('message', function (event) {
          if (event.data.type && event.data.type === 'getSelected') {
            window.postMessage({
              type: 'selected',
              data: _this.getSelected()
            }, location.origin);
          }

          if (event.data.type && event.data.type === 'getHovered') {
            window.postMessage({
              type: 'hovered',
              data: _this.getHovered()
            }, location.origin);
          }

          if (event.data.type && event.data.type === 'showToast') {
            _this.showToast(event.data.data);
          }

          if (event.data.type && event.data.type === 'refresh') {
            _this.refresh();
          }
        });
      }
    }, {
      key: "refresh",
      value: function refresh() {
        this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument;
      }
    }, {
      key: "getFileInfoFromElements",
      value: function getFileInfoFromElements(list) {
        var selected = [];
        Array.from(list).forEach(function (item) {
          var type = item.getAttribute('file_type'); // file

          if (type === '1') {
            selected.push({
              isdir: false,
              sha1: item.getAttribute('sha1'),
              pick_code: item.getAttribute('pick_code'),
              path: ''
            });
          } // fold


          if (type === '0') {
            selected.push({
              isdir: true,
              cate_id: item.getAttribute('cate_id'),
              path: ''
            });
          }
        });
        return selected;
      }
    }, {
      key: "getSelected",
      value: function getSelected() {
        var list = this.context.querySelectorAll('li[rel="item"].selected');
        return this.getFileInfoFromElements(list);
      }
    }, {
      key: "getHovered",
      value: function getHovered() {
        var list = this.context.querySelectorAll('li[rel="item"].hover');
        return this.getFileInfoFromElements(list);
      }
    }]);

    return Disk;
  }();

  var disk = new Disk();
  disk.startListen();

}());

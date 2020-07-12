(function () {
  'use strict';

  var Disk = function Disk () {
    this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument;
  };

  // Type类型有
  // inf err war
  Disk.prototype.showToast = function showToast (ref) {
      var message = ref.message;
      var type = ref.type;

    window.Core.MinMessage.Show({
      text: message,
      type: type,
      timeout: 1000
    });
  };

  Disk.prototype.startListen = function startListen () {
      var this$1 = this;

    window.addEventListener('message', function (event) {
      if (event.data.type && event.data.type === 'getSelected') {
        window.postMessage({ type: 'selected', data: this$1.getSelected() }, location.origin);
      }
      if (event.data.type && event.data.type === 'getHovered') {
        window.postMessage({ type: 'hovered', data: this$1.getHovered() }, location.origin);
      }
      if (event.data.type && event.data.type === 'showToast') {
        this$1.showToast(event.data.data);
      }
      if (event.data.type && event.data.type === 'refresh') {
        this$1.refresh();
      }
    });
  };

  Disk.prototype.refresh = function refresh () {
    this.context = document.querySelector('iframe[rel="wangpan"]').contentDocument;
  };

  Disk.prototype.getFileInfoFromElements = function getFileInfoFromElements (list) {
    var selected = [];
    Array.from(list).forEach(function (item) {
      var type = item.getAttribute('file_type');
      // file
      if (type === '1') {
        selected.push({
          isdir: false,
          sha1: item.getAttribute('sha1'),
          pick_code: item.getAttribute('pick_code'),
          path: ''
        });
      }
      // fold
      if (type === '0') {
        selected.push({
          isdir: true,
          cate_id: item.getAttribute('cate_id'),
          path: ''
        });
      }
    });
    return selected
  };

  Disk.prototype.getSelected = function getSelected () {
    var list = this.context.querySelectorAll('li[rel="item"].selected');
    return this.getFileInfoFromElements(list)
  };

  Disk.prototype.getHovered = function getHovered () {
    var list = this.context.querySelectorAll('li[rel="item"].hover');
    return this.getFileInfoFromElements(list)
  };

  var disk = new Disk();

  disk.startListen();

}());

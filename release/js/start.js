(function () {
  'use strict';

  var iframe = document.querySelector('iframe[rel="wangpan"]');
  function add115JS () {
    if (iframe.contentDocument.querySelector('#js_top_panel_box')) {
      var script = document.createElement('script');
      script.src = chrome.runtime.getURL('js/115.js');
      document.body.appendChild(script);
      chrome.runtime.sendMessage({
        method: 'addScript',
        data: 'js/home.js'
      });
      iframe.removeEventListener('load', add115JS);
    }
  }

  if (iframe) {
    iframe.addEventListener('load', add115JS);
  }

}());

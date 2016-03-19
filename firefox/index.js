var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var button = buttons.ActionButton({
  id: "pan115-link",
  label: "Visit 115",
  icon: {
    "16": "./img/logo16.png",
    "32": "./img/logo32.png",
    "64": "./img/logo64.png"
  },
  onClick: handleClick
});

function handleClick(state) {
  tabs.open("http://115.com/?mode=wangpan");
}



var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");

pageMod.PageMod({
  include: ["http://115.com/*"],
  contentScriptWhen:"end",
  contentScriptFile: [data.url("js/115.js")],
});

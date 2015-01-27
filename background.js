chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log(tab);
    if (changeInfo.status === 'loading' && tab.url.indexOf("n.baidu.com") != -1) {
        if (!chrome.runtime.onConnect.hasListeners()) {
            chrome.runtime.onConnect.addListener(function(port) {
                console.assert(port.name == "get_cookie");
                port.onMessage.addListener(function(request) {
						Promise.all(function(){
							var array=[];
							for(var i=0;i<request.length;i++){
								array.push(get_cookie(request[i].site,request[i].name));
							}
							return array;
						}()).then(function(value){
							console.log(value);
							port.postMessage(value);        
							
						},function(){
							console.log("error");
						});

                });
            });
        }

    }
});
function get_cookie(site,name){
    return new Promise(function(resolve, reject) {
        chrome.cookies.get({"url": site, "name": name}, function(cookies) {
			var obj = {};
            if (cookies) {
                obj[cookies.name] = cookies.value;
                resolve(obj);
            }else{
                resolve(obj);
            }
        });
    });
}


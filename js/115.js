// ==UserScript==
// @name            115网盘aria2导出工具
// @author          acgotaku311
// @description 一个方便把115网盘导出到Aria2rpc的脚本。
// @encoding           utf-8
// @include     http://*.115.com/*
// @run-at       document-end
// @version 0.0.1
// ==/UserScript==
var pan_115 = function(cookies) {
    var version = "0.0.1";
    var update_date = "2015/01/26";
    var pan = (function() {
        //type : inf err war
        var SetMessage = function(msg, type) {   
            Core.MinMessage.Show({
                text: msg, 
                type: type, 
                timeout: 2000
            });
        };
        var auth = null; //是否设置用户名密码验证 设置的话变为auth赋值
        var HttpSendRead = function(info) {
            var http = new XMLHttpRequest();
            var contentType = "\u0061\u0070\u0070\u006c\u0069\u0063\u0061\u0074\u0069\u006f\u006e\u002f\u0078\u002d\u0077\u0077\u0077\u002d\u0066\u006f\u0072\u006d\u002d\u0075\u0072\u006c\u0065\u006e\u0063\u006f\u0064\u0065\u0064\u003b\u0020\u0063\u0068\u0061\u0072\u0073\u0065\u0074\u003d\u0055\u0054\u0046\u002d\u0038";
            var timeout = 3000;
            var deferred = jQuery.Deferred();
            if (info.contentType != null) {
                contentType = info.contentType;
            }
            if (info.timeout != null) {
                timeout = info.timeout;
            }
            var timeId = setTimeout(httpclose, timeout);
            function httpclose() {
                http.abort();
            }
            deferred.promise(http);
            http.onreadystatechange = function() {
                if (http.readyState == 4) {
                    if ((http.status == 200 && http.status < 300) || http.status == 304) {
                        clearTimeout(timeId);
                        if (info.dataType == "json") {
                            deferred.resolve(JSON.parse(http.responseText), http.status, http);
                        }
                        else if (info.dataType == "SCRIPT") {
                            // eval(http.responseText);
                            deferred.resolve(http.responseText, http.status, http);
                        }
                    }
                    else {
                        clearTimeout(timeId);
                        deferred.reject(http, http.statusText, http.status);
                    }
                }
            }

            http.open(info.type, info.url, true);
            http.setRequestHeader("Content-type", contentType);
            for (h in info.headers) {
                if (info.headers[h]) {
                    http.setRequestHeader(h, info.headers[h]);
                }
            }
            if (info.type == "POST") {
                http.send(info.data);
            }
            else {
                http.send();
            }
            return http;
        };
        return {
            //初始化按钮和一些事件
            init: function() {
                var self = this;
                self.bind_btn();
                self.set_down_url();
                SetMessage("载入成功!", "inf");
            },
            bind_btn:function(){
                var self=this;
                //$(root).find('li[rel="item"]')
                var root=document.querySelector("iframe[rel='wangpan']").contentDocument;
                $(root).find('li[rel="item"][file_type="1"]').each(function(){
                    $('<div class="show-export-button">导出下载</div>').appendTo($(this));
                });
                $(root).find('.show-export-button').on('click',function(){
                    var pick_code = $(this).parent().attr('pick_code');
                    DownBridge.getFileUrl(pick_code,function(data){
                        var file_list=[];
                        file_list.push({"name": data.file_name, "link": data.file_url});
                        self.aria2_rpc(file_list);
                    });
                });

            },
            set_down_url:function(){
                var self=this;
                console.log("get url");
                DownBridge={};
                  $('<iframe>').attr('src', 'http://web.api.115.com/bridge_2.0.html?namespace=DownBridge&api=jQuery').css({
                    width: 0,
                    height: 0,
                    border: 0,
                    padding: 0,
                    margin: 0,
                    position: 'absolute',
                    top: '-99999px'
                  }).one('load',function(){
                    window.DownBridge.getFileUrl=function(pickcode,callback){
                    this.jQuery.get('http://web.api.115.com/files/download?pickcode=' + pickcode, function (data) {
                             callback(data);
                            }, 'json');                        
                    };
                  }).appendTo('html');
            },
            //获取aria2c的版本号用来测试通信
            get_version: function() {
                var data = {
                    "jsonrpc": "2.0",
                    "method": "aria2.getVersion",
                    "id": 1,
                    "params": []
                };
                if ($("#rpc_token").val()) {
                    data.params.unshift("token:" + $("#rpc_token").val());
                }
                var parameter = {'url': url, 'dataType': 'json', type: 'POST', data: JSON.stringify(data), 'headers': {'Authorization': auth}};
                HttpSendRead(parameter)
                        .done(function(json, textStatus, jqXHR) {

                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            $("#send_test").html("错误,请查看是否开启Aria2");
                        });
            },
            //封装rpc要发送的数据
            aria2_rpc: function(file_list) {
                var self = this;
                if (file_list.length > 0) {
                    var length = file_list.length;
                    for (var i = 0; i < length; i++) {
                        var rpc_data = {
                            "jsonrpc": "2.0",
                            "method": "aria2.addUri",
                            "id": new Date().getTime(),
                            "params": [[file_list[i].link], {
                                    "out": file_list[i].name,
                                    "dir":$("#setting_aria2_dir").val()||null
                                }
                            ]
                        };
                        // if ($("#rpc_token").val()) {
                        //     rpc_data.params.unshift("token:" + $("#rpc_token").val());
                        // }
                        self.aria2send_data(rpc_data);
                    }
                }
            },
            //和aria2c通信
            aria2send_data: function(data) {
                var url="http://localhost:6800/jsonrpc";
                var parameter = {'url': url, 'dataType': 'json', type: 'POST', data: JSON.stringify(data), 'headers': {'Authorization': auth}};
                HttpSendRead(parameter)
                        .done(function(json, textStatus, jqXHR) {
                            SetMessage("下载成功!赶紧去看看吧~", "inf");

                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            SetMessage("下载失败!是不是没有开启aria2?", "err");
                        });
            }
        }
    })();
    pan.init();
};
var css = function() {/*
.show-export-button {
    font-size: 14px;
    width: 140px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    background: rgba(255,255,255,0.75);
    top: 20px;
    left: 0px;
    right: 0px;
    bottom: auto;
    margin: auto;
    position: absolute;
    z-index: 999;
    display: none;
}

li[rel="item"]:hover .show-export-button {
    display: block;
    cursor: pointer;
}
 */
}.toString().slice(15, -4);
function onload(func) {
    if (document.readyState === "complete") {
        func();
        setTimeout(function(){
            func();
        },300);
    } else {
        setTimeout(function(){
            window.addEventListener('load', func);
        },300);
        
    }
}

onload(function() {
    //把函数注入到页面中
    var root=document.querySelector("iframe[rel='wangpan']").contentDocument;
    var script = document.createElement('script');
    script.id = "pan_115_script";
    script.appendChild(document.createTextNode('(' + pan_115 + ')();'));
    (document.body || document.head || document.documentElement).appendChild(script);
    var style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = css;
    root.head.appendChild(style);
});
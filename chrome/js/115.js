// ==UserScript==
// @name            115网盘aria2导出工具
// @author          acgotaku311
// @description 一个方便把115网盘导出到Aria2rpc的脚本。
// @encoding           utf-8
// @include     http://*.115.com/*
// @run-at       document-end
// @version 0.1.5
// ==/UserScript==
var pan_115 = function(cookies) {
    var version = "0.1.4";
    var update_date = "2016/02/09";
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
        //设置aria2c下载设置的Header信息
        var combination = {
            header: function(type) {
                var addheader = [];
                var UA = $("#setting_aria2_useragent_input").val() || "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36 115Browser/5.1.3";
                var headers = $("#setting_aria2_headers").val();
                var referer = $("#setting_aria2_referer_input").val() || "http://115.com/";
                addheader.push("User-Agent: " + UA);
                // var baidu_cookies=JSON.parse(cookies);
                // var format_cookies=[];
                // for(var i=0;i<baidu_cookies.length;i++){
                //     for(var key in baidu_cookies[i]){
                //         // addheader.push("Cookie: " + key +"=" +baidu_cookies[i][key]);
                //         format_cookies.push(key +"=" +baidu_cookies[i][key]);
                //     }
                // }
                // addheader.push("Cookie: " + format_cookies.join(";"));
                addheader.push("Referer: " + referer);
                if (headers) {
                    var text = headers.split("\n");
                    for (var i = 0; i < text.length; i++) {
                        addheader.push(text[i]);
                    }
                }
                var header = "";
                if (type == "aria2c_line") {
                    for (var i = 0; i < addheader.length; i++) {
                        header += " --header " + JSON.stringify(addheader[i]) + " ";
                    }
                    return header;
                } else if (type == "aria2c_txt") {
                    for (var i = 0; i < addheader.length; i++) {
                        header += " header=" + (addheader[i]) + " \n";
                    }
                    return header;
                } else if (type == "idm_txt") {
                    for (var i = 0; i < addheader.length; i++) {
                        header += " header=" + (addheader[i]) + " \n";
                    }
                    return header;
                } else {
                    return addheader;
                }

            }
        };
        var css = function() {/*
        .btn-aria2c{
            position: relative;
            top:2px;
            float: right;
            margin-right: 10px;
            margin-left: 10px;
            padding: 0 10px 0 10px;
            line-height: 30px;
            font-size: 14px;
            color: white;
            background: #2b91e3;
            border-radius: 3px;
            cursor: pointer;
            z-index:100;
        }
        .btn-txt{
            position: relative;
            top:2px;
            float: right;
            margin-right: 10px;
            padding: 0 10px 0 10px;
            line-height: 30px;
            font-size: 14px;
            color: white;
            background: #2b91e3;
            border-radius: 3px;
            cursor: pointer;
            z-index:100;
        }

        li[rel="item"]:hover .show-export-button {
            display: block;
            cursor: pointer;
            background:#FFD;
        }
         */
        }.toString().slice(15, -4);
        var url = (localStorage.getItem("rpc_url") || "http://localhost:6800/jsonrpc") + "?tm=" + (new Date().getTime().toString());
        return {
            //初始化按钮和一些事件
            init: function() {
                var self = this;
                self.set_down_url();
                self.set_btn();
                self.set_config_ui();
                self.set_config();
                SetMessage("载入成功!", "inf");
            },
            set_btn:function(){
                //设置导出按钮的触发 js_top_panel_box
                //设置 设置按钮
                var self = this;
                document.querySelector("iframe[rel='wangpan']").addEventListener('load',function(){
                    top_panel_box_btn();
                });
                main_page_setting_btn();
                function main_page_setting_btn(){
                    var setting_div=$("<a>").text("插件设置").attr("href","javascript:;");
                    var main_setting_div=$("<a>").text("插件设置").attr("href","javascript:;");
                    main_setting_div.attr("id","main_setting_div");
                    if(!document.querySelector("a[id='main_setting_div']")){
                         main_setting_div.appendTo($(document.querySelector("div[id='js-ch-member-info_box']")).find(".tup-logout"));
                         main_setting_div.on('click',function(){
                            $("#setting_div").show();
                            $("#setting_divtopmsg").html("");
                            self.set_center($("#setting_div"));
                        });
                    }
                }
                function top_panel_box_btn(){
                    var root=document.querySelector("iframe[rel='wangpan']").contentDocument;
                    var setting_div=$("<a>").text("插件设置").attr("href","javascript:;");
                    var main_setting_div=$("<a>").text("插件设置").attr("href","javascript:;");
                    main_setting_div.attr("id","main_setting_div");
                    setting_div.appendTo($(root).find(".tup-logout"));
                    if(!document.querySelector("a[id='main_setting_div']")&&document.querySelector("iframe[rel='wangpan']").src.indexOf('ct=rb&is_wl_tpl=1')<0){
                        main_setting_div.appendTo($(document.querySelector("div[id='js-ch-member-info_box']")).find(".tup-logout"));
                        main_setting_div.on('click',function(){
                            $("#setting_div").show();
                            $("#setting_divtopmsg").html("");
                            self.set_center($("#setting_div"));
                        });
                    }
                    setting_div.on('click',function(){
                        $("#setting_div").show();
                        $("#setting_divtopmsg").html("");
                        self.set_center($("#setting_div"));
                    });
                    if(!root.querySelector("a[menu='clear']")){
                        $(root).find(".file-path").after($("<div>").text("RPC下载").addClass("btn-aria2c").on('click',function(){
                            self.aria2_export(true);
                        }));
                        $(root).find(".file-path").after($("<div>").text("导出下载").addClass("btn-txt").on('click',function(){
                            self.aria2_download();
                            self.aria2_export(false);
                        }));
                    }
                    var style = document.createElement('style');
                    style.setAttribute('type', 'text/css');
                    style.textContent = css;
                    root.head.appendChild(style);
                }
            },
            set_config_ui:function(){
                var self = this;
                var setting_div = document.createElement("div");
                setting_div.className = "download-mgr-dialog dialog-box";
                setting_div.id = "setting_div";
                var html_ = [
                    '<h2 class="dialog-title" ><span rel="base_title">导出设置</span><div class="dialog-handle"><a href="javascript:;" class="diag-close" btn="close">关闭</a></div></h2>',
                    '<div style=" margin: 20px 10px 10px 10px; ">',
                    '<div id="setting_divtopmsg" style="position:absolute; margin-top: -18px; margin-left: 10px; color: #E15F00;"></div>',
                    '<table id="setting_div_table" >',
                    '<tbody>',
                    '<tr><td width="100"><label>ARIA2 RPC：</label></td><td><input id="rpc_input" type="text" class="input-large"></td></tr>',
                    '<tr><td><label>RPC访问设置</label></td><td><input id="rpc_distinguish" type="checkbox"></td></tr>',
                    '<tr><td><label >RPC 用户名：</label></td><td><input type="text" id="rpc_user" disabled="disabled" class="input-small"></td></tr>',
                    '<tr><td><label>RPC 密码：</label></td><td><input type="text" id="rpc_pass" disabled="disabled" class="input-small"></td></tr>',
                    '<tr><td><label>Secret Token：</label></td><td><input type="text" id="rpc_token" class="input-small"><div style="position:absolute; margin-top: -20px; right: 20px;"><a id="send_test" type="0" href="javascript:;" >测试连接，成功显示版本号。</a></div></td></tr>',
                    '<tr><td><label>下载路径:</label></td><td><input type="text" placeholder="只能设置为绝对路径" id="setting_aria2_dir" class="input-large"></td></tr>',
                    '<tr><td><label>User-Agent :</label></td><td><input type="text" id="setting_aria2_useragent_input" class="input-large"></td></tr>',
                    '<tr><td><label>Referer ：</label></td><td><input type="text" id="setting_aria2_referer_input" class="input-large"></td></tr>',
                    '<tr><td colspan="2"><div style="color: #656565;">Headers<label style="margin-left: 65px;">※使用回车分隔每个headers。</label></div><li class="b-list-item separator-1"></li></td></tr>',
                    '<tr><td><label>headers ：</label></td><td><textarea id="setting_aria2_headers" ></textarea></td></tr>',
                    '</tbody>',
                    '</table>',
                    '<div style="margin-top:10px;">',
                    '<div id="copyright">© Copyright <a href="https://github.com/acgotaku/115">雪月秋水 </a> Version:' + version + ' 更新日期: ' + update_date + ' </div>',
                    '<div style="margin-left:20px; display:inline-block"><a href="javascript:;" id="apply" class="button" ><b>应用</b></a></div>',
                    '</div>',
                    '</div>'
                ];
                setting_div.innerHTML = html_.join("");
                document.body.appendChild(setting_div);
                $(".diag-close").click(function() {
                    $("#setting_div").hide();
                });
                $("#apply").click(function() {
                    self.get_config();
                    $("#setting_divtopmsg").html("设置已保存.");
                });
                $("#send_test").click(function() {
                    self.get_version();
                });
                $("#rpc_distinguish").change(function() {
                    if ($(this).is(":checked")) {
                        $("#rpc_user").removeAttr("disabled").css("background-color", "#FFF");
                        $("#rpc_pass").removeAttr("disabled").css("background-color", "#FFF");
                    } else {
                        $("#rpc_user").attr({"disabled": "disabled"}).css("background-color", "#eee");
                        $("#rpc_pass").attr({"disabled": "disabled"}).css("background-color", "#eee");
                    }
                });

            },
            //填充已经设置的配置数据
            set_config: function() {
                $("#rpc_input").val((localStorage.getItem("rpc_url") || "http://localhost:6800/jsonrpc"));
                $("#rpc_token").val(localStorage.getItem("rpc_token"));
                $("#setting_aria2_dir").val(localStorage.getItem("rpc_dir"));
                $("#setting_aria2_useragent_input").val(localStorage.getItem("UA") || "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36 115Browser/5.1.3");
                $("#setting_aria2_referer_input").val(localStorage.getItem("referer") || "http://115.com/");
                $("#setting_aria2_headers").val(localStorage.getItem("rpc_headers"));

                if (localStorage.getItem("auth") == "true") {
                    var rpc_user = localStorage.getItem("rpc_user");
                    var rpc_pass = localStorage.getItem("rpc_pass");
                    $("#rpc_user").val(rpc_user);
                    $("#rpc_pass").val(rpc_pass);
                    $("#rpc_distinguish").prop('checked', true).trigger("change");
                    auth = "Basic " + btoa(rpc_user + ":" + rpc_pass);
                }
                else {
                    $("#rpc_user, #rpc_pass").val("");
                }
            },
            //保存配置数据
            get_config: function() {
                var rpc_url = $("#rpc_input").val();
                if (rpc_url) {
                    localStorage.setItem("rpc_url", rpc_url);
                    url = rpc_url + "?tm=" + (new Date().getTime().toString());
                }
                localStorage.setItem("UA", document.getElementById("setting_aria2_useragent_input").value || "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36 115Browser/5.1.3");
                if ($("#rpc_distinguish").prop('checked') == true) {
                    localStorage.setItem("rpc_user", $("#rpc_user").attr("value"));
                    localStorage.setItem("rpc_pass", $("#rpc_pass").attr("value"));
                    localStorage.setItem("auth", true);
                    auth = "Basic " + btoa($("#rpc_user").attr("value") + ":" + $("#rpc_pass").attr("value"));
                } else {
                    localStorage.setItem("auth", false);
                    localStorage.setItem("rpc_user", null);
                    localStorage.setItem("rpc_pass", null);
                }
                localStorage.setItem("rpc_token", $("#rpc_token").val());
                localStorage.setItem("rpc_dir", $("#setting_aria2_dir").val());
                localStorage.setItem("rpc_headers", $("#setting_aria2_headers").val());
                localStorage.setItem("referer", $("#setting_aria2_referer_input").val());
            },
            set_center:function(obj){
                    var screenWidth = $(window).width(), screenHeight = $(window).height();
                    var scrolltop = $(document).scrollTop();
                    var objLeft = (screenWidth - obj.width())/2 ;
                    var objTop = (screenHeight - obj.height())/2 + scrolltop;
                    obj.css({left: objLeft + 'px', top: objTop + 'px'});
            },
            getFileInfo:function(pick_code,method,path){
                var self=this;

                DownBridge.getFileUrl(pick_code,function(data){
                    var file_list=[];
                    file_list.push({"name": (path||"")+$('<textarea />').html(data.file_name).text(), "link": data.file_url});
                    if(method){
                        self.aria2_rpc(file_list);
                    }else{
                        $("#download_ui").show();
                        self.aria2_data(file_list);
                    }

                });
            },
            //115下载核心功能 导出
            aria2_export:function(method){
                var self=this;
                var root=document.querySelector("iframe[rel='wangpan']").contentDocument;
                $(root).find('li[rel="item"][file_type="1"]').each(function(){
                    if($(this).children().eq(3).prop('checked') == true){
                        var pick_code = $(this).attr('pick_code');
                        self.getFileInfo(pick_code,method);
                    }
                });
                $(root).find('li[rel="item"][file_type="0"]').each(function(){
                    if($(this).children().eq(1).prop('checked') == true){
                        var cate_id = $(this).attr('cate_id');
                        DownBridge.getFileList(cate_id,function(data){
                            var list =data.data;
                            for(var i=0;i<list.length;i++){
                                if(list[i].sha){
                                    self.getFileInfo(list[i].pc,method,data.path[data.path.length-1].name+"/");
                                }else{
                                    var dir_level=data.path.length-1;
                                    self.get_all_dir(list[i].cid,dir_level,method);
                                }
                            }
                        });
                    }
                });
            },
            //递归下载
            get_all_dir:function(cid,dir_level,method){
                var self=this;
                DownBridge.getFileList(cid,function(data){
                    var list =data.data;
                    var path="";
                    for(var i=dir_level;i<data.path.length;i++){
                        path+=data.path[i].name+"/";
                    }
                    for(var i=0;i<list.length;i++){
                        if(list[i].sha){
                            self.getFileInfo(list[i].pc,method,path);
                        }else{
                            self.get_all_dir(list[i].cid,dir_level,method);
                        }
                    }
                });
            },
            //aria2导出下载界面以及事件绑定
            aria2_download: function() {
                if ($("#download_ui").length == 0) {
                    var download_ui = $("<div>").attr("id", "download_ui").addClass("download-mgr-dialog dialog-box").html('<h2 class="dialog-title" ><span rel="base_title">ARIA2导出</span><div class="dialog-handle"><a href="javascript:;" class="diag-close" btn="close">关闭</a></div></h2>');
                    var content_ui = $("<div>").addClass("content").attr("id", "content_ui").appendTo(download_ui);
                    download_ui.appendTo($("body"));
                    content_ui.empty();
                    var download_menu = $("<div>").css({"display": "block", "margin-bottom": "10px"}).appendTo(content_ui);
                    var aria2c_btn = $("<a>").attr("id", "aria2c_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "aria2c.down", "target": "_blank"}).addClass("new-btn").html('<b>存为aria2文件</b>').appendTo(download_menu);
                    var idm_btn = $("<a>").attr("id", "idm_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "idm.txt", "target": "_blank"}).addClass("new-btn").html('<b>存为IDM文件</b>').appendTo(download_menu);
                    var download_txt_btn = $("<a>").attr("id", "download_txt_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "download_link.down", "target": "_blank"}).addClass("new-btn").html('<b>保存下载链接</b>').appendTo(download_menu);
                    var download_link = $("<textarea>").attr("wrap", "off").attr("id", "download_link").css({"white-space": "nowrap", "width": "100%", "overflow": "scroll", "height": "180px"});
                    download_link.appendTo(content_ui);
                    $(".diag-close").click(function() {
                        download_ui.hide();
                    });
                } else {
                    $("#aria2c_btn, #idm_btn, #download_txt_btn").attr("href", "data:text/plain;charset=utf-8,");
                    $("#download_link").val("");
                }
            },
            //导出填充数据和显示数据
            aria2_data: function(file_list) {
                var files = [];
                var aria2c_txt = [];
                var idm_txt = [];
                var down_txt = [];
                if (file_list.length > 0) {
                    var length = file_list.length;
                    for (var i = 0; i < length; i++) {
                        files.push("aria2c -c -s10 -k1M -x10 -o " + JSON.stringify(file_list[i].name) + combination.header('aria2c_line') + " " + JSON.stringify(file_list[i].link) + "\n");
                        aria2c_txt.push([
                            file_list[i].link,
                            combination.header("aria2c_txt"),
                            ' out=' + file_list[i].name,
                            ' continue=true',
                            ' max-connection-per-server=10',
                            '  split=10',
                            '\n'
                        ].join('\n'));
                        idm_txt.push([
                            '<',
                            file_list[i].link,
                            ' cookie: ' + cookies,
                            ' out=' + file_list[i].name,
                            ' >'
                        ].join('\r\n'));
                        down_txt.push([file_list[i].link, ' '].join('\n'));
                    }
                    $("#aria2c_btn").attr("href", $("#aria2c_btn").attr("href") + encodeURIComponent(aria2c_txt.join("")));
                    $("#idm_btn").attr("href", $("#idm_btn").attr("href") + encodeURIComponent(idm_txt.join("")));
                    $("#download_txt_btn").attr("href", $("#download_txt_btn").attr("href") + encodeURIComponent(down_txt.join("")));
                    $("#download_link").val($("#download_link").val() + files.join(""));
                    $("#download_ui").show();
                    this.set_center($("#download_ui"));
                }

            },
            set_down_url:function(){
                var self=this;
                DownBridge={};
                  $('<iframe>').attr('src', '//webapi.115.com/bridge_2.0.html?namespace=DownBridge&api=jQuery').css({
                    width: 0,
                    height: 0,
                    border: 0,
                    padding: 0,
                    margin: 0,
                    position: 'absolute',
                    top: '-99999px'
                  }).one('load',function(){
                    window.DownBridge.getFileUrl=function(pickcode,callback){
                    this.jQuery.get('//webapi.115.com/files/download?pickcode=' + pickcode, function (data) {
                             callback(data);
                            }, 'json');
                    };
                    window.DownBridge.getFileList=function(cate_id,callback){
                    this.jQuery.get('//webapi.115.com/files?aid=1&limit=1000&show_dir=1&cid=' + cate_id, function (data) {
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
                        .done(function(xml, textStatus, jqXHR) {
                            $("#send_test").html("ARIA2\u7248\u672c\u4e3a\uff1a\u0020" + xml.result.version);
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
                                    "dir":$("#setting_aria2_dir").val()||null,
                                    "header": combination.header()
                                }
                            ]
                        };
                        if ($("#rpc_token").val()) {
                            rpc_data.params.unshift("token:" + $("#rpc_token").val());
                        }
                        self.aria2send_data(rpc_data);
                    }
                }
            },
            //和aria2c通信
            aria2send_data: function(data) {
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

var setting_css= function() {/*
.download-mgr-dialog{
    z-index: 1000000099;
    position: fixed;
    background: #FFF;
    width:580px;
    display:none;
    font-family: tahoma, arial, 宋体, 'Microsoft Yahei', Simsun;
}
#setting_div_table input{
border: 1px solid #C6C6C6;
box-shadow: 0 0 3px #C6C6C6;
-webkit-box-shadow: 0 0 3px #C6C6C6;
height:18px;
}
.input-large{
width:90%;
}
.input-small{
width:150px;
}
.new-btn{
    position: relative;
    display: inline-block;
    height: 30px;
    padding: 0 10px 0 10px;
    line-height: 30px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: white;
    border-radius: 3px;
    margin-right: 10px;
    background: #52C035;
    cursor: pointer;
}
.new-btn:hover{
    text-decoration: none;
    cursor: pointer;
}
#setting_div_table input[disabled]{
cursor: not-allowed;
background-color: #eee;
}
#send_test{
display:inline-block;
border:1px solid #D1D1D1;
background-color: #F7F7F7;
text-align: center; text-decoration: none;
color:#1B83EB;
}
#copyright{
display:inline-block;
}
#setting_aria2_headers{
overflow:auto;
resize:none;
width:90%;
height:80px;
border: 1px solid #C6C6C6;
box-shadow: 0 0 3px #C6C6C6;
-webkit-box-shadow: 0 0 3px #C6C6C6;
}
#apply{
display:inline-block;
width:100px;
height:40px;
text-align: center;
text-decoration: none;
background: #52C035;
background: -webkit-linear-gradient(top, #52C035, #4BAC32);
background: -moz-linear-gradient(top, #52C035, #4BAC32);
background: -o-linear-gradient(top, #52C035, #4BAC32);
filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#52C035', endColorstr='#4BAC32');
}
#apply b{
    float:none;
    padding-right: 2px;
}
.download-mgr-dialog .content {
padding: 10px 20px;
height:auto;
overflow: hidden;
}
#setting_div_table{
width:100%;
border:0;
border-collapse:separate;
border-spacing:10px;
display:table;
background-color: rgb(250, 250, 250);
}
 */
}.toString().slice(15, -4);
if(document.querySelector("iframe[rel='wangpan']")&&top.location==location){
    document.querySelector("iframe[rel='wangpan']").addEventListener('load',function(){
        var root=document.querySelector("iframe[rel='wangpan']").contentDocument;
        var script = document.createElement('script');
        script.id = "pan_115_script";
        script.appendChild(document.createTextNode('(' + pan_115 + ')();'));
        if(document.querySelector("#pan_115_script") == null){
            (document.body || document.head || document.documentElement).appendChild(script);
            var style = document.createElement('style');
            style.setAttribute('type', 'text/css');
            style.textContent = setting_css;
            document.head.appendChild(style);
        }
    });
}
var script = document.createElement('script');
script.id = "pan_115_script";
script.appendChild(document.createTextNode('(' + pan_115 + ')();'));
if(document.querySelector("#pan_115_script") == null){
    (document.body || document.head || document.documentElement).appendChild(script);
    var style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = setting_css;
    document.head.appendChild(style);
}



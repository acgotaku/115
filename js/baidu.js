// ==UserScript==
//单纯的JS是无法运行的,必须使用扩展才行.
// @name            百度网盘aria2导出工具
// @author          acgotaku311
// @description 一个方便吧百度网盘的Aria2rpc导出的脚本。
// @encoding           utf-8
// @include     http://*n.baidu.com/s/*
// @include     http://*n.baidu.com/disk/home*
// @include     http://*n.baidu.com/share/link*
// @include     https://*n.baidu.com/s/*
// @include     https://*n.baidu.com/disk/home*
// @include     https://*n.baidu.com/share/link*
// @run-at       document-end
// @version 0.3.0
// ==/UserScript==
var baidu = function(cookies) {
    var version = "0.3.0";
    var update_date = "2015/01/11";
    var baidupan = (function() {
        var home = window.location.href.indexOf("/disk/home") != -1 ? true : false;
        //封装的百度的Toast提示消息
        //Type类型有
        //MODE_CAUTION  警告  MODE_FAILURE  失败  MODE_LOADING 加载 MODE_SUCCESS 成功
        var SetMessage = function(msg, type) {   
            var Toast = require("common:widget/toast/toast.js");
            Toast.obtain.useToast({
                toastMode: Toast.obtain[type],
                msg: msg,
                sticky: false
            });
        };
		//console.log=function() {};
        //重新封装的XMLHttpRequest 用来代替$.ajax 因为百度网盘的$.ajax已经被修改了
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
                var UA = $("#setting_aria2_useragent_input").val() || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36";
                var headers = $("#setting_aria2_headers").val();
                var referer = $("#setting_aria2_referer_input").val() || "http://pan.baidu.com/disk/home";
                addheader.push("User-Agent: " + UA);
                var baidu_cookies=JSON.parse(cookies);
                var format_cookies=[];
                for(var i=0;i<baidu_cookies.length;i++){
                    for(var key in baidu_cookies[i]){
                        // addheader.push("Cookie: " + key +"=" +baidu_cookies[i][key]);
                        format_cookies.push(key +"=" +baidu_cookies[i][key]);
                    }
                }
                addheader.push("Cookie: " + format_cookies.join(";"));
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
        var auth = null; //是否设置用户名密码验证 设置的话变为auth赋值

        //设置RPC PATH
        var url = (localStorage.getItem("rpc_url") || "http://localhost:6800/jsonrpc") + "?tm=" + (new Date().getTime().toString());
        //设置将要执行的下载方式
        var func = "aria2_data";
        return {
            //初始化按钮和一些事件
            init: function() {
                var self = this;
                self.set_export_ui();
                self.set_config_ui();
                self.set_config();
                combination.header();
            },
            set_export_ui: function() {
                var self = this;
                var aria2_btn = $("<span>").addClass("icon-btn-device").css("float", "none");
                var list = $("<div>").addClass("menu").attr("id", "aria2_list").appendTo(aria2_btn);
                var aria2_export = $("<a>").text("ARIA2 RPC").appendTo(list);
                var aria2_download = $("<a>").text("导出下载").attr("id", "aria2_download").appendTo(list);
                var config = $("<a>").text("设置").appendTo(list);
                if (!home) {
                    aria2_btn.addClass("new-dbtn").append('<em class="global-icon-download"></em><b>导出下载</b>');
                    $('span a[class="new-dbtn"]').parent().prepend(aria2_btn);
                    aria2_export.click(function() {
                        func = "aria2_rpc";
                        self.get_share_id();
                    });
                    aria2_download.click(function() {
                        self.aria2_download();
                        func = "aria2_data";
                        self.get_share_id();
                    });
                    SetMessage("初始化成功!", "MODE_SUCCESS");

                } else {
                    aria2_btn.append($("<span>").text("导出下载").addClass("text").before($("<span>").addClass("ico")).after($("<span>").addClass("ico-more")));
                    $(".icon-btn-device").after(aria2_btn);
                    if (cookies != "undefined") {
                        SetMessage("初始化成功!", "MODE_SUCCESS");
                    } else {
                        SetMessage("未获取到cookie!请重新加载", "MODE_FAILURE");
                    }
                    aria2_download.click(function() {
                        func = "aria2_data";
                        self.get_dlink();
                        self.aria2_download();
                    });
                    aria2_export.click(function() {
                        func = "aria2_rpc";
                        self.get_dlink();
                    });
                }
                aria2_btn.mouseover(function() {
                    list.show();
                })
                        .mouseout(function() {
                            list.hide();
                        });

                config.click(function() {
                    $("#setting_div").show();
                    $("#setting_divtopmsg").html("");
                    self.set_center($("#setting_div"));
                });


            },
            set_center:function(obj){
                    var screenWidth = $(window).width(), screenHeight = $(window).height();
                    var scrolltop = $(document).scrollTop();
                    var objLeft = (screenWidth - obj.width())/2 ;
                    var objTop = (screenHeight - obj.height())/2 + scrolltop;
                    obj.css({left: objLeft + 'px', top: objTop + 'px'});
            },
            //获取选择的文件的link和name
            get_info: function(data) {
                var self = this;
                var file_list = [];//储存选中的文件信息包含link和name
                var File = require("common:widget/data-center/data-center.js");
                var Filename = File.get("selectedItemList");
                var obj = $.parseJSON(data);
                console.log(obj);
                var name = self.get_level();
                var length = Filename.length;
                for (var i = 0; i < length; i++) {
                    if (obj.dlink[0].fs_id == Filename[i].attr("data-id")) {
                        var temp =Filename[i].children().eq(0).children().eq(2).attr("title")||Filename[i].children().eq(1).children().eq(0).attr("title");
                        name =name +temp;
                    }  
                }//Filename[0].children().eq(1).children().eq(0).attr("title")

                file_list.push({"name": name, "link": obj.dlink[0].dlink});
                self[func](file_list);
            },
            //获取文件夹层数
            get_level:function(){
                var API = (require("common:widget/restApi/restApi.js"),require("common:widget/hash/hash.js"));
                var level=parseInt($("#rpc_fold").val());
                var path=API.get("path");
                var maxlevel=0;
                if(path == "/"|| path == null){
                    path="";
                }else{
                    maxlevel=path.split("/").length-1;
                }
                if(level>maxlevel){
                    SetMessage("文件夹层数超过完整路径", "MODE_CAUTION");
                    level=maxlevel;
                }
                if(level == -1){
                    path=path+"/";
                }else if(level>0){
                    var num=[];
                    for(var i=0;i<level;i++){
                        num.push(".*");
                    }
                    var re = new RegExp(".*\/("+num.join("\/")+")$");
                    path=path.match(re)[1]+"/";
                }else if(level==0){
                    path="";
                }
                console.log(path);
                return path;
            },
            //获取文件夹下载的信息
            get_dir: function(data) {
                var self = this;
                var obj = $.parseJSON(data);
                var File = require("common:widget/data-center/data-center.js");
                var Filename = File.get("selectedItemList");
                var name=[];
                for(var i=0;i<Filename.length;i++){
                    name.push(Filename[i].children().eq(0).children().eq(2).attr("title"));
                }
                var file_list = [];
                file_list.push({"name": name.join("_")+".zip", "link": obj.dlink});
                self[func](file_list);
            },
            //设置界面的UI
            set_config_ui: function() {
                var self = this;
                var setting_div = document.createElement("div");
                setting_div.className = "b-panel b-dialog download-mgr-dialog";
                setting_div.id = "setting_div";
                var html_ = [
                    '<div class="dlg-hd b-rlv"><div title="关闭" id="setting_div_close" class="dlg-cnr dlg-cnr-r"></div><h3>导出设置</h3></div>',
                    '<div class="dlg-bd clearfix" style=" margin: 20px 10px 10px 10px; ">',
                    '<div id="setting_divtopmsg" style="position:absolute; margin-top: -18px; margin-left: 10px; color: #E15F00;"></div>',
                    '<table id="setting_div_table" >',
                    '<tbody>',
                    '<tr><td width="100"><label>ARIA2 RPC：</label></td><td><input id="rpc_input" type="text" class="input-large"></td></tr>',
                    '<tr><td><label>文件夹打包下载:</label></td><td><input id="rpc_zip" type="checkbox"></td></tr>',
                    '<tr><td><label>RPC访问设置</label></td><td><input id="rpc_distinguish" type="checkbox"></td></tr>',
                    '<tr><td><label >RPC 用户名：</label></td><td><input type="text" id="rpc_user" disabled="disabled" class="input-small"></td></tr>',
                    '<tr><td><label>RPC 密码：</label></td><td><input type="text" id="rpc_pass" disabled="disabled" class="input-small"></td></tr>',
                    '<tr><td><label>递归下载延迟：</label></td><td><input type="text" id="rpc_delay" class="input-small">(单位:毫秒)</td></tr>',
                    '<tr><td><label>文件夹结构层数：</label></td><td><input type="text" id="rpc_fold" class="input-small">(默认0表示不保留,-1表示保留完整路径)</td></tr>',
                    '<tr><td><label>Secret Token：</label></td><td><input type="text" id="rpc_token" class="input-small"><div style="position:absolute; margin-top: -20px; right: 20px;"><a id="send_test" type="0" href="javascript:;" >测试连接，成功显示版本号。</a></div></td></tr>',
                    '<tr><td><label>下载路径:</label></td><td><input type="text" placeholder="只能设置为绝对路径" id="setting_aria2_dir" class="input-large"></td></tr>',
                    '<tr><td><label>User-Agent :</label></td><td><input type="text" id="setting_aria2_useragent_input" class="input-large"></td></tr>',
                    '<tr><td><label>Referer ：</label></td><td><input type="text" id="setting_aria2_referer_input" class="input-large"></td></tr>',
                    '<tr><td colspan="2"><div style="color: #656565;">Headers<label style="margin-left: 65px;">※使用回车分隔每个headers。</label></div><li class="b-list-item separator-1"></li></td></tr>',
                    '<tr><td><label>headers ：</label></td><td><textarea id="setting_aria2_headers" ></textarea></td></tr>',
                    '</tbody>',
                    '</table>',
                    '<div style="margin-top:10px;">',
                    '<div id="copyright">© Copyright <a href="https://github.com/acgotaku/BaiduExporter">雪月秋水 </a> Version:' + version + ' 更新日期: ' + update_date + ' </div>',
                    '<div style="margin-left:70px; display:inline-block"><a href="javascript:;" id="apply" ><b>应用</b></a></div>',
                    '</div>',
                    '</div>'
                ];
                setting_div.innerHTML = html_.join("");
                document.body.appendChild(setting_div);
                $("#setting_div_close").click(function() {
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
                })


            },
            //处理验证码
            alert_dialog: function(json, params) {
                var self = this;
                var id = json.request_id;
                var div = $("<div>").attr("id", "alert_div" + id).addClass("b-panel b-dialog alert-dialog");
                var html = [
                    '<div class="dlg-hd b-rlv">',
                    '<div title="关闭" id="alert_dialog_close" class="dlg-cnr dlg-cnr-r"></div>',
                    '<h3>提示</h3>',
                    '</div>',
                    '<div class="dlg-bd">',
                    '<div class="alert-dialog-msg center">',
                    '<div class="download-verify">',
                    '<div class="verify-body">请输入验证码：<input id="verification" type="text" class="input-code" maxlength="4">',
                    '<img id="vcode" class="img-code" alt="验证码获取中"  width="100" height="30">',
                    '<a href="javascript:;" class="underline" id="change">换一张</a>',
                    '</div>',
                    '<div class="verify-error">',
                    (json.auth ? "\u9a8c\u8bc1\u7801\u8f93\u5165\u9519\u8bef\uff0c\u8bf7\u91cd\u65b0\u8f93\u5165" : ""),
                    '</div>',
                    '</div>',
                    '</div>',
                    '</div>',
                    '<div class="dlg-ft b-rlv">',
                    '<div class="alert-dialog-commands clearfix center">',
                    '<a href="javascript:;" id="okay" class="sbtn okay"><b>确定</b></a>',
                    '<a href="javascript:;" id="ignore" class="dbtn cancel"><b>取消</b></a>',
                    '</div>',
                    '</div>'
                ];
                div.html(html.join(""));
                div.appendTo($("body"));
                div.find("*[id]").each(function(index, element) {
                    $(element).attr("id", $(element).attr("id") + id);
                });
                div.show();
                var offset = new Date().getTime().toString().slice(-2);
                var screenWidth = $(window).width(), screenHeight = $(window).height();
                var scrolltop = $(document).scrollTop();
                var divLeft = (screenWidth - div.width()) / 2 + parseInt(offset);
                var divTop = (screenHeight - div.height()) / 2 + scrolltop - parseInt(offset);
                div.css({left: divLeft + "px", top: divTop + "px", "z-index": 2000});
                $("#vcode" + id).attr("src", json.vcode_img);
                $("#change" + id).unbind().click(function() {
                    var url = "http://vcode.baidu.com/genimage";
                    $("#vcode" + id).attr("src", url + "?" + json.vcode_str + "&" + new Date().getTime());
                });
                $("#okay" + id).unbind().click(function() {
                    var input_code = $("#verification" + id).attr("value");
                    var data = params + "&vcode_input=" + input_code + "&vcode_str=" + json.vcode_str;
                    self.get_share_dlink(yunData, data);
                    div.remove();
                });
                $("#ignore" + id).unbind().click(function() {
                    div.remove();
                    SetMessage("\u5509\u002e\u002e\u002e\u002e\u002e", "MODE_CAUTION");
                });
                $("#alert_dialog_close" + id).unbind().click(function() {
                    div.remove();
                });
            },
            //aria2导出下载界面以及事件绑定
            aria2_download: function() {
                if ($("#download_ui").length == 0) {
                    var download_ui = $("<div>").attr("id", "download_ui").addClass("b-panel b-dialog download-mgr-dialog common-dialog").append('<div class="dlg-hd b-rlv"><span class="dlg-cnr dlg-cnr-l"></span><a href="javascript:;" title="关闭" id="aria2_download_close" class="dlg-cnr dlg-cnr-r"></a><h3><em></em>ARIA2导出</h3></div>');
                    var content_ui = $("<div>").addClass("content").attr("id", "content_ui").appendTo(download_ui);
                    download_ui.appendTo($("body"));
                    content_ui.empty();
                    var download_menu = $("<div>").addClass("module-list-toolbar").css({"display": "block", "margin-bottom": "10px"}).appendTo(content_ui);
                    if (home) {
                        var aria2c_btn = $("<a>").attr("id", "aria2c_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "aria2c.down", "target": "_blank"}).addClass("btn download-btn").append($("<span>").addClass("ico")).append($("<span>").addClass("btn-val").text("存为aria2文件")).appendTo(download_menu);
                        var idm_btn = $("<a>").attr("id", "idm_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "idm.down", "target": "_blank"}).addClass("btn download-btn").append($("<span>").addClass("ico")).append($("<span>").addClass("btn-val").text("存为IDM文件")).appendTo(download_menu);
                        var download_link = $("<textarea>").attr("wrap", "off").attr("id", "download_link").css({"white-space": "nowrap", "width": "100%", "overflow": "scroll", "height": "180px"});

                    } else {
                        var aria2c_btn = $("<a>").attr("id", "aria2c_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "aria2c.down", "target": "_blank"}).addClass("new-dbtn").html('<em class="global-icon-download"></em><b>存为aria2文件</b>').appendTo(download_menu);
                        var idm_btn = $("<a>").attr("id", "idm_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "idm.down", "target": "_blank"}).addClass("new-dbtn").html('<em class="global-icon-download"></em><b>存为IDM文件</b>').appendTo(download_menu);
                        var download_txt_btn = $("<a>").attr("id", "download_txt_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "download_link.down", "target": "_blank"}).addClass("new-dbtn").html('<em class="global-icon-download"></em><b>保存下载链接</b>').appendTo(download_menu);
                        var download_link = $("<textarea>").attr("wrap", "off").attr("id", "download_link").css({"white-space": "nowrap", "width": "100%", "overflow": "scroll", "height": "180px"});
                    }
                    download_link.appendTo(content_ui);
                    $("#aria2_download_close").click(function() {
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
            //填充已经设置的配置数据
            set_config: function() {
                $("#rpc_input").val((localStorage.getItem("rpc_url") || "http://localhost:6800/jsonrpc"));
                $("#rpc_delay").val((localStorage.getItem("rpc_delay") || "300"));
                $("#rpc_fold").val((localStorage.getItem("rpc_fold") || "0"));
                $("#rpc_token").val(localStorage.getItem("rpc_token"));
                $("#setting_aria2_dir").val(localStorage.getItem("rpc_dir"));
                $("#setting_aria2_useragent_input").val(localStorage.getItem("UA") || "netdisk;4.4.0.6;PC;PC-Windows;6.2.9200;WindowsBaiduYunGuanJia");
                $("#setting_aria2_referer_input").val(localStorage.getItem("referer") || "http://pan.baidu.com/disk/home");
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
                if(localStorage.getItem("rpc_zip") == "true"){
                    $("#rpc_zip").prop('checked', true);
                }
            },
            //保存配置数据
            get_config: function() {
                var rpc_url = $("#rpc_input").val();
                if (rpc_url) {
                    localStorage.setItem("rpc_url", rpc_url);
                    url = rpc_url + "?tm=" + (new Date().getTime().toString());
                }
                localStorage.setItem("UA", document.getElementById("setting_aria2_useragent_input").value || "netdisk;4.4.0.6;PC;PC-Windows;6.2.9200;WindowsBaiduYunGuanJia");
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
                if($("#rpc_zip").prop('checked') == true){
                    localStorage.setItem("rpc_zip", true);
                }else{
                    localStorage.setItem("rpc_zip", null);
                }
                localStorage.setItem("rpc_delay", $("#rpc_delay").val());
                localStorage.setItem("rpc_token", $("#rpc_token").val());
                localStorage.setItem("rpc_dir", $("#setting_aria2_dir").val());
                localStorage.setItem("rpc_fold", $("#rpc_fold").val());
                localStorage.setItem("rpc_headers", $("#setting_aria2_headers").val());
            },
            get_share_id: function() {
                var self = this;
                if (yunData.SHAREPAGETYPE=="single_file_page") {
                    var fid_list = 'fid_list=' + JSON.stringify([yunData.FS_ID]);
                    self.set_share_data(yunData, fid_list);
                } else {
                    var File = require("common:widget/data-center/data-center.js");
                    var Filename = File.get("selectedItemList");
                    var file_info = File.get("selectedList");
                    if (file_info.length == 0) {
                        SetMessage("先选择一下你要下载的文件哦", "MODE_CAUTION");
                        return;
                    }
                    if($("#rpc_zip").prop('checked') == true){
                        for (var i = 0; i < Filename.length; i++) {
                            if (Filename[i].attr("data-extname") == "dir") {
                                var fid_list = 'fid_list=' + JSON.stringify(File.get("selectedList"));
                                yunData["isdir"]=1;
                                self.set_share_data(yunData, fid_list);
                                return;
                            }
                        }
                    }
                    for (var i = 0; i < Filename.length; i++) {
                            if (Filename[i].attr("data-extname") != "dir") {
                                var fid_list = 'fid_list=' + JSON.stringify([Filename[i].attr("data-id")]);
                                yunData["isdir"]=0;
                                self.set_share_data(yunData, fid_list);
                            }else{
                                self.get_share_dir(Filename[i].attr("data-id"));
                            }
                    }
                }
            },
            get_share_dir:function(fs_id){
                var self=this;
                var API = (require("common:widget/restApi/restApi.js"),require("common:widget/hash/hash.js"));
                var path_head=yunData.PATH.slice(0,yunData.PATH.lastIndexOf("/"));
                var path=API.get("path");
                if(path == "/"|| path == null){
                    path=yunData.PATH;
                }else{
                    path=path_head+path;
                }
                console.log(path);
                var parameter = {'url': "http://pan.baidu.com/share/list?dir="+encodeURIComponent(path)+"&bdstoken="+yunData.MYBDSTOKEN+"&uk="+yunData.SHARE_UK+"&shareid="+yunData.SHARE_ID+"&channel=chunlei&clienttype=0&web=1", 'dataType': 'json', type: 'GET'};
                HttpSendRead(parameter)
                        .done(function(json, textStatus, jqXHR) {
                            SetMessage("获取共享列表成功!", "MODE_SUCCESS");
                            var array=json.list;
                            console.log(json);
                            for(var i=0;i<array.length;i++){
                                if(array[i].fs_id == fs_id ||API.get("path")=="/" || API.get("path") == null){
                                    console.log(array[i]);
                                    if(array[i].isdir == 1){
                                        self.get_share_list(array[i].path);
                                    }else{
                                        var fid_list = 'fid_list=' + JSON.stringify([array[i].fs_id]);
                                        yunData["isdir"]=0;
                                        self.set_share_data(yunData, fid_list);
                                    }
                                }
                            }
                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            SetMessage("获取List失败!", "MODE_FAILURE");
                            console.log(textStatus);
                        });          
            },
            get_share_list:function(path){
                var self=this;
                var time=0;
                var delay=parseInt($("#rpc_delay").val());
                var parameter = {'url': "http://pan.baidu.com/share/list?dir="+encodeURIComponent(path)+"&bdstoken="+yunData.MYBDSTOKEN+"&uk="+yunData.SHARE_UK+"&shareid="+yunData.SHARE_ID+"&channel=chunlei&clienttype=0&web=1", 'dataType': 'json', type: 'GET'};
                HttpSendRead(parameter)
                        .done(function(json, textStatus, jqXHR) {
                            var array=json.list;
                            console.log(json);
                            for(var i=0;i<array.length;i++){
                                time=time+delay;
                                if(array[i].isdir == 1){
                                    delayLoopList(array[i].path,time);
                                }else{
                                    delayLoopFile(array[i].fs_id,time);  
                                    //self.get_filemetas(array[i].path);
                                }
                            }
                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            SetMessage("获取List失败!", "MODE_FAILURE");
                            console.log(textStatus);
                        });  
                function delayLoopList(path){
                    setTimeout(function(){
                        self.get_share_list(path);
                    },time);
                } 
                function delayLoopFile(fs_id){
                    setTimeout(function(){
                        var fid_list = 'fid_list=' + JSON.stringify([fs_id]);
                        yunData["isdir"]=0;
                        self.set_share_data(yunData, fid_list);
                    },time);
                } 
            },
            set_share_data:function(obj,fid_list){
                var self = this; 
                var data = "encrypt=0&product=share&uk="+yunData.SHARE_UK+"&primaryid="+yunData.SHARE_ID+"&"+fid_list;
                if(yunData.SHARE_PUBLIC == 0){
                    var Service = require("common:widget/commonService/commonService.js");
                    data = data+"&extra="+encodeURIComponent(JSON.stringify({sekey:Service.getCookie("BDCLND")}));
                }
                if( obj.isdir == 1 ){ data = data+"&type=batch"; }
                self.get_share_dlink(obj, data);
            },
            get_share_dlink: function(obj, data) {
                var self = this;  
                var download = "http://" + window.location.host + "/api/sharedownload?channel=chunlei&clienttype=0&web=1&app_id="+yunData.FILEINFO[0].app_id + "&timestamp=" + yunData.TIMESTAMP + "&sign=" + yunData.SIGN + "&bdstoken=" + yunData.MYBDSTOKEN;
                var pic="http://" + window.location.host + "/api/getcaptcha?prod=share&channel=chunlei&clienttype=0&web=1&bdstoken="+yunData.MYBDSTOKEN+"&app_id="+yunData.FILEINFO[0].app_id;
                var parameter = {'url': download, 'dataType': 'json', type: 'POST', 'data': data};
                HttpSendRead(parameter)
                        .done(function(json, textStatus, jqXHR) {
                            if (json.errno == -20) {
                                HttpSendRead({'url':pic,'dataType': 'json',type: 'GET'})
                                .done(function(json, textStatus, jqXHR){
                                    if (data.indexOf("input") != -1) {
                                        json.auth = true;
                                    }
                                    self.alert_dialog(json, data);
                                    SetMessage("请输入验证码,以便继续下载", "MODE_CAUTION");
                                })
                                .fail(function(json, textStatus, jqXHR){
                                    SetMessage("获取验证码失败?", "MODE_FAILURE");
                                });
                               
                            } else if (json.errno == 0) {

                                var file_list = [];
                                if(obj.isdir == 1){
                                   self.get_dir(JSON.stringify(json));
                                   return;
                                }else{
                                    for(var i=0;i<json.list.length;i++){
                                    var list=json.list[i];
                                    file_list.push({"name": list.path.slice(yunData.PATH.lastIndexOf("/")+1,list.path.length), "link": list.dlink});
                                    }
                                }
                                self[func](file_list);
                            } else {
                                console.log(json);
                                SetMessage("出现异常!", "MODE_FAILURE");
                            }

                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            SetMessage("获取地址失败?", "MODE_FAILURE");
                        });
            },
            //获取选中文件的下载链接
            get_dlink: function() {
                var self = this;
                var File = require("common:widget/data-center/data-center.js");
                var Service = require("common:widget/commonService/commonService.js");
                var Filename = File.get("selectedItemList");
                var length = Filename.length;
                if (length == 0) {
                    SetMessage("先选择一下你要下载的文件哦", "MODE_CAUTION");
                    return;
                }
                for (var i = 0; i < length; i++) {
                    if (Filename[i].attr("data-extname") == "dir") {
                        if($("#rpc_zip").prop('checked') == true){
                            Service.getDlink(JSON.stringify(File.get("selectedList")), "batch", self.get_dir.bind(self));
                            return;
                        }else{
                            self.get_all_dir(Filename[i].attr("data-id"));
                        }
                    }else{
                        Service.getDlink(JSON.stringify([Filename[i].attr("data-id")]), "dlink", self.get_info.bind(self));
                    }
                    //self.get_all_dir(Filename[i].attr("data-id"));
                    //console.log(Filename[i].attr("data-extname"));
                }
                //Service.getDlink(JSON.stringify(File.get("selectedList")), "dlink", self.get_info.bind(self));
            },
            //递归下载文件夹内容
            get_all_dir:function(fs_id){
                var self=this;
                var API = (require("common:widget/restApi/restApi.js"),require("common:widget/hash/hash.js"));
                var path=API.get("path");
                if(path == null){
                    path="/";
                }
                var parameter = {'url': "http://pan.baidu.com/api/list?dir="+encodeURIComponent(path), 'dataType': 'json', type: 'GET'};
                HttpSendRead(parameter)
                        .done(function(json, textStatus, jqXHR) {
                            SetMessage("获取列表成功!", "MODE_SUCCESS");
                            var array=json.list;
                            for(var i=0;i<array.length;i++){
                                if(array[i].fs_id == fs_id){
                                    if(array[i].isdir == 1){
                                        self.get_list(array[i].path);
                                    }else{
                                        self.get_filemetas(array[i].path);
                                    }
                                }
                            }
                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            SetMessage("获取List失败!", "MODE_FAILURE");
                            console.log(textStatus);
                        });                

            },
            //获取列表的所有文件信息
            get_list:function(path){
                var self=this;
                var time=0;
                var delay=parseInt($("#rpc_delay").val());
                var parameter = {'url': "http://pan.baidu.com/api/list?dir="+encodeURIComponent(path), 'dataType': 'json', type: 'GET'};
                HttpSendRead(parameter)
                        .done(function(json, textStatus, jqXHR) {
                            var array=json.list;
                            console.log(json);
                            for(var i=0;i<array.length;i++){
                                var path=array[i].path;
                                time=time+delay;
                                if(array[i].isdir == 1){
                                    delayLoopList(path,time);
                                }else{
                                    delayLoopFile(path,time);  
                                    //self.get_filemetas(array[i].path);
                                }
                            }
                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            SetMessage("获取List失败!", "MODE_FAILURE");
                            console.log(textStatus);
                        });  
                function delayLoopList(path,time){
                    setTimeout(function(){
                        // console.log(new Date()+"list"+time);
                        self.get_list(path);
                    },time);
                    
                } 
                function delayLoopFile(path,time){
                    setTimeout(function(){
                        // console.log(new Date()+"file"+time);
                        self.get_filemetas(path);
                    },time);
                } 
            },
            //根据文件路径获取文件的信息
            get_filemetas:function(target){
                var self=this;
                var API = (require("common:widget/restApi/restApi.js"),require("common:widget/hash/hash.js"));
                var path=API.get("path");
                if(path == null || path =="/"){
                    path="";
                }
                var parameter = {'url': "http://pan.baidu.com/api/filemetas?target="+encodeURIComponent("["+JSON.stringify(target)+"]")+"&dlink=1&bdstoken="+yunData.MYBDSTOKEN+"&channel=chunlei&clienttype=0&web=1", 'dataType': 'json', type: 'GET'};
                HttpSendRead(parameter)
                        .done(function(json, textStatus, jqXHR) {
                            SetMessage("获取文件信息成功!", "MODE_SUCCESS");
                            var file=json.info;
                            var file_list = [];
                            for(var i=0;i<file.length;i++){
                                file_list.push({"name":self.get_level()+file[i].path.slice(path.length+1,file[i].path.length), "link": file[i].dlink});
                            }
                            console.log(file_list);
                            self[func](file_list);
                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            SetMessage("获取List失败!", "MODE_FAILURE");
                            console.log(textStatus);
                        });
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
                            SetMessage("下载成功!赶紧去看看吧~", "MODE_SUCCESS");

                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            SetMessage("下载失败!是不是没有开启aria2?", "MODE_FAILURE");
                        });
            }
        }
    })();
    baidupan.init();
};
var css = function() {/*
 #setting_div_table input{
 border: 1px solid #C6C6C6;
 box-shadow: 0 0 3px #C6C6C6;
 -webkit-box-shadow: 0 0 3px #C6C6C6;
 }
 .input-large{
 width:90%;
 }
 .input-small{
 width:150px;
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
 width:120px;
 height:30px;
 border:1px solid #D1D1D1;
 background-color: #F7F7F7;
 text-align: center;
 text-decoration: none;
 padding-top:7px;
 color:#1B83EB;
 }
 .new-dbtn .menu{
 position: absolute;
 width: 98%;
 left: 0;
 top: 32px;
 background: #fff;
 text-align: center;
 border: 1px solid #aaa;
 display: none;
 z-index:100;
 }
 .new-dbtn .menu a{
 height: 24px;
 line-height: 24px;
 display: block;
 color: #666;
 }
 .new-dbtn .menu a:hover{
 background: #e4eefe;
 cursor: pointer;
 text-decoration: none;
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
function onload(func) {
    if (document.readyState === "complete") {
        func();
    } else {
        window.addEventListener('load', func);
    }
}

onload(function() {
    //把函数注入到页面中
    //通过background.js获取到 name 为BDUSS的cookie
    var home = window.location.href.indexOf("/disk/home") != -1 ? true : false;
    var port = chrome.runtime.connect({name: "get_cookie"});
    port.onMessage.addListener(function(response) {
        if (response) {
                var script = document.createElement('script');
                script.id = "baidu_script";
                script.appendChild(document.createTextNode('(' + baidu + ')(\'' +JSON.stringify(response) + '\');'));
                (document.body || document.head || document.documentElement).appendChild(script);
                var style = document.createElement('style');
                style.setAttribute('type', 'text/css');
                style.textContent = css;
                document.head.appendChild(style);
        }
        
    });
    port.postMessage([{"site": "http://pan.baidu.com/", "name": "BDUSS"},{"site": "http://pcs.baidu.com/", "name": "pcsett"}]);
});
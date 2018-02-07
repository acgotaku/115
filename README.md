# 115Exporter [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ojafklbojgenkohhdgdjeaepnbjffdjf.svg)](https://chrome.google.com/webstore/detail/115exporter/ojafklbojgenkohhdgdjeaepnbjffdjf) [![Greenkeeper badge](https://badges.greenkeeper.io/acgotaku/115.svg)](https://greenkeeper.io/)


## 配合使用

使用 fake115可以在chrome上登录115.详细见： https://github.com/kkHAIKE/fake115

## Usage

- 非VIP用户速度不会很快，VIP用户可能很快，因为我不是会员没法测试。
- 插件的设置必须保存之后才会生效。
- 推荐设置：
    - Set `--rpc-secret=<secret>` if you are using aria2 1.18.4(or higher) with 'JSON-RPC PATH' like http://token:secret@hostname:port/jsonrpc
    - Set `--rpc-user=<username> --rpc-passwd=<passwd>` if you are using aria2 1.15.2(or higher) with 'JSON-RPC PATH' like http://username:passwd@hostname:port/jsonrpc
    - Use `http://localhost:6800/jsonrpc#max-connection-per-server=5&split=10` set download options for specific file.

## License

![GPLv3](https://www.gnu.org/graphics/gplv3-127x51.png)

115Exporter is licensed under [GNU General Public License](https://www.gnu.org/licenses/gpl.html) Version 3 or later.

115Exporter is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

115Exporter is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with 115Exporter.  If not, see <http://www.gnu.org/licenses/>.

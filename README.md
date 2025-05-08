# URL解析器

一个功能强大的URL解析工具，可以解析复杂URL并美观地展示其组成部分。

## 功能特点

- 对URL进行多层解码，支持多次编码的URL
- 以表格形式展示URL参数，清晰直观
- 递归解析嵌套URL参数
- 自动识别并格式化JSON数据
- 支持标准URL和自定义协议URL（如app schema）
- 美观的用户界面

## 使用方法

1. 直接在浏览器中打开`index.html`文件
2. 在文本框中输入需要解析的URL（默认已填入示例URL）
3. 点击"解析"按钮
4. 查看解析结果：
   - URL基本组件（协议、主机名、路径等）
   - 参数表格（名称和值）
   - 嵌套URL自动解析
   - JSON数据格式化展示

## 启动本地服务器

项目提供了两种启动本地HTTP服务器的方式，端口均为9000：

### 使用Shell脚本启动（Linux/Mac）

```bash
./start_server.sh
```

### 使用Python脚本启动（跨平台）

```bash
python start_server.py
```

启动后，可通过浏览器访问 http://localhost:9000 来使用URL解析器。

#!/bin/bash

# 设置端口
PORT=9000

echo "正在启动HTTP服务器，端口：$PORT..."
echo "您可以通过 http://localhost:$PORT 访问"
echo "按 Ctrl+C 停止服务器"
echo "--------------------------------"

# 启动Python HTTP服务器
python3 -m http.server $PORT 
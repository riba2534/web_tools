document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const parseBtn = document.getElementById('parseBtn');
    const clearBtn = document.getElementById('clearBtn');
    const formatBtn = document.getElementById('formatBtn');
    const copyBtn = document.getElementById('copyBtn');
    const resultContainer = document.getElementById('resultContainer');
    const jsonResult = document.getElementById('jsonResult');
    
    // 示例JSON（包含转义的嵌套JSON）
    const exampleJson = `{
  "id": "0001",
  "type": "donut",
  "name": "Cake",
  "ppu": 0.55,
  "normal_json": {
    "field1": "value1",
    "field2": 123
  },
  "escaped_json": "{\\\"item_param\\\":\\\"value\\\",\\\"item_id\\\":12345}",
  "double_escaped_json": "{\\\"item_pitaya_param\\\":\\\"{\\\\\\\"stay_time\\\\\\\":10,\\\\\\\"req_id\\\\\\\":\\\\\\\"20250508211712D750FB85C82A94C952F9\\\\\\\",\\\\\\\"rt\\\\\\\":2,\\\\\\\"g_pos\\\\\\\":3,\\\\\\\"mkt_type\\\\\\\":5}\\\"}"
}`;
    
    // 填充示例JSON
    jsonInput.value = exampleJson;
    
    // 解析按钮事件
    parseBtn.addEventListener('click', () => {
        parseAndDisplayJson();
    });
    
    // 清空按钮事件
    clearBtn.addEventListener('click', () => {
        jsonInput.value = '';
        resultContainer.classList.add('hidden');
    });
    
    // 格式化按钮事件
    formatBtn.addEventListener('click', () => {
        try {
            const json = JSON.parse(jsonInput.value);
            jsonInput.value = JSON.stringify(json, null, 2);
        } catch (error) {
            showError(`JSON格式错误: ${error.message}`);
        }
    });
    
    // 复制结果按钮事件
    copyBtn.addEventListener('click', () => {
        try {
            // 如果没有显示结果，先尝试解析
            if (resultContainer.classList.contains('hidden')) {
                parseAndDisplayJson();
                // 如果解析失败，会在函数内部处理错误
                if (resultContainer.classList.contains('hidden')) {
                    return;
                }
            }
            
            // 获取格式化的JSON数据
            const json = JSON.parse(jsonInput.value);
            const formattedJson = JSON.stringify(json, null, 2);
            
            // 复制到剪贴板
            navigator.clipboard.writeText(formattedJson).then(() => {
                showCopyIndicator();
            }).catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            });
        } catch (error) {
            showError(`JSON格式错误: ${error.message}`);
        }
    });
    
    // 主解析函数
    function parseAndDisplayJson() {
        const inputText = jsonInput.value.trim();
        if (!inputText) {
            showError('请输入JSON数据');
            return;
        }
        
        try {
            // 尝试解析JSON
            const jsonData = JSON.parse(inputText);
            
            // 显示结果容器
            resultContainer.classList.remove('hidden');
            
            // 创建表格视图
            const jsonTable = createJsonTable(jsonData);
            
            // 清空之前的结果并显示新结果
            jsonResult.innerHTML = '';
            jsonResult.appendChild(jsonTable);
            
            // 添加复制成功指示器
            const copyIndicator = document.createElement('div');
            copyIndicator.className = 'copy-indicator';
            copyIndicator.textContent = '复制成功';
            jsonResult.appendChild(copyIndicator);
            
        } catch (error) {
            showError(`JSON格式错误: ${error.message}`);
        }
    }
    
    // 创建JSON表格视图
    function createJsonTable(data, level = 0) {
        // 设置最大显示嵌套层级，超过此值将简化显示
        const MAX_LEVEL = 5;
        
        const table = document.createElement('table');
        table.className = 'json-table';
        
        if (level > 0) {
            table.classList.add('nested-table');
            // 为不同层级添加类，以便应用不同样式
            table.classList.add(`level-${level}`);
        }
        
        const tbody = document.createElement('tbody');
        
        // 如果超过最大层级且数据是对象或数组，显示简化版本
        if (level >= MAX_LEVEL && (Array.isArray(data) || (typeof data === 'object' && data !== null))) {
            const row = document.createElement('tr');
            
            const keyCell = document.createElement('td');
            keyCell.className = 'key-cell';
            keyCell.textContent = '层级过深';
            row.appendChild(keyCell);
            
            const valueCell = document.createElement('td');
            valueCell.className = 'value-cell';
            
            // 显示数据类型和大小摘要
            const summarySpan = document.createElement('span');
            if (Array.isArray(data)) {
                summarySpan.textContent = `数组 [${data.length} 项]`;
            } else {
                summarySpan.textContent = `对象 {${Object.keys(data).length} 个属性}`;
            }
            
            summarySpan.style.color = '#666';
            valueCell.appendChild(summarySpan);
            
            // 添加展开按钮
            const expandBtn = document.createElement('button');
            expandBtn.textContent = '展开';
            expandBtn.className = 'expand-btn';
            expandBtn.style.marginLeft = '10px';
            expandBtn.style.fontSize = '12px';
            expandBtn.style.padding = '2px 5px';
            expandBtn.onclick = function() {
                // 移除简化行
                row.parentNode.removeChild(row);
                
                // 创建完整内容
                createFullContent(tbody, data, level);
                
                // 防止事件冒泡
                return false;
            };
            
            valueCell.appendChild(expandBtn);
            row.appendChild(valueCell);
            tbody.appendChild(row);
        } else {
            // 正常创建完整内容
            createFullContent(tbody, data, level);
        }
        
        table.appendChild(tbody);
        return table;
    }
    
    // 创建完整内容（提取为独立函数便于复用）
    function createFullContent(tbody, data, level) {
        if (Array.isArray(data)) {
            // 处理数组
            data.forEach((item, index) => {
                const row = document.createElement('tr');
                
                // 创建键单元格(索引)
                const keyCell = document.createElement('td');
                keyCell.className = 'key-cell';
                keyCell.textContent = `[${index}]`;
                row.appendChild(keyCell);
                
                // 创建值单元格
                const valueCell = document.createElement('td');
                valueCell.className = 'value-cell';
                
                if (isJsonObject(item)) {
                    // 如果值是对象或数组，递归创建嵌套表格
                    const nestedTable = createJsonTable(item, level + 1);
                    valueCell.appendChild(nestedTable);
                } else {
                    // 否则直接显示值
                    appendFormattedValue(valueCell, item);
                }
                
                row.appendChild(valueCell);
                tbody.appendChild(row);
            });
        } else if (typeof data === 'object' && data !== null) {
            // 处理对象
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const row = document.createElement('tr');
                    
                    // 创建键单元格
                    const keyCell = document.createElement('td');
                    keyCell.className = 'key-cell';
                    keyCell.textContent = key;
                    row.appendChild(keyCell);
                    
                    // 创建值单元格
                    const valueCell = document.createElement('td');
                    valueCell.className = 'value-cell';
                    
                    const value = data[key];
                    if (isJsonObject(value)) {
                        // 如果值是对象或数组，递归创建嵌套表格
                        const nestedTable = createJsonTable(value, level + 1);
                        valueCell.appendChild(nestedTable);
                    } else {
                        // 否则直接显示值
                        appendFormattedValue(valueCell, value);
                    }
                    
                    row.appendChild(valueCell);
                    tbody.appendChild(row);
                }
            }
        } else {
            // 处理基本类型
            const row = document.createElement('tr');
            
            const keyCell = document.createElement('td');
            keyCell.className = 'key-cell';
            keyCell.textContent = '值';
            row.appendChild(keyCell);
            
            const valueCell = document.createElement('td');
            valueCell.className = 'value-cell';
            appendFormattedValue(valueCell, data);
            
            row.appendChild(valueCell);
            tbody.appendChild(row);
        }
    }
    
    // 检查值是否为JSON对象或数组
    function isJsonObject(value) {
        return typeof value === 'object' && value !== null;
    }
    
    // 在单元格中添加格式化的值
    function appendFormattedValue(cell, value) {
        // 如果值是字符串，尝试检测是否为转义后的JSON
        if (typeof value === 'string') {
            // 尝试解析可能是转义的JSON字符串
            const parsedJson = tryParseEscapedJson(value);
            if (parsedJson) {
                // 如果是有效的JSON，使用美化后的文本显示，而非表格
                const jsonContainer = document.createElement('pre');
                jsonContainer.className = 'formatted-json';
                jsonContainer.innerHTML = formatJsonText(parsedJson);
                cell.appendChild(jsonContainer);
                return;
            }
        }
        
        // 处理普通值（非转义JSON）
        const valueSpan = document.createElement('span');
        
        if (value === null) {
            valueSpan.className = 'json-null';
            valueSpan.textContent = 'null';
        } else {
            switch (typeof value) {
                case 'string':
                    valueSpan.className = 'json-string';
                    valueSpan.textContent = `"${escapeHTML(value)}"`;
                    break;
                case 'number':
                    valueSpan.className = 'json-number';
                    valueSpan.textContent = value;
                    break;
                case 'boolean':
                    valueSpan.className = 'json-boolean';
                    valueSpan.textContent = value;
                    break;
                default:
                    valueSpan.textContent = String(value);
            }
        }
        
        cell.appendChild(valueSpan);
    }
    
    // 格式化JSON文本，保留语法高亮
    function formatJsonText(obj, indent = 0) {
        const indentString = '  '.repeat(indent);
        let html = '';
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return '<span class="json-array">[]</span>';
            }
            
            html += '<span class="json-bracket">[</span>\n';
            obj.forEach((item, index) => {
                html += `${indentString}  ${formatJsonText(item, indent + 1)}`;
                if (index < obj.length - 1) {
                    html += '<span class="json-comma">,</span>';
                }
                html += '\n';
            });
            html += `${indentString}<span class="json-bracket">]</span>`;
        } else if (obj === null) {
            html += '<span class="json-null">null</span>';
        } else if (typeof obj === 'object') {
            const keys = Object.keys(obj);
            if (keys.length === 0) {
                return '<span class="json-object">{}</span>';
            }
            
            html += '<span class="json-bracket">{</span>\n';
            keys.forEach((key, index) => {
                html += `${indentString}  <span class="json-key">"${escapeHTML(key)}"</span><span class="json-colon">: </span>${formatJsonText(obj[key], indent + 1)}`;
                if (index < keys.length - 1) {
                    html += '<span class="json-comma">,</span>';
                }
                html += '\n';
            });
            html += `${indentString}<span class="json-bracket">}</span>`;
        } else if (typeof obj === 'string') {
            html += `<span class="json-string">"${escapeHTML(obj)}"</span>`;
        } else if (typeof obj === 'number') {
            html += `<span class="json-number">${obj}</span>`;
        } else if (typeof obj === 'boolean') {
            html += `<span class="json-boolean">${obj}</span>`;
        } else {
            html += escapeHTML(String(obj));
        }
        
        return html;
    }
    
    // 添加新函数：尝试解析可能转义的JSON字符串
    function tryParseEscapedJson(str) {
        // 如果字符串为空或太短，不可能是有效的JSON
        if (!str || str.length < 2) return null;
        
        // 尝试检测转义的JSON模式
        const jsonPatterns = [
            // 检查是否包含转义的引号和括号 (\", \{, \[)
            /\\["{}[\]]/,
            // 检查是否包含常见的JSON键格式 (\"key\":)
            /\\["][\w_]+\\["]\s*:/,
            // 检查是否以{或[开头（转义或非转义）
            /^\s*[{[]/
        ];
        
        // 如果不符合任何JSON模式，则不尝试解析
        let hasJsonPattern = false;
        for (const pattern of jsonPatterns) {
            if (pattern.test(str)) {
                hasJsonPattern = true;
                break;
            }
        }
        
        if (!hasJsonPattern) return null;
        
        // 尝试多层解析
        try {
            // 先尝试直接解析
            return JSON.parse(str);
        } catch (e1) {
            try {
                // 如果直接解析失败，尝试解析JSON.parse转义后的字符串
                return JSON.parse(JSON.parse(`"${str.replace(/"/g, '\\"')}"`));
            } catch (e2) {
                try {
                    // 尝试解析被双重转义的字符串
                    const unescaped = str
                        .replace(/\\\\/g, '\\')  // 先处理双斜杠
                        .replace(/\\"/g, '"');   // 再处理转义的引号
                    return JSON.parse(unescaped);
                } catch (e3) {
                    // 如果所有尝试都失败，返回null
                    return null;
                }
            }
        }
    }
    
    // 显示错误信息
    function showError(message) {
        resultContainer.classList.remove('hidden');
        jsonResult.innerHTML = `<div class="error-message">${message}</div>`;
    }
    
    // 显示复制成功指示器
    function showCopyIndicator() {
        const copyIndicator = document.querySelector('.copy-indicator');
        if (copyIndicator) {
            copyIndicator.classList.add('show-copy-indicator');
            setTimeout(() => {
                copyIndicator.classList.remove('show-copy-indicator');
            }, 2000);
        }
    }
    
    // 转义HTML字符
    function escapeHTML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // 自动解析初始JSON示例
    parseAndDisplayJson();
}); 
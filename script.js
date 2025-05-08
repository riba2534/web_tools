document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const parseBtn = document.getElementById('parseBtn');
    const resultContainer = document.getElementById('resultContainer');
    const parametersContainer = document.getElementById('parametersContainer');
    const paramsTree = document.getElementById('paramsTree');
    const decodedFullUrl = document.getElementById('decodedFullUrl');
    const decodedQueryParams = document.getElementById('decodedQueryParams');
    
    // 给示例URL填充到输入框
    const exampleUrl = 'myapp://store/feature?session_id=a7c82b3d9e5f&user_mode=test&config_data=%7B%22uiSettings%22%3A%7B%22theme%22%3A%22dark%22%2C%22fontSize%22%3A14%2C%22animations%22%3Atrue%7D%2C%22performance%22%3A%7B%22cacheSize%22%3A500%2C%22prefetch%22%3Atrue%7D%7D&redirect_url=customscheme%253A%252F%252Fview%253Fpage_id%253D8473629%2526display_mode%253Dfullscreen%2526content_params%253D%25257B%25252522contentId%25252522%25253A%25252522abc123%25252522%25252C%25252522version%25252522%25253A2%25252C%25252522settings%25252522%25253A%25257B%25252522autoplay%25252522%25253Atrue%25252C%25252522quality%25252522%25253A%25252522hd%25252522%25257D%25257D%2526source%253Dmain_feed%2526tracking_code%253Dxyz789&timestamp=1685472931&device_info=%7B%22device%22%3A%22test-device%22%2C%22os%22%3A%22test-os%22%2C%22screen%22%3A%7B%22width%22%3A1080%2C%22height%22%3A1920%7D%7D&signature=9a8b7c6d5e4f3g2h1i';
    urlInput.value = exampleUrl;

    parseBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) {
            alert('请输入URL');
            return;
        }
        
        parseUrl(url);
    });

    function parseUrl(url, container = null, level = 0) {
        try {
            // 显示结果容器
            if (!container) {
                resultContainer.classList.remove('hidden');
                parametersContainer.classList.remove('hidden');
                
                // 清空之前的结果
                paramsTree.innerHTML = '';
                container = paramsTree;
                
                // 解析URL主要部分
                displayUrlComponents(url);
            }
            
            // 解码URL并解析所有部分
            const parsedUrl = parseUrlComponents(url);
            
            // 如果是顶层URL（不是嵌套的URL），显示解码后的完整URL和query参数
            if (!container || container === paramsTree) {
                // 显示解码后的完整URL
                decodedFullUrl.textContent = parsedUrl.decodedUrl;
                
                // 提取并显示解码后的完整query参数
                let queryString = '';
                try {
                    // 尝试从URL中提取query部分
                    const urlObj = new URL(parsedUrl.decodedUrl);
                    queryString = urlObj.search.substring(1); // 去掉问号
                } catch (e) {
                    // 如果是自定义协议，使用自定义解析
                    const customUrlParts = parseCustomUrl(parsedUrl.decodedUrl);
                    if (customUrlParts.search) {
                        queryString = customUrlParts.search.substring(1); // 去掉问号
                    }
                }
                
                decodedQueryParams.textContent = queryString || '(无query参数)';
            }
            
            // 提取URL的查询部分
            let queryString = '';
            try {
                const urlObj = new URL(parsedUrl.decodedUrl);
                queryString = urlObj.search.substring(1);
            } catch (e) {
                const urlParts = parsedUrl.decodedUrl.split('?');
                if (urlParts.length > 1) {
                    queryString = urlParts[1];
                }
            }
            
            // 只有当查询字符串非空时才创建参数表格
            if (queryString) {
                const paramsTable = document.createElement('table');
                paramsTable.innerHTML = `
                    <thead>
                        <tr>
                            <th>参数名</th>
                            <th>值</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                
                const tbody = paramsTable.querySelector('tbody');
                
                // 手动处理参数，正确处理marquee_jump_url
                const fixedParams = parseSpecialUrlParams(queryString);
                
                // 对参数按字母顺序排序
                const sortedParams = Array.from(fixedParams.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]));
                
                for (const [name, value] of sortedParams) {
                    const row = document.createElement('tr');
                    row.className = 'param-row';
                    
                    const nameCell = document.createElement('td');
                    nameCell.className = 'param-name';
                    nameCell.textContent = name;
                    
                    const valueCell = document.createElement('td');
                    valueCell.className = 'param-value';
                    
                    // 递归解码参数值
                    const fullyDecodedValue = recursivelyDecodeValue(value);
                    
                    // 尝试检测是否为嵌套URL
                    if (isUrl(fullyDecodedValue)) {
                        // 如果是URL，显示解码后的URL并递归解析
                        const valueDiv = document.createElement('div');
                        valueDiv.textContent = fullyDecodedValue;
                        valueCell.appendChild(valueDiv);
                        addCopyButton(valueDiv);
                        
                        const nestedContainer = document.createElement('div');
                        nestedContainer.className = 'nested-url';
                        valueCell.appendChild(nestedContainer);
                        
                        // 递归解析嵌套URL
                        parseUrl(fullyDecodedValue, nestedContainer, level + 1);
                    } 
                    // 尝试检测并解析JSON
                    else {
                        const jsonResult = isJson(fullyDecodedValue);
                        if (jsonResult && jsonResult.isJson) {
                            try {
                                const jsonStr = jsonResult.decodedJson;
                                const jsonObj = JSON.parse(jsonStr);
                                
                                // 添加原始JSON值（但隐藏）用于复制
                                const originalValueDiv = document.createElement('div');
                                originalValueDiv.textContent = value;
                                originalValueDiv.style.display = 'none';
                                valueCell.appendChild(originalValueDiv);
                                
                                // 显示完全解码后的原始值
                                const decodedValueDiv = document.createElement('div');
                                decodedValueDiv.textContent = fullyDecodedValue;
                                decodedValueDiv.style.display = 'none';
                                valueCell.appendChild(decodedValueDiv);
                                
                                // 直接显示格式化后的JSON，使用pre标签美化显示
                                const jsonContainer = document.createElement('pre');
                                jsonContainer.className = 'formatted-json';
                                jsonContainer.innerHTML = formatJsonText(jsonObj);
                                valueCell.appendChild(jsonContainer);
                                
                                // 为JSON添加复制按钮，点击时复制解码后的JSON
                                addCopyButton(jsonContainer, jsonStr);
                            } catch (e) {
                                // JSON解析失败，作为普通文本处理
                                valueCell.textContent = fullyDecodedValue;
                                addCopyButton(valueCell);
                            }
                        } else {
                            // 普通值，显示完全解码后的值
                            valueCell.textContent = fullyDecodedValue;
                            addCopyButton(valueCell);
                        }
                    }
                    
                    row.appendChild(nameCell);
                    row.appendChild(valueCell);
                    tbody.appendChild(row);
                }
                
                container.appendChild(paramsTable);
            }
            
        } catch (error) {
            console.error('URL解析错误:', error);
            if (!container) {
                const errorMsg = document.createElement('div');
                errorMsg.textContent = `解析错误: ${error.message}`;
                errorMsg.style.color = 'red';
                paramsTree.innerHTML = '';
                paramsTree.appendChild(errorMsg);
                
                resultContainer.classList.remove('hidden');
                parametersContainer.classList.remove('hidden');
            }
        }
    }
    
    // 递归解码URL值，直到不能再解码为止
    function recursivelyDecodeValue(value) {
        let prevValue = '';
        let currentValue = value;
        
        while (prevValue !== currentValue) {
            prevValue = currentValue;
            try {
                if (currentValue.includes('%')) {
                    currentValue = decodeURIComponent(prevValue);
                } else {
                    break;
                }
            } catch (e) {
                // 如果解码失败，保留之前的值
                break;
            }
        }
        
        return currentValue;
    }
    
    // 解析特殊URL参数，正确处理marquee_jump_url
    function parseSpecialUrlParams(queryString) {
        const fixedParams = new Map();
        let isProcessingMarqueeJumpUrl = false;
        let marqueeJumpUrlValue = '';
        
        // 获取所有参数并按顺序遍历
        const rawParams = [];
        
        // 手动拆分参数，不使用URLSearchParams以避免自动解析错误
        const paramPairs = queryString.split('&');
        for (const pair of paramPairs) {
            if (!pair) continue;
            
            const equalPos = pair.indexOf('=');
            if (equalPos > 0) {
                const key = pair.substring(0, equalPos);
                const value = pair.substring(equalPos + 1);
                rawParams.push([key, value]);
            } else {
                rawParams.push([pair, '']);
            }
        }
        
        // 识别marquee_jump_url及其嵌套参数
        for (let i = 0; i < rawParams.length; i++) {
            const [key, value] = rawParams[i];
            
            if (key === 'marquee_jump_url') {
                isProcessingMarqueeJumpUrl = true;
                marqueeJumpUrlValue = value;
            } else if (isProcessingMarqueeJumpUrl && (key === 'jump_page_btm_key' || key === 'is_delivery_platform')) {
                // 遇到已知的外层参数，结束marquee_jump_url处理
                isProcessingMarqueeJumpUrl = false;
                fixedParams.set('marquee_jump_url', marqueeJumpUrlValue);
                fixedParams.set(key, value);
            } else if (isProcessingMarqueeJumpUrl) {
                // 当前参数是marquee_jump_url的一部分
                marqueeJumpUrlValue += '&' + key + '=' + value;
            } else {
                // 普通参数
                fixedParams.set(key, value);
            }
        }
        
        // 如果marquee_jump_url处理到最后还未结束
        if (isProcessingMarqueeJumpUrl) {
            fixedParams.set('marquee_jump_url', marqueeJumpUrlValue);
        }
        
        return fixedParams;
    }
    
    // 添加复制按钮到元素
    function addCopyButton(element, customText = null) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '复制';
        copyBtn.title = '点击复制内容';
        
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const textToCopy = customText || element.textContent;
            
            // 使用Clipboard API复制文本
            navigator.clipboard.writeText(textToCopy).then(() => {
                // 显示复制成功提示
                const successMsg = document.createElement('span');
                successMsg.className = 'copy-success';
                successMsg.textContent = '已复制';
                copyBtn.appendChild(successMsg);
                
                // 一段时间后移除提示
                setTimeout(() => {
                    successMsg.remove();
                }, 1500);
            }).catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            });
        });
        
        element.appendChild(copyBtn);
    }
    
    function displayUrlComponents(urlString) {
        try {
            // 尝试使用URL标准方法解析
            let url;
            try {
                // 对于标准URL，使用URL构造函数
                url = new URL(urlString);
            } catch (e) {
                // 对于非标准URL（如自定义协议），使用自定义解析
                const customUrl = parseCustomUrl(urlString);
                document.getElementById('protocol').textContent = customUrl.protocol || '未知';
                document.getElementById('hostname').textContent = customUrl.hostname || '未知';
                document.getElementById('pathname').textContent = customUrl.pathname || '未知';
                document.getElementById('hash').textContent = customUrl.hash || '无';
                return;
            }
            
            // 显示标准URL的各个部分
            document.getElementById('protocol').textContent = url.protocol.replace(':', '') || '未知';
            document.getElementById('hostname').textContent = url.hostname || '未知';
            document.getElementById('pathname').textContent = url.pathname || '/';
            document.getElementById('hash').textContent = url.hash || '无';
        } catch (error) {
            console.error('显示URL组件时出错:', error);
            document.getElementById('protocol').textContent = '解析错误';
            document.getElementById('hostname').textContent = '解析错误';
            document.getElementById('pathname').textContent = '解析错误';
            document.getElementById('hash').textContent = '解析错误';
        }
    }
    
    function parseUrlComponents(urlString) {
        // 创建一个结果对象
        const result = {
            originalUrl: urlString,
            decodedUrl: urlString,
            searchParams: new URLSearchParams()
        };
        
        // 尝试递归解码URL，直到不能再解码为止
        let prevUrl = '';
        let currentUrl = urlString;
        while (prevUrl !== currentUrl) {
            prevUrl = currentUrl;
            try {
                currentUrl = decodeURIComponent(prevUrl);
            } catch (e) {
                // 如果解码失败，保留之前的值
                break;
            }
        }
        
        result.decodedUrl = currentUrl;
        
        // 解析查询字符串参数
        try {
            // 标准URL格式尝试
            const url = new URL(currentUrl);
            result.searchParams = url.searchParams;
        } catch (e) {
            // 非标准URL格式，如自定义协议
            const customUrlParts = parseCustomUrl(currentUrl);
            if (customUrlParts.search) {
                result.searchParams = new URLSearchParams(customUrlParts.search.substring(1));
            }
        }
        
        return result;
    }
    
    function parseCustomUrl(urlString) {
        const result = {
            protocol: '',
            hostname: '',
            pathname: '',
            search: '',
            hash: ''
        };
        
        // 匹配协议
        const protocolMatch = urlString.match(/^([^:]+):\/\//);
        if (protocolMatch) {
            result.protocol = protocolMatch[1];
            urlString = urlString.substring(protocolMatch[0].length);
        }
        
        // 分离哈希部分
        const hashIndex = urlString.indexOf('#');
        if (hashIndex !== -1) {
            result.hash = urlString.substring(hashIndex);
            urlString = urlString.substring(0, hashIndex);
        }
        
        // 分离查询字符串
        const queryIndex = urlString.indexOf('?');
        if (queryIndex !== -1) {
            result.search = urlString.substring(queryIndex);
            urlString = urlString.substring(0, queryIndex);
        }
        
        // 分离主机名和路径
        const pathIndex = urlString.indexOf('/');
        if (pathIndex !== -1) {
            result.hostname = urlString.substring(0, pathIndex);
            result.pathname = urlString.substring(pathIndex);
        } else {
            result.hostname = urlString;
            result.pathname = '/';
        }
        
        return result;
    }
    
    function isUrl(str) {
        // 检查字符串是否可能是URL
        const urlPattern = /^(https?|ftp|file|s?ftps?|snssdk|sslocal):\/\/|^(www\.)/i;
        return urlPattern.test(str) || str.includes('://') || str.includes('%3A%2F%2F') || str.includes('%253A%252F%252F');
    }
    
    function isJson(str) {
        // 检查字符串是否是有效的JSON
        if (typeof str !== 'string') return false;
        
        // 尝试解码URL编码的字符串，有些JSON可能是URL编码过的
        let decodedStr = recursivelyDecodeValue(str);
        
        // 检测是否为转义的JSON
        const parsedJson = tryParseEscapedJson(decodedStr);
        if (parsedJson) {
            return {isJson: true, decodedJson: JSON.stringify(parsedJson), originalJson: decodedStr !== str ? str : null};
        }
        
        // 简单检查：JSON应该以{开始和}结束，或者以[开始和]结束
        str = decodedStr.trim();
        if ((str.startsWith('{') && str.endsWith('}')) || 
            (str.startsWith('[') && str.endsWith(']'))) {
            try {
                JSON.parse(str);
                return {isJson: true, decodedJson: str, originalJson: decodedStr !== str ? str : null};
            } catch (e) {
                return false;
            }
        }
        return false;
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
    
    function escapeHTML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}); 
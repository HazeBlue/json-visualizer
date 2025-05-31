/**
 * JSON Parser Module
 * 处理JSON数据的解析和验证
 */
class JSONParser {
    /**
     * 解析并验证代码数据
     * @param {string} codeString - 要解析的代码字符串
     * @param {string} language - 代码语言 ('json', 'javascript', 'python')
     * @returns {Object} - 包含成功状态、数据和错误信息（如果有）的结果对象
     */
    static parse(codeString, language = 'json') {
        if (!codeString.trim()) {
            return {
                success: false,
                error: '输入为空，请输入有效的代码数据。'
            };
        }

        try {
            let data;
            if (language === 'json') {
                data = JSON.parse(codeString);
            } else if (language === 'javascript') {
                // 注意：使用 Function 构造函数比直接 eval 稍安全，但仍需谨慎处理不可信输入
                // 一个更安全的方法是使用 AST 解析器，如 Esprima 或 Acorn
                // 这里为了简单起见，我们假设输入是有效的JS对象字面量
                data = (new Function(`return ${codeString}`))();
            } else if (language === 'python') {
                // Python 解析较为复杂，这里我们先做一个简单的占位符
                // 实际应用中可能需要服务器端辅助或专门的Python->JSON转换库
                // 或者要求用户输入特定格式的 Python 字典，然后用正则表达式转换
                // 暂时返回错误，提示功能未完全实现
                // 尝试将Python的True/False/None替换为JS的true/false/null
                const jsFriendlyPythonString = codeString
                    .replace(/\bTrue\b/g, 'true')
                    .replace(/\bFalse\b/g, 'false')
                    .replace(/\bNone\b/g, 'null')
                    .replace(/'/g, '"'); // Python常用单引号，JSON要求双引号
                try {
                    data = JSON.parse(jsFriendlyPythonString);
                } catch (pyError) {
                     return {
                        success: false,
                        error: 'Python 代码解析失败。请确保输入的是标准的 Python 字典字面量，并使用双引号表示字符串。复杂结构可能无法正确解析。错误: ' + pyError.message
                    };
                }
            } else {
                return {
                    success: false,
                    error: `不支持的语言类型: ${language}`
                };
            }
            return {
                success: true,
                data: data
            };
        } catch (error) {
            return {
                success: false,
                error: this.formatError(error, codeString, language)
            };
        }
    }

    /**
     * 格式化代码字符串
     * @param {string} codeString - 要格式化的代码字符串
     * @param {string} language - 代码语言 ('json', 'javascript', 'python')
     * @returns {Object} 包含格式化结果的对象
     */
    static format(codeString, language = 'json') {
        if (!codeString.trim()) {
            return {
                success: false,
                error: '输入为空，请输入有效的代码数据。'
            };
        }

        try {
            // 先尝试解析代码
            const parseResult = this.parse(codeString, language);
            
            if (!parseResult.success) {
                return parseResult; // 如果解析失败，直接返回错误
            }
            
            let formatted;
            
            if (language === 'json') {
                // JSON 格式化
                formatted = JSON.stringify(parseResult.data, null, 4);
            } else if (language === 'javascript') {
                // JavaScript 对象格式化
                // 这里使用 JSON.stringify 作为基础，然后做一些转换使其看起来像 JS 对象
                formatted = JSON.stringify(parseResult.data, null, 4)
                    .replace(/"([^"]+)":/g, '$1:') // 移除属性名的引号
                    .replace(/"([^"]+)"/g, '"$1"'); // 保留字符串值的引号
            } else if (language === 'python') {
                // Python 字典格式化
                // 使用我们的 convertToPython 方法
                formatted = this.convertToPython(parseResult.data, 0);
            } else {
                return {
                    success: false,
                    error: `不支持的语言类型: ${language}`
                };
            }
            
            return {
                success: true,
                formattedString: formatted
            };
        } catch (error) {
            return {
                success: false,
                error: this.formatError(error, codeString, language)
            };
        }
    }

    /**
     * 创建更友好的错误消息
     * @param {Error} error - 解析错误对象
     * @param {string} codeString - 原始代码字符串
     * @param {string} language - 代码语言
     * @returns {string} - 格式化的错误消息
     */
    static formatError(error, codeString, language = 'json') {
        const errorMessage = error.message;
        
        // 从错误消息中提取位置
        const positionMatch = errorMessage.match(/position (\d+)/);
        
        if (positionMatch && positionMatch[1]) {
            const position = parseInt(positionMatch[1]);
            const errorLocation = this.getErrorLocation(codeString, position);
            return `${language.toUpperCase()} 解析错误: ${errorMessage}<br>错误位置: 行 ${errorLocation.line}, 列 ${errorLocation.column}`;
        }
        
        return `${language.toUpperCase()} 解析错误: ${errorMessage}`;
    }

    /**
     * 根据字符位置计算行号和列号
     * @param {string} text - 原始文本
     * @param {number} position - 字符位置
     * @returns {Object} - 包含行号和列号的对象
     */
    static getErrorLocation(text, position) {
        const lines = text.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        return { line, column };
    }

    /**
     * 以不同的代码格式导出JSON数据
     * @param {Object} data - 已解析的JSON数据
     * @param {string} format - 目标格式（'json', 'js', 'python'）
     * @returns {string} - 格式化的代码
     */
    static exportAs(data, format) {
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 4);
                
            case 'js':
                return `const data = ${JSON.stringify(data, null, 4)};`;
                
            case 'python':
                // 将JSON转换为Python字典表示法
                return this.convertToPython(data);
                
            default:
                return JSON.stringify(data, null, 4);
        }
    }

    /**
     * 将JSON转换为Python字典表示法
     * @param {*} data - 要转换的数据
     * @param {number} indent - 当前缩进级别
     * @returns {string} - Python代码表示
     */
    static convertToPython(data, indent = 0) {
        const spaces = ' '.repeat(indent * 4);
        const nextSpaces = ' '.repeat((indent + 1) * 4);
        
        if (data === null) {
            return 'None';
        } else if (typeof data === 'boolean') {
            return data ? 'True' : 'False';
        } else if (typeof data === 'number') {
            return data.toString();
        } else if (typeof data === 'string') {
            // 转义单引号并为字符串使用单引号
            return `'${data.replace(/'/g, "\\'")}'`;
        } else if (Array.isArray(data)) {
            if (data.length === 0) {
                return '[]';
            }
            
            let result = '[\n';
            
            for (let i = 0; i < data.length; i++) {
                result += `${nextSpaces}${this.convertToPython(data[i], indent + 1)}`;
                if (i < data.length - 1) {
                    result += ',';
                }
                result += '\n';
            }
            
            result += `${spaces}]`;
            return result;
        } else if (typeof data === 'object') {
            if (Object.keys(data).length === 0) {
                return '{}';
            }
            
            let result = '{\n';
            const keys = Object.keys(data);
            
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                result += `${nextSpaces}'${key}': ${this.convertToPython(data[key], indent + 1)}`;
                if (i < keys.length - 1) {
                    result += ',';
                }
                result += '\n';
            }
            
            result += `${spaces}}`;
            return result;
        }
        
        return 'None';  // 默认情况
    }

    /**
     * 获取用于演示的样本代码对象
     * @param {string} language - 代码语言 ('json', 'javascript', 'python')
     * @returns {string} - 样本代码字符串
     */
    static getSampleCode(language = 'json') {
        if (language === 'javascript') {
            return `{
    name: "JavaScript 可视化示例",
    version: "1.0.0",
    description: "一个用 JavaScript 对象表示的数据结构",
    authors: [
        { name: "Alice", role: "Developer" },
        { name: "Bob", role: "Designer" }
    ],
    config: {
        debugMode: true,
        port: 3000,
        featuresEnabled: ["auth", "logging", "cache"]
    },
    status: null,
    isActive: true
}`;
        } else if (language === 'python') {
            return `{
    'name': 'Python 可视化示例',
    'version': '1.0.0',
    'description': '一个用 Python 字典表示的数据结构',
    'contributors': [
        {'name': 'Charlie', 'role': 'Tester'},
        {'name': 'Dana', 'role': 'Manager'}
    ],
    'settings': {
        'theme': 'dark',
        'auto_save': False,
        'retry_attempts': 3
    },
    'data_source': None,
    'is_valid': True
}`;
        }
        // Default to JSON sample
        return `{
    "name": "JSON 可视化调试工具",
    "version": "1.0.0",
    "description": "一个强大的 JSON 数据可视化和调试工具",
    "features": [
        "交互式树状图",
        "拖拽编辑",
        "格式校验",
        "代码导出"
    ],
    "settings": {
        "theme": "light",
        "autoFormat": true,
        "expandDepth": 2
    },
    "performance": {
        "maxFileSize": 5242880,
        "renderTime": 0.25,
        "supported": true
    },
    "examples": [
        {
            "id": 1,
            "title": "简单对象",
            "complexity": "低"
        },
        {
            "id": 2,
            "title": "嵌套数组",
            "complexity": "中"
        },
        {
            "id": 3,
            "title": "复杂结构",
            "complexity": "高"
        }
    ],
    "contact": null
}`;
    }
}
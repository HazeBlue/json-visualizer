/**
 * Main Application
 * 整合各组件并初始化应用程序
 */
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const codeInput = document.getElementById('code-input'); // Updated from json-input
    const languageSelect = document.getElementById('language-select'); // New language selector
    const errorContainer = document.getElementById('error-container');
    const treeContainer = document.getElementById('tree-container');
    const parseBtn = document.getElementById('parse-btn');
    const formatBtn = document.getElementById('format-btn');
    const clearBtn = document.getElementById('clear-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    const expandAllBtn = document.getElementById('expand-all-btn');
    const exportBtn = document.getElementById('export-btn');
    const exportFormat = document.getElementById('export-format');
    
    // 初始化组件
    const editor = new Editor(codeInput, errorContainer, languageSelect.value); // 传入当前选择的语言
    const treeView = new TreeView(treeContainer);
    
    // 监听语言选择变化
    languageSelect.addEventListener('change', () => {
        const selectedLanguage = languageSelect.value;
        editor.setLanguage(selectedLanguage);
        
        // 同步更新导出格式选择框
        if (selectedLanguage === 'json') {
            exportFormat.value = 'json';
        } else if (selectedLanguage === 'javascript') {
            exportFormat.value = 'js';
        } else if (selectedLanguage === 'python') {
            exportFormat.value = 'python';
        }
        
        // 加载对应语言的示例代码，保持左右同步
        loadSample();
    });
    
    let currentData = null;
    
    // 解析代码并显示树状图
    function parseAndVisualizeJSON() {
        const codeStr = editor.getInput();
        const language = languageSelect.value;
        const result = JSONParser.parse(codeStr, language); // Pass language to parser
        
        if (result.success) {
            currentData = result.data;
            treeView.render(currentData, 2); // 默认展开2级
            editor.hideError();
        } else {
            editor.showError(result.error);
        }
    }
    
    // 格式化代码
    function formatCode() {
        editor.formatCode(languageSelect.value);
    }
    
    // 清空编辑器
    function clearEditor() {
        editor.clear();
        treeContainer.innerHTML = '';
        currentData = null;
    }
    
    // 加载示例代码
    function loadSample() {
        const language = languageSelect.value;
        editor.loadSample(language); // Pass language to editor's loadSample
        parseAndVisualizeJSON();
    }
    
    // 折叠所有节点
    function collapseAll() {
        if (currentData) {
            treeView.collapseAll();
        }
    }
    
    // 展开所有节点
    function expandAll() {
        if (currentData) {
            treeView.expandAll();
        }
    }
    
    // 导出为代码文件并下载
    function exportAsCode() {
        if (!currentData) {
            editor.showError('没有可导出的数据，请先解析代码。');
            return;
        }
        
        const format = exportFormat.value;
        const code = JSONParser.exportAs(currentData, format);
        
        // 根据格式确定文件名和扩展名
        let filename;
        switch (format) {
            case 'json':
                filename = 'data.json';
                break;
            case 'js':
                filename = 'data.js';
                break;
            case 'python':
                filename = 'data.py';
                break;
            default:
                filename = 'data.txt';
        }
        
        // 创建Blob对象
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = filename;
        
        // 添加到文档并触发点击
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // 清理
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
        
        // 显示成功提示
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-check"></i> 已导出';
        
        setTimeout(() => {
            exportBtn.innerHTML = originalText;
        }, 2000);
    }
    
    // 导出功能已改为直接下载文件，不再需要复制代码和关闭模态窗口的函数
    
    // 监听导出格式选择变化
    exportFormat.addEventListener('change', () => {
        const selectedFormat = exportFormat.value;
        
        // 同步更新语言选择框
        if (selectedFormat === 'json') {
            languageSelect.value = 'json';
        } else if (selectedFormat === 'js') {
            languageSelect.value = 'javascript';
        } else if (selectedFormat === 'python') {
            languageSelect.value = 'python';
        }
        
        // 更新编辑器语言
        editor.setLanguage(languageSelect.value);
        
        // 加载对应语言的示例代码
        loadSample();
    });
    
    // 绑定事件处理
    parseBtn.addEventListener('click', parseAndVisualizeJSON);
    formatBtn.addEventListener('click', formatCode);
    clearBtn.addEventListener('click', clearEditor);
    sampleBtn.addEventListener('click', loadSample);
    collapseAllBtn.addEventListener('click', collapseAll);
    expandAllBtn.addEventListener('click', expandAll);
    exportBtn.addEventListener('click', exportAsCode);
    
    // 快捷键支持
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter 解析
        if (e.ctrlKey && e.key === 'Enter') {
            parseAndVisualizeJSON();
        }
        
        // Ctrl + Shift + F 格式化
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault(); // 防止打开浏览器的查找
            formatCode();
        }
    });
    
    // 初始化时显示空引导消息
    treeContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #7f8c8d;">
            <i class="fas fa-code" style="font-size: 48px; margin-bottom: 20px;"></i>
            <p>在左侧输入 JSON、JavaScript 或 Python 数据，然后点击"解析"按钮</p>
            <p>或者点击"示例"按钮加载示例数据</p>
        </div>
    `;
});

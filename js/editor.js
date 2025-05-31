/**
 * Editor Module
 * 处理JSON编辑器的功能
 */
class Editor {
    /**
     * 初始化编辑器
     * @param {HTMLTextAreaElement} inputElement - 代码输入文本区域
     * @param {HTMLElement} errorContainer - 错误消息容器
     * @param {string} language - 初始语言类型 ('json', 'javascript', 'python')
     */
    constructor(inputElement, errorContainer, language = 'json') {
        this.inputElement = inputElement;
        this.errorContainer = errorContainer;
        this.language = language; // 添加语言属性
        this.initTabSupport();
    }

    /**
     * 获取当前输入的JSON文本
     * @returns {string} - JSON文本
     */
    getInput() {
        return this.inputElement.value;
    }

    /**
     * 设置输入文本
     * @param {string} text - 要设置的文本
     */
    setInput(text) {
        this.inputElement.value = text;
    }

    /**
     * 清空编辑器
     */
    clear() {
        this.inputElement.value = '';
        this.hideError();
    }

    /**
     * 显示错误消息
     * @param {string} message - 错误消息
     */
    showError(message) {
        this.errorContainer.innerHTML = message;
        this.errorContainer.style.display = 'block';
    }

    /**
     * 隐藏错误消息
     */
    hideError() {
        this.errorContainer.innerHTML = '';
        this.errorContainer.style.display = 'none';
    }

    /**
     * 格式化代码文本
     * @param {string} language - 代码语言 ('json', 'javascript', 'python')
     */
    formatCode(language = null) {
        // 如果没有提供语言参数，使用当前存储的语言
        const currentLanguage = language || this.language;
        const result = JSONParser.format(this.getInput(), currentLanguage);
        
        if (result.success) {
            this.setInput(result.formattedString);
            this.hideError();
        } else {
            this.showError(result.error);
        }
    }
    
    /**
     * 设置当前语言
     * @param {string} language - 代码语言 ('json', 'javascript', 'python')
     */
    setLanguage(language) {
        this.language = language;
    }

    /**
     * 加载示例代码
     * @param {string} language - The language of the sample code to load ('json', 'javascript', 'python')
     */
    loadSample(language = 'json') {
        this.setInput(JSONParser.getSampleCode(language));
        this.hideError();
    }

    /**
     * 初始化Tab键支持，允许使用Tab键插入制表符
     */
    initTabSupport() {
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                
                // 获取光标位置
                const start = this.inputElement.selectionStart;
                const end = this.inputElement.selectionEnd;
                
                // 插入Tab
                const value = this.inputElement.value;
                this.inputElement.value = value.substring(0, start) + '    ' + value.substring(end);
                
                // 重新设置光标位置
                this.inputElement.selectionStart = this.inputElement.selectionEnd = start + 4;
            }
        });
    }
}
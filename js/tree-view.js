/**
 * TreeView Module
 * 处理JSON数据的树状图可视化
 */
class TreeView {
    /**
     * 初始化树视图
     * @param {HTMLElement} container - 树视图的容器元素
     */
    constructor(container) {
        this.container = container;
        this.data = null;
        this.expandedNodes = new Set();
        this.dragSrcEl = null;
        this.initDragAndDrop();
    }

    /**
     * 渲染JSON数据的树状图
     * @param {Object} data - 要渲染的JSON数据
     * @param {number} expandLevel - 默认展开级别
     */
    render(data, expandLevel = 1) {
        this.data = data;
        this.container.innerHTML = '';
        this.expandedNodes.clear();
        
        const rootNode = this.createTreeNode(data, '', 0, expandLevel);
        this.container.appendChild(rootNode);
    }

    /**
     * 创建树节点
     * @param {*} data - 节点数据
     * @param {string} key - 节点键名
     * @param {number} level - 当前层级
     * @param {number} expandLevel - 默认展开级别
     * @returns {HTMLElement} - 创建的节点元素
     */
    createTreeNode(data, key, level, expandLevel) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.setAttribute('data-level', level);
        nodeElement.setAttribute('draggable', 'true');
        
        const nodeItem = document.createElement('div');
        nodeItem.className = 'tree-item';
        
        // 处理不同的数据类型
        if (data === null) {
            nodeItem.innerHTML = this.createNodeHTML(key, 'null', 'node-null');
        } else if (typeof data === 'boolean') {
            nodeItem.innerHTML = this.createNodeHTML(key, data.toString(), 'node-boolean');
        } else if (typeof data === 'number') {
            nodeItem.innerHTML = this.createNodeHTML(key, data.toString(), 'node-number');
        } else if (typeof data === 'string') {
            nodeItem.innerHTML = this.createNodeHTML(key, `"${this.escapeHTML(data)}"`, 'node-string');
        } else if (Array.isArray(data) || typeof data === 'object') {
            const isExpanded = level < expandLevel;
            if (isExpanded) {
                this.expandedNodes.add(nodeElement.id = `node-${this.generateId()}`);
            }
            
            const toggleIcon = isExpanded ? '&#9660;' : '&#9654;';
            const typeLabel = Array.isArray(data) ? 'Array' : 'Object';
            const itemCount = Array.isArray(data) ? data.length : Object.keys(data).length;
            
            nodeItem.innerHTML = `
                <span class="toggle-btn" onclick="event.stopPropagation(); window.toggleNode(this.parentNode.parentNode)">${toggleIcon}</span>
                ${key ? `<span class="node-key">${this.escapeHTML(key)}:</span>` : ''}
                <span class="node-value">${typeLabel}[${itemCount}]</span>
            `;
            
            // 创建子节点容器
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            childrenContainer.style.display = isExpanded ? 'block' : 'none';
            
            // 添加子节点
            if (Array.isArray(data)) {
                for (let i = 0; i < data.length; i++) {
                    const childNode = this.createTreeNode(data[i], i.toString(), level + 1, expandLevel);
                    childrenContainer.appendChild(childNode);
                }
            } else {
                const keys = Object.keys(data);
                for (const childKey of keys) {
                    const childNode = this.createTreeNode(data[childKey], childKey, level + 1, expandLevel);
                    childrenContainer.appendChild(childNode);
                }
            }
            
            nodeElement.appendChild(nodeItem);
            nodeElement.appendChild(childrenContainer);
            return nodeElement;
        }
        
        nodeElement.appendChild(nodeItem);
        return nodeElement;
    }

    /**
     * 创建节点的HTML内容
     * @param {string} key - 节点键名
     * @param {string} value - 节点值
     * @param {string} valueClass - 值的CSS类名
     * @returns {string} - HTML字符串
     */
    createNodeHTML(key, value, valueClass) {
        return `
            ${key ? `<span class="node-key">${this.escapeHTML(key)}:</span>` : ''}
            <span class="${valueClass}">${value}</span>
        `;
    }

    /**
     * 转义HTML特殊字符
     * @param {string} text - 要转义的文本
     * @returns {string} - 转义后的文本
     */
    escapeHTML(text) {
        if (typeof text !== 'string') {
            return text;
        }
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * 生成唯一ID
     * @returns {string} - 唯一ID
     */
    generateId() {
        return Math.random().toString(36).substring(2, 15);
    }

    /**
     * 切换节点的展开/折叠状态
     * @param {HTMLElement} node - 要切换的节点
     */
    toggleNode(node) {
        const childrenContainer = node.querySelector('.tree-children');
        const toggleBtn = node.querySelector('.toggle-btn');
        
        if (childrenContainer) {
            const isExpanded = childrenContainer.style.display !== 'none';
            childrenContainer.style.display = isExpanded ? 'none' : 'block';
            toggleBtn.innerHTML = isExpanded ? '&#9654;' : '&#9660;';
            
            // 跟踪展开状态
            if (node.id) {
                if (isExpanded) {
                    this.expandedNodes.delete(node.id);
                } else {
                    this.expandedNodes.add(node.id);
                }
            }
        }
    }

    /**
     * 展开所有节点
     */
    expandAll() {
        const allContainers = this.container.querySelectorAll('.tree-children');
        const allToggles = this.container.querySelectorAll('.toggle-btn');
        
        allContainers.forEach(container => {
            container.style.display = 'block';
        });
        
        allToggles.forEach(toggle => {
            toggle.innerHTML = '&#9660;';
        });
        
        // 更新跟踪的展开状态
        const allNodes = this.container.querySelectorAll('.tree-node');
        allNodes.forEach(node => {
            if (node.id) {
                this.expandedNodes.add(node.id);
            }
        });
    }

    /**
     * 折叠所有节点
     */
    collapseAll() {
        // 保留第一级节点展开
        const rootChildrenContainer = this.container.querySelector(':scope > .tree-node > .tree-children');
        if (rootChildrenContainer) {
            rootChildrenContainer.style.display = 'block';
        }
        
        const allContainers = this.container.querySelectorAll('.tree-node .tree-node .tree-children');
        const allToggles = this.container.querySelectorAll('.tree-node .tree-node .toggle-btn');
        
        allContainers.forEach(container => {
            container.style.display = 'none';
        });
        
        allToggles.forEach(toggle => {
            toggle.innerHTML = '&#9654;';
        });
        
        // 更新跟踪的展开状态
        this.expandedNodes.clear();
        const rootNode = this.container.querySelector(':scope > .tree-node');
        if (rootNode && rootNode.id) {
            this.expandedNodes.add(rootNode.id);
        }
    }

    /**
     * 初始化拖放功能
     */
    initDragAndDrop() {
        // 为了允许全局访问
        window.toggleNode = (node) => this.toggleNode(node);
        
        this.container.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.container.addEventListener('dragover', this.handleDragOver.bind(this));
        this.container.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.container.addEventListener('drop', this.handleDrop.bind(this));
        this.container.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    /**
     * 处理拖动开始事件
     * @param {DragEvent} e - 拖动事件
     */
    handleDragStart(e) {
        if (e.target.classList.contains('tree-node')) {
            this.dragSrcEl = e.target;
            e.target.classList.add('dragging');
            
            // 存储被拖动的数据路径
            e.dataTransfer.setData('text/plain', this.getNodePath(e.target));
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    /**
     * 处理拖动经过事件
     * @param {DragEvent} e - 拖动事件
     */
    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        
        if (e.target.classList.contains('tree-node')) {
            e.target.classList.add('drag-over');
            e.dataTransfer.dropEffect = 'move';
        }
        
        return false;
    }

    /**
     * 处理拖动离开事件
     * @param {DragEvent} e - 拖动事件
     */
    handleDragLeave(e) {
        if (e.target.classList.contains('tree-node')) {
            e.target.classList.remove('drag-over');
        }
    }

    /**
     * 处理放置事件
     * @param {DragEvent} e - 拖动事件
     */
    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        if (this.dragSrcEl && e.target.classList.contains('tree-node')) {
            // 获取源节点和目标节点的路径
            const srcPath = e.dataTransfer.getData('text/plain').split('.');
            const destPath = this.getNodePath(e.target).split('.');
            
            // 执行数据移动操作
            if (this.moveDataNode(srcPath, destPath)) {
                // 重新渲染树
                this.render(this.data);
            }
        }
        
        return false;
    }

    /**
     * 处理拖动结束事件
     */
    handleDragEnd() {
        const allNodes = this.container.querySelectorAll('.tree-node');
        allNodes.forEach(node => {
            node.classList.remove('dragging');
            node.classList.remove('drag-over');
        });
        
        this.dragSrcEl = null;
    }

    /**
     * 获取节点的数据路径
     * @param {HTMLElement} node - 节点元素
     * @returns {string} - 节点路径
     */
    getNodePath(node) {
        const path = [];
        let current = node;
        
        // 获取节点的键名
        const keyElement = current.querySelector(':scope > .tree-item > .node-key');
        if (keyElement) {
            const key = keyElement.textContent.replace(':', '');
            path.unshift(key);
        }
        
        // 向上遍历树获取完整路径
        while (current.parentElement && current.parentElement.classList.contains('tree-children')) {
            current = current.parentElement.parentElement;
            const parentKeyElement = current.querySelector(':scope > .tree-item > .node-key');
            
            if (parentKeyElement) {
                const key = parentKeyElement.textContent.replace(':', '');
                path.unshift(key);
            }
        }
        
        return path.join('.');
    }

    /**
     * 移动数据节点
     * @param {string[]} srcPath - 源节点路径
     * @param {string[]} destPath - 目标节点路径
     * @returns {boolean} - 是否成功移动
     */
    moveDataNode(srcPath, destPath) {
        // 不允许将节点移动到其自身或其子节点
        if (destPath.join('.').startsWith(srcPath.join('.'))) {
            return false;
        }
        
        try {
            // 获取源节点数据
            let srcData = this.data;
            let srcParent = null;
            let srcKey = null;
            
            for (let i = 0; i < srcPath.length; i++) {
                const key = srcPath[i];
                if (i === srcPath.length - 1) {
                    srcParent = srcData;
                    srcKey = key;
                } else {
                    srcData = srcData[key];
                }
            }
            
            const nodeToMove = srcParent[srcKey];
            
            // 获取目标节点
            let destData = this.data;
            for (const key of destPath) {
                destData = destData[key];
            }
            
            // 只有当目标是对象或数组时才能移动
            if (typeof destData !== 'object' || destData === null) {
                return false;
            }
            
            // 移动数据
            if (Array.isArray(destData)) {
                destData.push(nodeToMove);
            } else {
                // 为对象生成唯一键
                let newKey = srcKey;
                while (destData.hasOwnProperty(newKey)) {
                    newKey = `${srcKey}_${this.generateId().substring(0, 4)}`;
                }
                destData[newKey] = nodeToMove;
            }
            
            // 从源位置删除节点
            if (Array.isArray(srcParent)) {
                srcParent.splice(parseInt(srcKey), 1);
            } else {
                delete srcParent[srcKey];
            }
            
            return true;
        } catch (error) {
            console.error('移动节点时出错:', error);
            return false;
        }
    }
} 
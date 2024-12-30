document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('[data-tab]');
    const contents = document.querySelectorAll('.tab-content');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const inputLineCount = document.getElementById('inputLineCount');
    const outputLineCount = document.getElementById('outputLineCount');
    const convertBtn = document.getElementById('convertBtn');
    const delimiter = document.getElementById('delimiter');
    const format = document.getElementById('format');
    const toast = document.getElementById('toast');
    const inputText1 = document.getElementById('inputText1');
    const inputText2 = document.getElementById('inputText2');
    const mergeOutput = document.getElementById('mergeOutput');
    const inputLineCount1 = document.getElementById('inputLineCount1');
    const inputLineCount2 = document.getElementById('inputLineCount2');
    const mergeLineCount = document.getElementById('mergeLineCount');
    const mergeBtn = document.getElementById('mergeBtn');
    const mergeDelimiter = document.getElementById('mergeDelimiter');
    const shuffleTextArea = document.getElementById('shuffleText');
    const shuffleLineCount = document.getElementById('shuffleLineCount');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const deduplicateInput = document.getElementById('deduplicateInput');
    const uniqueOnly = document.getElementById('uniqueOnly');
    const duplicateText = document.getElementById('duplicateText');
    const uniqueText = document.getElementById('uniqueText');
    const deduplicateInputCount = document.getElementById('deduplicateInputCount');
    const duplicateTextCount = document.getElementById('duplicateTextCount');
    const uniqueTextCount = document.getElementById('uniqueTextCount');

    // 切换选项卡的函数
    function switchTab(tabId) {
        // 隐藏所有内容
        contents.forEach(content => {
            content.classList.add('hidden');
        });

        // 移除所有active状态
        tabs.forEach(tab => {
            tab.classList.remove('active-tab');
        });

        // 显示选中的内容
        document.getElementById(tabId).classList.remove('hidden');
        
        // 添加active状态到选中的选项卡
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active-tab');
    }

    // 为每个选项卡添加点击事件
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // 主题切换
    window.toggleTheme = function() {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }

    // 设置初始主题
    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.remove('dark');
    }

    // Toast提示
    window.showToast = function(message, duration = 2000) {
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('animate-fade-in');
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('animate-fade-in');
        }, duration);
    }

    // 更新行数统计
    function updateLineCounts() {
        const inputLines = inputText.value.split('\n').filter(line => line.trim());
        const outputLines = outputText.value.split('\n').filter(line => line.trim());
        inputLineCount.textContent = `转换前数据行数: ${inputLines.length}`;
        outputLineCount.textContent = `转换后数据行数: ${outputLines.length}`;
    }

    // 清空输入
    window.clearInput = function() {
        inputText.value = '';
        updateLineCounts();
    }

    // 清空输出
    window.clearOutput = function() {
        outputText.value = '';
        updateLineCounts();
    }

    let wasmInstance = null;
    const go = new Go();
    WebAssembly.instantiateStreaming(fetch("main.wasm"), go.importObject).then((result) => {
        wasmInstance = result.instance;
        go.run(result.instance);
        console.log('WebAssembly loaded successfully');
    }).catch((err) => {
        console.error('Failed to load WASM:', err);
    });

    // 文本转换
    window.convertFormat = function() {
        const text = inputText.value;
        const delimiterValue = document.getElementById('delimiter').value;
        const formatValue = document.getElementById('format').value;
        
        if (!text.trim()) {
            showToast('请输入要转换的文本');
            return;
        }

        if (!delimiterValue.trim()) {
            showToast('请输入分隔符');
            return;
        }

        if (!formatValue.trim()) {
            showToast('请输入转换后格式');
            return;
        }

        try {
            const response = window.convertFormatWasm(text, delimiterValue, formatValue);
            if (response.error) {
                throw new Error(response.error);
            }
            outputText.value = response.result;
            updateLineCounts();
            showToast('转换完成');
        } catch (error) {
            console.error('Error:', error);
            showToast(error.message || '处理文本时出错');
        }
    }

    // 自动更新行数
    inputText.addEventListener('input', updateLineCounts);
    
    // 添加快捷键支持
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            window.convertFormat();
        }
    });

    // 合并文本
    function mergeTexts() {
        const text1 = inputText1.value;
        const text2 = inputText2.value;
        const delimiter = mergeDelimiter.value;
        
        if (!text1.trim() && !text2.trim()) {
            showToast('请输入要合并的文本');
            return;
        }

        try {
            const response = window.mergeTextsWasm(text1, text2, delimiter);
            if (response.error) {
                throw new Error(response.error);
            }
            mergeOutput.value = response.result;
            updateMergeLineCounts();
            showToast('合并完成');
        } catch (error) {
            console.error('Error:', error);
            showToast(error.message || '处理文本时出错');
        }
    }

    // 打乱文本
    function shuffleText() {
        const textArea = document.getElementById('shuffleText');
        const text = textArea.value;
        
        if (!text.trim()) {
            showToast('请输入要打乱的文本');
            return;
        }

        try {
            const response = window.shuffleTextWasm(text);
            if (response.error) {
                throw new Error(response.error);
            }
            textArea.value = response.result;
            updateShuffleLineCount();
            showToast('打乱完成');
        } catch (error) {
            console.error('Error:', error);
            showToast(error.message || '处理文本时出错');
        }
    }

    // 文本去重
    function deduplicateText() {
        const input = deduplicateInput.value;
        const uniqueOnlyChecked = uniqueOnly.checked;
        
        if (!input.trim()) {
            showToast('请输入要去重的文本');
            return;
        }

        try {
            const response = window.deduplicateTextWasm(input, uniqueOnlyChecked);
            if (response.error) {
                throw new Error(response.error);
            }
            
            if (!Array.isArray(response.duplicates) || !Array.isArray(response.unique)) {
                throw new Error('返回结果格式错误');
            }

            duplicateText.value = response.duplicates.join('\n');
            uniqueText.value = response.unique.join('\n');
            
            const originalLines = input.split('\n').filter(line => line.trim());
            deduplicateInputCount.textContent = `原始数据行数: ${originalLines.length}`;
            duplicateTextCount.textContent = `重复项数据行数: ${response.duplicates.length}`;
            uniqueTextCount.textContent = `去重后数据行数: ${response.unique.length}`;
            showToast('去重完成');
        } catch (error) {
            console.error('Error:', error);
            showToast(error.message || '处理文本时出错');
        }
    }

    // 更新合并工具的行数统计
    function updateMergeLineCounts() {
        const lines1 = inputText1.value.split('\n').filter(line => line.trim());
        const lines2 = inputText2.value.split('\n').filter(line => line.trim());
        const mergeLines = mergeOutput.value.split('\n').filter(line => line.trim());
        
        inputLineCount1.textContent = `数据行数: ${lines1.length}`;
        inputLineCount2.textContent = `数据行数: ${lines2.length}`;
        mergeLineCount.textContent = `数据行数: ${mergeLines.length}`;
    }

    // 更新打乱工具的行数统计
    function updateShuffleLineCount() {
        const lines = document.getElementById('shuffleText').value.split('\n').filter(line => line.trim());
        document.getElementById('shuffleLineCount').textContent = `数据行数: ${lines.length}`;
    }

    // 绑定按钮事件
    mergeBtn.addEventListener('click', mergeTexts);
    shuffleBtn.addEventListener('click', shuffleText);
    document.getElementById('deduplicateBtn').addEventListener('click', deduplicateText);

    // 清空按钮事件
    document.getElementById('clearMergeText1').addEventListener('click', () => {
        inputText1.value = '';
        updateMergeLineCounts();
        showToast('已清空第一组文本');
    });

    document.getElementById('clearMergeText2').addEventListener('click', () => {
        inputText2.value = '';
        updateMergeLineCounts();
        showToast('已清空第二组文本');
    });

    document.getElementById('clearMergeResult').addEventListener('click', () => {
        mergeOutput.value = '';
        updateMergeLineCounts();
        showToast('已清空合并结果');
    });

    document.getElementById('clearShuffleText').addEventListener('click', () => {
        shuffleTextArea.value = '';
        updateShuffleLineCount();
        showToast('已清空打乱文本');
    });

    // 自动更新行数
    inputText1.addEventListener('input', updateMergeLineCounts);
    inputText2.addEventListener('input', updateMergeLineCounts);
    shuffleTextArea.addEventListener('input', updateShuffleLineCount);
    deduplicateInput.addEventListener('input', () => {
        const lines = deduplicateInput.value.split('\n').filter(line => line.trim());
        deduplicateInputCount.textContent = `原始数据行数: ${lines.length}`;
    });
});

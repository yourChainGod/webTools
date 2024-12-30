package main

import (
	"fmt"
	"math/rand"
	"sort"
	"strings"
	"syscall/js"
	"time"
)

var (
	done = make(chan struct{}, 0)
)

// DeduplicateResult 存储去重结果
type DeduplicateResult struct {
	Duplicates []string `json:"duplicates"`
	Unique     []string `json:"unique"`
}

// safeHandler 包装处理函数，捕获所有可能的 panic
func safeHandler(fn func(js.Value, []js.Value) interface{}) func(js.Value, []js.Value) interface{} {
	return func(this js.Value, args []js.Value) (result interface{}) {
		defer func() {
			if r := recover(); r != nil {
				result = createJSObject(map[string]interface{}{
					"error": fmt.Sprintf("Internal error: %v", r),
				})
			}
		}()
		return fn(this, args)
	}
}

func main() {
	println("Go WebAssembly Initialized")

	// 初始化随机数种子
	rand.Seed(time.Now().UnixNano())

	// 注册全局函数，使用 safeHandler 包装所有函数
	js.Global().Set("convertFormatWasm", js.FuncOf(safeHandler(convertFormatWrapper)))
	js.Global().Set("mergeTextsWasm", js.FuncOf(safeHandler(mergeTextsWrapper)))
	js.Global().Set("shuffleTextWasm", js.FuncOf(safeHandler(shuffleTextWrapper)))
	js.Global().Set("deduplicateTextWasm", js.FuncOf(safeHandler(deduplicateTextWrapper)))

	println("WASM functions registered")
	<-done
}

// convertFormatWrapper 包装转换函数
func convertFormatWrapper(this js.Value, args []js.Value) interface{} {
	if len(args) != 3 {
		return createJSObject(map[string]interface{}{
			"error": "Invalid number of arguments, expected 3",
		})
	}
	result := convertFormat(args[0].String(), args[1].String(), args[2].String())
	return createJSObject(map[string]interface{}{
		"result": result,
	})
}

// mergeTextsWrapper 包装合并函数
func mergeTextsWrapper(this js.Value, args []js.Value) interface{} {
	if len(args) != 3 {
		return createJSObject(map[string]interface{}{
			"error": "Invalid number of arguments, expected 3",
		})
	}
	result := mergeTexts(args[0].String(), args[1].String(), args[2].String())
	return createJSObject(map[string]interface{}{
		"result": result,
	})
}

// shuffleTextWrapper 包装打乱函数
func shuffleTextWrapper(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return createJSObject(map[string]interface{}{
			"error": "Invalid number of arguments, expected 1",
		})
	}
	result := shuffleText(args[0].String())
	return createJSObject(map[string]interface{}{
		"result": result,
	})
}

// deduplicateTextWrapper 包装去重函数
func deduplicateTextWrapper(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return createJSObject(map[string]interface{}{
			"error": "Invalid number of arguments, expected 2",
		})
	}

	result := deduplicateText(args[0].String(), args[1].Bool())
	return createJSObject(map[string]interface{}{
		"duplicates": result.Duplicates,
		"unique":     result.Unique,
	})
}

// createJSObject 创建 JavaScript 对象，带错误处理
func createJSObject(data map[string]interface{}) js.Value {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Error creating JS object: %v\n", r)
		}
	}()

	obj := js.Global().Get("Object").New()
	for key, value := range data {
		switch v := value.(type) {
		case []string:
			arr := js.Global().Get("Array").New(len(v))
			for i, s := range v {
				arr.SetIndex(i, s)
			}
			obj.Set(key, arr)
		case string, bool, int, float64:
			obj.Set(key, v)
		default:
			obj.Set(key, js.Undefined())
		}
	}
	return obj
}

// 文本转换函数
func convertFormat(text, delimiter, format string) string {
	if text == "" || delimiter == "" || format == "" {
		return ""
	}

	lines := strings.Split(text, "\n")
	var result []string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		fields := strings.Split(line, delimiter)
		// 清理每个字段
		for i := range fields {
			fields[i] = strings.TrimSpace(fields[i])
		}

		// 替换格式中的占位符 {1}, {2}, {3} 等
		formatted := format
		for i, field := range fields {
			placeholder := fmt.Sprintf("{%d}", i+1)
			formatted = strings.ReplaceAll(formatted, placeholder, field)
		}
		result = append(result, formatted)
	}

	return strings.Join(result, "\n")
}

// 文本合并函数
func mergeTexts(text1, text2, delimiter string) string {
	// 分割文本为行
	lines1 := strings.Split(text1, "\n")
	lines2 := strings.Split(text2, "\n")

	// 过滤空行
	filteredLines1 := make([]string, 0, len(lines1))
	filteredLines2 := make([]string, 0, len(lines2))

	for _, line := range lines1 {
		line = strings.TrimSpace(line)
		if line != "" {
			filteredLines1 = append(filteredLines1, line)
		}
	}

	for _, line := range lines2 {
		line = strings.TrimSpace(line)
		if line != "" {
			filteredLines2 = append(filteredLines2, line)
		}
	}

	// 计算最大长度
	maxLen := len(filteredLines1)
	if len(filteredLines2) > maxLen {
		maxLen = len(filteredLines2)
	}

	// 合并文本
	result := make([]string, 0, maxLen)
	for i := 0; i < maxLen; i++ {
		var line string
		if i < len(filteredLines1) && i < len(filteredLines2) {
			line = filteredLines1[i] + delimiter + filteredLines2[i]
		} else if i < len(filteredLines1) {
			line = filteredLines1[i]
		} else if i < len(filteredLines2) {
			line = filteredLines2[i]
		}
		result = append(result, line)
	}

	return strings.Join(result, "\n")
}

// 文本打乱函数
func shuffleText(text string) string {
	if text == "" {
		return ""
	}

	// 分割文本为行
	lines := strings.Split(text, "\n")
	result := make([]string, 0, len(lines))

	// 过滤空行
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			result = append(result, line)
		}
	}

	// 打乱行顺序
	rand.Shuffle(len(result), func(i, j int) {
		result[i], result[j] = result[j], result[i]
	})

	return strings.Join(result, "\n")
}

// 文本去重函数
func deduplicateText(text string, uniqueOnly bool) DeduplicateResult {
	if text == "" {
		return DeduplicateResult{
			Duplicates: []string{},
			Unique:     []string{},
		}
	}

	// 分割文本为行
	lines := strings.Split(text, "\n")
	lineCount := make(map[string]int)
	duplicates := make(map[string]bool)
	unique := make(map[string]bool)

	// 统计每行出现的次数
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		lineCount[line]++
		if lineCount[line] > 1 {
			duplicates[line] = true
		}
		unique[line] = true
	}

	// 转换为切片并排序
	duplicateSlice := make([]string, 0, len(duplicates))
	for line := range duplicates {
		duplicateSlice = append(duplicateSlice, line)
	}
	sort.Strings(duplicateSlice)

	// 根据 uniqueOnly 参数决定返回的唯一行
	uniqueSlice := make([]string, 0, len(unique))
	if uniqueOnly {
		// 仅保留不重复项
		for line := range unique {
			if !duplicates[line] {
				uniqueSlice = append(uniqueSlice, line)
			}
		}
	} else {
		// 保留所有项（每项只出现一次）
		for line := range unique {
			uniqueSlice = append(uniqueSlice, line)
		}
	}
	sort.Strings(uniqueSlice)

	return DeduplicateResult{
		Duplicates: duplicateSlice,
		Unique:     uniqueSlice,
	}
}

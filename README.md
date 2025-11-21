# FFmpeg 视频混合工具

这是一个使用 Node.js 和 FFmpeg 来混合多个视频文件的工具，支持添加转场效果。

## 前提条件

1. 安装 Node.js (建议版本 >= 14)
2. 安装 FFmpeg
3. 确保系统中有足够的磁盘空间

## 安装

1. 克隆此仓库
2. 安装依赖：
```bash
npm install
```

## 使用方法

### 基本版本（无转场效果）

运行以下命令来简单地连接视频：

```bash
node index.js
```

### 高级版本（带转场效果）

运行以下命令来创建带有转场效果的视频：

```bash
node advanced-mix.js
```

## 输出文件

- 基本版本输出：`output.mp4`
- 高级版本输出：`output-with-transitions.mp4`

## 自定义

### 修改视频列表

编辑 `index.js` 或 `advanced-mix.js` 中的 `videos` 数组来更改要混合的视频文件。

### 修改转场效果

在 `advanced-mix.js` 中，你可以修改 `transitions` 数组来更改转场效果。可用的转场效果包括：

- fade（淡入淡出）
- wipeleft（向左擦除）
- wiperight（向右擦除）
- circlecrop（圆形裁剪）
- radial（径向）
- slideleft（向左滑动）
- slidedown（向下滑动）

## 注意事项

1. 确保所有输入视频的格式兼容
2. 处理大文件时可能需要较长时间
3. 建议在处理前备份原始文件 # ffmpeg-videos-mix-machine

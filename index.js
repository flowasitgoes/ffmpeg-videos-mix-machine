const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');

// 视频文件列表
const videos = [
    'hud-element-with-transparent-background-2024-11-17-06-05-11-utc.mov',
    'music-notes-on-transparent-background-2023-11-27-05-03-59-utc.mov',
    'rotating-earth-with-transparent-background-2023-11-27-05-06-50-utc.mp4',
    'exploding-ring-on-transparent-background-2024-10-29-20-57-48-utc.mov',
    'falling-silver-coins-on-transparent-background-2024-02-13-19-23-34-utc.mov'
];

// 创建临时文件列表
const createFileList = async () => {
    const fileList = videos.map(video => `file '${video}'`).join('\n');
    await fs.writeFile('filelist.txt', fileList);
};

// 创建混合视频
const createMixedVideo = async () => {
    try {
        // 创建文件列表
        await createFileList();

        // 设置 FFmpeg 命令
        const command = ffmpeg()
            .input('filelist.txt')
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions([
                '-c:v libx264',
                '-crf 23',
                '-preset fast',
                '-pix_fmt yuv420p'
            ])
            .output('output.mp4');

        // 添加进度监听
        command.on('progress', (progress) => {
            console.log(`处理进度: ${Math.floor(progress.percent)}%`);
        });

        // 添加完成监听
        command.on('end', () => {
            console.log('视频处理完成！');
            // 清理临时文件
            fs.remove('filelist.txt');
        });

        // 添加错误监听
        command.on('error', (err) => {
            console.error('处理视频时出错:', err);
        });

        // 开始处理
        command.run();

    } catch (error) {
        console.error('发生错误:', error);
    }
};

// 执行主函数
createMixedVideo(); 
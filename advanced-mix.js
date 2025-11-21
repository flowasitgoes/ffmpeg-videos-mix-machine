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

// 目标分辨率
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;

// 背景音乐
const bgm = 'World___R_B__BPM105_2025-04-29-1059am.mp3';

// 检查文件是否存在
const checkFiles = async () => {
    for (const video of videos) {
        const exists = await fs.pathExists(video);
        if (!exists) {
            throw new Error(`文件不存在: ${video}`);
        }
        console.log(`检查文件: ${video} - 存在`);
    }
};

// 转场效果列表
const transitions = [
    'fade',
    'wipeleft',
    'wiperight',
    'circlecrop',
    'radial',
    'slideleft',
    'slidedown'
];

// 获取输出视频时长
const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration);
        });
    });
};

// 构建复杂的 filter_complex 字符串
const buildFilterComplex = () => {
    let filterComplex = '';
    let lastOutput = '';
    
    videos.forEach((_, index) => {
        if (index === 0) {
            // 第一个视频：调整分辨率和帧率
            filterComplex += `[${index}:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT},fps=30,format=yuv420p[v${index}];`;
            lastOutput = `v${index}`;
        } else {
            const transition = transitions[index % transitions.length];
            const duration = 1; // 转场持续时间（秒）
            const offset = index * 4; // 转场开始时间（秒）
            
            // 其他视频：先调整分辨率和帧率，再进行转场
            filterComplex += `[${index}:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT},fps=30[v${index}scaled];`;
            filterComplex += `[${lastOutput}][v${index}scaled]xfade=transition=${transition}:duration=${duration}:offset=${offset}[v${index}];`;
            lastOutput = `v${index}`;
        }
    });

    return {
        filterComplex: filterComplex.slice(0, -1), // 移除最后一个分号
        lastOutput: lastOutput
    };
};

// 创建混合视频
const createMixedVideo = async () => {
    try {
        // 检查文件是否存在
        await checkFiles();
        if (!(await fs.pathExists(bgm))) {
            throw new Error(`背景音樂檔案不存在: ${bgm}`);
        }
        console.log(`檢查背景音樂: ${bgm} - 存在`);
        
        const { filterComplex, lastOutput } = buildFilterComplex();
        console.log('Filter complex:', filterComplex);
        
        // 構建輸入
        let command = ffmpeg();
        videos.forEach(video => {
            command = command.input(video);
        });
        command = command.input(bgm);

        // 設定複雜濾鏡
        command = command.complexFilter(filterComplex, [lastOutput]);

        // 先生成無音訊的臨時影片
        const tempOutput = 'temp_output_noaudio.mp4';
        await new Promise((resolve, reject) => {
            command
                .outputOptions([
                    '-c:v libx264',
                    '-crf 23',
                    '-preset fast',
                    '-pix_fmt yuv420p',
                    '-an' // 不帶音訊
                ])
                .output(tempOutput)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // 取得影片長度
        const duration = await getVideoDuration(tempOutput);
        console.log('影片長度:', duration, '秒');

        // 合成音樂與影片
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(tempOutput)
                .input(bgm)
                .outputOptions([
                    '-c:v copy',
                    '-c:a aac',
                    '-shortest',
                    `-t ${duration}` // 裁切到影片長度
                ])
                .output('output-with-transitions.mp4')
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // 刪除臨時檔
        await fs.remove(tempOutput);
        console.log('影片處理完成！已加入背景音樂。');
    } catch (error) {
        console.error('發生錯誤:', error);
    }
};

// 执行主函数
createMixedVideo(); 
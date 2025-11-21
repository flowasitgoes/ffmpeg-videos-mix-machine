const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');

// 视频文件列表（主视频）
const mainVideos = [
    'hud-element-with-transparent-background-2024-11-17-06-05-11-utc.mov',
    'music-notes-on-transparent-background-2023-11-27-05-03-59-utc.mov',
    'rotating-earth-with-transparent-background-2023-11-27-05-06-50-utc.mp4',
    'exploding-ring-on-transparent-background-2024-10-29-20-57-48-utc.mov',
    'falling-silver-coins-on-transparent-background-2024-02-13-19-23-34-utc.mov'
];

// 画中画视频
const pipVideo = 'C3560-full-bro-find-sis.mp4';

// 背景音乐
const bgm = 'World___R_B__BPM105_2025-04-29-1059am.mp3';

// 目标分辨率
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;

// 画中画视频的大小和位置
const PIP_WIDTH = 480;
const PIP_HEIGHT = 270;
const PIP_X = (TARGET_WIDTH - PIP_WIDTH) / 2;
const PIP_Y = (TARGET_HEIGHT - PIP_HEIGHT) / 2;

// 音量设置
const PIP_VOLUME = 0.6;
const BGM_VOLUME = 0.4;

// 特效参数
const EFFECTS = {
    audioReactive: true,
    colorShift: true,
    glitchEffect: true,
    mirrorEffect: true
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

// 构建复杂的 filter_complex 字符串
const buildFilterComplex = () => {
    let filterComplex = '';
    let lastOutput = '';
    
    // 处理主视频
    mainVideos.forEach((_, index) => {
        if (index === 0) {
            // 添加镜像效果
            if (EFFECTS.mirrorEffect) {
                filterComplex += `[${index}:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT},fps=30,format=yuv420p,crop=iw/2:ih:0:0,pad=iw*2:ih:iw:0:black[v${index}];`;
            } else {
                filterComplex += `[${index}:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT},fps=30,format=yuv420p[v${index}];`;
            }
            lastOutput = `v${index}`;
        } else {
            const transition = transitions[index % transitions.length];
            const duration = 1;
            const offset = index * 4;
            
            // 添加音频反应效果
            if (EFFECTS.audioReactive) {
                filterComplex += `[${index}:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT},fps=30,eq=contrast=1.2:brightness=0.1[v${index}scaled];`;
            } else {
                filterComplex += `[${index}:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT},fps=30[v${index}scaled];`;
            }
            
            // 添加故障效果
            if (EFFECTS.glitchEffect) {
                filterComplex += `[v${index}scaled]hue=h=90:s=1[v${index}glitch];`;
                filterComplex += `[${lastOutput}][v${index}glitch]xfade=transition=${transition}:duration=${duration}:offset=${offset}[v${index}];`;
            } else {
                filterComplex += `[${lastOutput}][v${index}scaled]xfade=transition=${transition}:duration=${duration}:offset=${offset}[v${index}];`;
            }
            
            lastOutput = `v${index}`;
        }
    });

    // 处理画中画视频
    const pipIndex = mainVideos.length;
    if (EFFECTS.colorShift) {
        filterComplex += `[${pipIndex}:v]scale=${PIP_WIDTH}:${PIP_HEIGHT},fps=30,format=yuv420p,eq=contrast=1.2:brightness=0.1,hue=h=45:s=1[pip];`;
    } else {
        filterComplex += `[${pipIndex}:v]scale=${PIP_WIDTH}:${PIP_HEIGHT},fps=30,format=yuv420p[pip];`;
    }
    
    // 添加画中画效果
    filterComplex += `[${lastOutput}][pip]overlay=${PIP_X}:${PIP_Y}[vfinal];`;

    // 处理音频
    filterComplex += `[${pipIndex}:a]volume=${PIP_VOLUME}[pip_audio];`;
    filterComplex += `[${pipIndex + 1}:a]volume=${BGM_VOLUME}[bgm_audio];`;
    filterComplex += `[pip_audio][bgm_audio]amix=inputs=2:duration=longest[aout]`;

    return {
        filterComplex: filterComplex,
        lastOutput: 'vfinal',
        audioOutput: 'aout'
    };
};

// 检查文件是否存在
const checkFiles = async () => {
    const allVideos = [...mainVideos, pipVideo];
    for (const video of allVideos) {
        const exists = await fs.pathExists(video);
        if (!exists) {
            throw new Error(`文件不存在: ${video}`);
        }
        console.log(`检查文件: ${video} - 存在`);
    }
    if (!(await fs.pathExists(bgm))) {
        throw new Error(`背景音乐文件不存在: ${bgm}`);
    }
    console.log(`检查背景音乐: ${bgm} - 存在`);
};

// 创建混合视频
const createMixedVideo = async () => {
    try {
        // 检查文件是否存在
        await checkFiles();
        
        const { filterComplex, lastOutput, audioOutput } = buildFilterComplex();
        console.log('Filter complex:', filterComplex);
        
        // 构建输入
        let command = ffmpeg();
        [...mainVideos, pipVideo].forEach(video => {
            command = command.input(video);
        });
        command = command.input(bgm);

        // 生成最终视频
        await new Promise((resolve, reject) => {
            command
                .complexFilter(filterComplex, [lastOutput, audioOutput])
                .outputOptions([
                    '-c:v libx264',
                    '-crf 23',
                    '-preset fast',
                    '-pix_fmt yuv420p',
                    '-c:a aac',
                    '-b:a 192k'
                ])
                .output('output-with-advanced-effects.mp4')
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        console.log('视频处理完成！已加入高级特效。');
    } catch (error) {
        console.error('发生错误:', error);
    }
};

// 执行主函数
createMixedVideo(); 
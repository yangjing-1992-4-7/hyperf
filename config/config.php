<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
use Hyperf\Contract\StdoutLoggerInterface;
use Psr\Log\LogLevel;

return [
    'app_name' => env('APP_NAME', 'skeleton'),
    'app_env' => env('APP_ENV', 'dev'),
    'scan_cacheable' => env('SCAN_CACHEABLE', false),
    StdoutLoggerInterface::class => [
        'log_level' => [
            LogLevel::ALERT,
            LogLevel::CRITICAL,
            LogLevel::DEBUG,
            LogLevel::EMERGENCY,
            LogLevel::ERROR,
            LogLevel::INFO,
            LogLevel::NOTICE,
            LogLevel::WARNING,
        ],
    ],
    
    //最大上传图片尺寸
    'max_upload_img_size' => 1024*1024*1,    
    //最大语音聊天尺寸
    'max_yuyin_size' => 1024*1024*1, 
    //允许上传图片类型
    'upload_img_ext' =>['jpg','png','gif','jpeg'],
    //用户默认头像
    'avatar_default_img' =>'/images/avatar_default.jpg',
];

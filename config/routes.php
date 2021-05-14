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
use Hyperf\HttpServer\Router\Router;
//首页
Router::addRoute(['GET','HEAD'], '/', 'App\Controller\IndexController@index');
//首页
Router::addRoute(['GET', 'HEAD'], '/index', 'App\Controller\IndexController@index');
//获取聊天记录
Router::addRoute(['POST',], '/getchat', 'App\Controller\IndexController@getchat');
//聊天发送图片或语音
Router::addRoute(['POST',], '/send_file', 'App\Controller\UploadController@send_file');
//用户更换头像
Router::addRoute(['POST',], '/change_avatar', 'App\Controller\UploadController@change_avatar');
//更新聊天状态
Router::addRoute(['POST',], '/update_chat_status', 'App\Controller\IndexController@update_chat_status');
//获取好友列表
Router::addRoute(['POST',], '/get_friend_list', 'App\Controller\IndexController@get_friend_list');
//获取推荐好友
Router::addRoute(['POST',], '/get_recommend_friend', 'App\Controller\IndexController@get_recommend_friend');
//搜索好友
Router::addRoute(['POST',], '/get_recommend_search', 'App\Controller\IndexController@get_recommend_search');
//添加好友或群聊
Router::addRoute(['POST',], '/recommend_friend_add', 'App\Controller\IndexController@recommend_friend_add');
//更新语音是否已读
Router::addRoute(['POST',], '/update_audio_read', 'App\Controller\IndexController@update_audio_read');
//登录
Router::addRoute(['GET', 'POST',], '/login', 'App\Controller\IndexController@login');
//注册
Router::addRoute(['GET', 'POST',], '/reg', 'App\Controller\IndexController@reg');




Router::addServer('ws', function () {
    Router::get('/websocket', 'App\Controller\WebSocketController');
});



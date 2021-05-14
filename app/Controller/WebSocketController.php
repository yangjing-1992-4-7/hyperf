<?php

/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
namespace App\Controller;

use Hyperf\Contract\OnCloseInterface;
use Hyperf\Contract\OnMessageInterface;
use Hyperf\Contract\OnOpenInterface;
use Swoole\Http\Request;
use Swoole\Server;
use Swoole\Websocket\Frame;
use Swoole\WebSocket\Server as WebSocketServer;
use App\Model\Chat as Chat;
use App\Model\User as User;
use App\Model\Friend as Friend;
use App\Model\ChatGroup as ChatGroup;
use App\Model\GroupUser as GroupUser;
use App\Model\MyGroupChat as MyGroupChat;
use App\Model\GroupList as GroupList;

class WebSocketController implements OnMessageInterface, OnOpenInterface, OnCloseInterface{

    public function onMessage($server, Frame $frame): void{
//  	foreach($server->connections as $f){
//  	    $msg['code']=false;
//		    $msg['msg']="大家好";   
//          $server->push($f, json_encode($msg));
//      }

    	$data=json_decode($frame->data,true); 
        if($data['code']=='ping'){
        	$data['code']=true;
        	$data['type']='pong';
	        $server->push($frame->fd, json_encode($data));
        }else if($data['code']=='webRTC'){
    	 	$fd=socket_get('socket',$data['tid']); 
    	    
    	 	$uid=socket_get('fd',$fd);
    	 	if(($uid==$data['tid'])&&$fd!=''){
    	 		$result=$server->push($fd, json_encode($data));    		
	    	 	if(!$result){
	    	 		$da['code']='webRTC';
	    	 		$da['message']='对方不在线';
	    	 		$da['event']='offline';
	    	 		$server->push($frame->fd, json_encode($da));
	    	 	}
    	 	}else{
    	 		$da['code']='webRTC';
    	 		$da['message']='对方不在线';
    	 		$da['event']='offline';
    	 		$server->push($frame->fd, json_encode($da));
    	 	}
    	 	
    	}else if($data['code']=='update_status'){
    	 	if(is_array($data['friend_list'])&&count($data['friend_list'])>0){
    	 	 	foreach($data['friend_list'] as $k=>$v){       	 	 			 	 		
    	 	 		$fd=socket_get('socket',$v);  
    	 	 		$uid=socket_get('fd',$fd);  	 
    	 	 		if($uid&&$uid==$v){
    	 	 			$msg['code']='update_status';
        	 	 		$msg['status']=$data['status'];
        	 	 		$msg['user_id']=$data['user_id'];
        	 	 		$result=$server->push($fd, json_encode($msg));
    	 	 		}         	 	 		
    	 	 	}   	 	 	
    	 	}
    	}else if($data['code']=='select_status'){
    		if(is_array($data['friend_list'])&&count($data['friend_list'])>0){
    			$friend_list=array();
    			foreach($data['friend_list'] as $k=>$v){
    				$fd=socket_get('socket',$v);  
    	 	 		$uid=socket_get('fd',$fd);  		 
    	 	 		if($uid&&$uid==$v){
    	 	 			$da['code']=true;
			        	$da['type']='pong';
				        $result=$server->push($fd, json_encode($da));
				        if($result){
				        	$friend_list[]=$uid;
				        }
    	 	 		}      
    		 	}
    		 	 
    		 	$msg['code']='select_status';
    		 	$msg['friend_list']=$friend_list;
    		 	$result=$server->push($frame->fd, json_encode($msg)); 	 
    	 	}
        }else if($data['code']=='send_msg'){   
        	    if(strstr($data['tid'],'group_')){
        	    	$group_id=str_replace("group_","",$data['tid']);
        	    	if($data['type']==1){
        	    		$this->ChatGroup=new ChatGroup;
	        	    	$da['group_id']=$group_id;
	        	    	$da['user_id']=$data['fid'];
	        	    	$da['message']=$data['message'];
	        	    	$da['type']=$data['type'];
	        	    	$da['audio_read']="";
	        	    	$this->GroupList=new GroupList;
	        	    	
	        	    	$id=$this->ChatGroup->saveInfo($da);
	        	    	if($id){
	        	    		$w['id']=$group_id;
	        	    		$u['last_send_time']=time();
	        	    		$this->GroupList->updateByWhere($w,$u);
	        	    		$this->GroupUser=new GroupUser;
		        	    	$where['user_id']=array('<>',$data['fid']);
		        	    	$where['group_id']=$group_id;
		        	    	$friend_list=$this->GroupUser->getInfoByWhere($where);
		        	    	$d['last_message_id']=$id;
				         	$d['group_id']=$group_id;
				         	$d['user_id']=$data['fid'];
				         	$this->MyGroupChat=new MyGroupChat;
				         	$this->MyGroupChat->update_last_send($d);
		        	    	
		        	    	if(count($friend_list)>0){
		        	    		foreach($friend_list as $k=>$v){
		        	    			$fd=socket_get('socket',$v['user_id']);
			        	    		$data['code']=true;
			        	    		$data['fid']=$data['tid'];
					                $result=$server->push($fd, json_encode($data));			  
		        	    		}
		        	    	}
	        	    	}else{
	        	    		$msg['code']=false;
			         		$msg['msg']="发送消息失败，请重试";     
			                $result=$server->push($frame->fd, json_encode($msg));
	        	    	}
        	    	}else{
        	    		$this->GroupUser=new GroupUser;
	        	    	$where['user_id']=array('<>',$data['fid']);
	        	    	$where['group_id']=$group_id;
	        	    	$friend_list=$this->GroupUser->getInfoByWhere($where);
	        	    	if(count($friend_list)>0){
	        	    		foreach($friend_list as $k=>$v){
	        	    			$fd=socket_get('socket',$v['user_id']);
		        	    		$data['code']=true;
		        	    		$data['fid']=$data['tid'];       
				                $result=$server->push($fd, json_encode($data));			  
	        	    		}
	        	    	}
        	    	}
        	    	
        	    	
        	    }else{
        	    	$fd=socket_get('socket',$data['tid']);
			        if($data['type']==1){
			         	$this->Chat=new Chat;
			         	$name=$data['name'];
			         	$avatar=$data['avatar'];
			         	unset($data['name']);
			         	unset($data['code']);
			         	unset($data['avatar']);
			         	$data['is_read']=0;
			         	if($data['message']){
			         		$this->friend=new Friend;
			         		$this->friend->update_friend_send($data['tid'],$data['fid']);
			         		$data['audio_read']="";
			         		$da=$this->Chat->saveInfo($data);
			         		if($da){
			         			$data['id']=$da;
				         	    $data['name']=$name;
				                $data['avatar']=$avatar;
				                $data['code']=true;      
			                    $result=$server->push($fd, json_encode($data));
			         		}else{
			         			$msg['code']=false;
				         		$msg['msg']="发送消息失败，请重试";     
				                $result=$server->push($frame->fd, json_encode($msg));
			         		}
			         	}else{
			         		$msg['code']=false;
			         		$msg['msg']="内容不能为空";    
			                $result=$server->push($frame->fd, json_encode($msg));
			         	}
			        }else{
			        	$data['code']=true;      
			            $result=$server->push($fd, json_encode($data));
			        } 
        	    }
        }else if($data['code']=='leave'){
    	 	if(is_array($data['friend_list'])&&count($data['friend_list'])>0){
    	 	 	foreach($data['friend_list'] as $k=>$v){       	 	 			 	 		
    	 	 		$fd=socket_get('socket',$v);  
    	 	 		$uid=socket_get('fd',$fd);  	 
    	 	 		if($uid&&$uid==$v){
    	 	 			$msg['code']='leave';
        	 	 		$msg['leave_status']=$data['leave_status'];
        	 	 		$msg['user_id']=$data['user_id'];
        	 	 		$result=$server->push($fd, json_encode($msg));
    	 	 		}         	 	 		
    	 	 	}   	 	 	
    	 	}
    	}  
    }

    public function onClose($server, int $fd, int $reactorId): void{
    	$user_id=socket_get('fd',$fd); 
    	$my_fd=socket_get('socket',$user_id);  	  
    	socket_set('fd',$fd,'');
    	if($my_fd==$fd){
    		socket_set('socket',$user_id,"");
    		$friend_list=socket_get('socket_friendlist',$user_id);
	    	if(is_array($friend_list)&&count($friend_list)>0){
		    	foreach($friend_list as $k=>$v){	    		      	 	 			 	 		
		 	 		$fd=socket_get('socket',$v['id']);  
		 	 		$uid=socket_get('fd',$fd);  		 
		 	 		if($uid&&$uid==$v['id']){
		 	 			$msg['code']='update_status';
			 	 		$msg['status']=0;
			 	 		$msg['user_id']=$user_id;
			 	 		$result=$server->push($fd, json_encode($msg));
		 	 		}     
		 	 		
		 	 	}
	 	 	}
    	}
    	
    }

    public function onOpen($server, Request $request): void{    
    	$user= json_decode($request->cookie['user'],true); 
    	$fd=socket_get('socket',$user['uid']); 
    	$uid=socket_get('fd',$fd);
    	if($fd&&$fd!=$request->fd&&$uid==$user['uid']){
    		$msg['code']='other';
    		$msg['msg']='该账号已在其他地方登录';
    		$server->push($fd, json_encode($msg));
    	}	
    	socket_set('socket',$user['uid'],$request->fd);
    	socket_set('fd',$request->fd,$user['uid']);
    	$this->friend=new Friend;
    	$friend_list=$this->friend->get_friend_list($user['uid']);
    	socket_set('socket_friendlist',$user['uid'],$friend_list);
    }
}

?>
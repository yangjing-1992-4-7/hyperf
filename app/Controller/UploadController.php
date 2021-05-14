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

use App\Model\User as User;
use App\Model\Chat as Chat;
use App\Model\Friend as Friend;
use App\Model\ChatGroup as ChatGroup;
use App\Model\MyGroupChat as MyGroupChat;
use App\Model\GroupList as GroupList;

class UploadController extends AbstractController{
    public function __construct(){
    	 parent::__construct();
         $this->User=new User;
         $this->Chat=new Chat;
         $this->friend=new Friend;
         $this->ChatGroup=new ChatGroup; 
         $this->MyGroupChat=new MyGroupChat;  
         $this->GroupList=new GroupList;
    }
    
    //聊天发送语音或图片
    public function send_file(){
    	if ($this->request->hasFile('send_file')) {
    		if ($this->request->file('send_file')->isValid()) {
			    $file = $this->request->file('send_file');			    
			    if($this->request->input('type')==2){
			    	if(in_array($file->getExtension(),config('upload_img_ext'))){
			    		if($file->getSize()>config('max_upload_img_size')){
					    	$result['code']=false;
					        $result['message']="图片太大,请压缩后上传";
					        return json_encode($result);   
					    }
				    }else{
				    	$result['code']=false;
					    $result['message']="图片格式不正确";
					    return json_encode($result);   
				    }
				    $path='/uploads/images/'.date('Y-m-d').'/'.md5(microtime()).'.'.$file->getExtension();
				    $mkdir='public/uploads/images/'.date('Y-m-d');
			    }else if($this->request->input('type')==3){
			    	if($file->getSize()>config('max_yuyin_size')){
				    	$result['code']=false;
				        $result['message']="语音过长";
				        return json_encode($result);   
				    }
			    	$path='/uploads/audio/'.date('Y-m-d').'/'.md5(microtime()).'.wav';
			    	$mkdir='public/uploads/audio/'.date('Y-m-d');
			    }
		        
		    
		    	if (!is_dir($mkdir)){
					if(!mkdir($mkdir, 0777)){
					    $result['code']=false;
		                $result['message']="创建文件夹失败";
		                return json_encode($result);  
					}			
				}
				clearstatcache();		
				$file->moveTo('public'.$path);
				if ($file->isMoved()) {
					if(strstr($this->request->input('tid'),'group_')){
	                    $group_id=str_replace("group_","",$this->request->input('tid'));
	                    $data['group_id']=$group_id;
			            $data['user_id']=$this->request->input('fid');
			         	$data['message']=$path;
			         	$data['type']=$this->request->input('type');	
			         	if($this->request->input('type')==3){
			         		if($this->request->input('length')>60){
			         			$length=60;
			         		}else if($this->request->input('length')<1){
			         			$length=1;
			         		}else{
			         			$length=intval($this->request->input('length'));
			         		}
			         		$data['length']=$length;
			         		$data['audio_read']="";		
			         	}
			         	
			         	$da=$this->ChatGroup->saveInfo($data);
			         	$w['id']=$group_id;
        	    		$u['last_send_time']=time();
        	    		$this->GroupList->updateByWhere($w,$u);
			         	$d['last_message_id']=$da;
			         	$d['group_id']=$data['group_id'];
			         	$d['user_id']=$data['user_id'];
			         	$this->MyGroupChat->update_last_send($d);
			         	
	                }else{
	                	$data['fid']=$this->request->input('fid');
			            $data['tid']=$this->request->input('tid');
			         	$data['message']=$path;
			         	$data['type']=$this->request->input('type');
			         	$data['is_read']=0;
			         	if($this->request->input('type')==3){
			         		if($this->request->input('length')>60){
			         			$length=60;
			         		}else if($this->request->input('length')<1){
			         			$length=1;
			         		}else{
			         			$length=intval($this->request->input('length'));
			         		}
			         		$data['length']=$length;
			         		$data['audio_read']="";	
			         	}
			         	
			         	$this->friend->update_friend_send($data['fid'],$data['tid']);
		         	
			         	$da=$this->Chat->saveInfo($data);
	                }   							    
		            
		         	if($da){
		         		$result['id']=$da;
		         		$result['fid']=$this->request->input('fid');
		                $result['tid']=$this->request->input('tid');
		                $result['type']=$this->request->input('type');
		         		$result['code']='send_msg';
		                $result['message']=$path;
		                if($length){
		                	$result['length']=$length;
		                	$result['audio_read']=0;	
		                }
		                
		                $user=$this->User->getInfo($result['fid']);
		                $result['name']=$user['name'];
		                $result['avatar']=$user['avatar'];
		                return json_encode($result);
		         	}else{
		         		$result['code']=false;
                        $result['message']="上传失败";
                        return json_encode($result);
		         	}
				}else{
					$result['code']=false;
	                $result['message']="上传失败";
	                return json_encode($result);  
				}

			}else{
				$result['code']=false;
			    $result['message']="无效文件";
			    return json_encode($result);   
			} 
		}else{
			$result['code']=false;
			$result['message']="文件不存在";
			return json_encode($result);   
		}
		
	
		
    }
    
    
    //用户更换头像
    public function change_avatar(){
    	if(!$this->request->cookie('user')){
    		$result['code']=false;
	        $result['message']="请先登录";
	        return json_encode($result);
    	}else{
    		if ($this->request->hasFile('avatar')) {
	    		if ($this->request->file('avatar')->isValid()) {
				    $file = $this->request->file('avatar');			    			    
			    	if(in_array($file->getExtension(),config('upload_img_ext'))){
			    		if($file->getSize()>config('max_upload_img_size')){
					    	$result['code']=false;
					        $result['message']="图片太大,请压缩后上传";
					        return json_encode($result);   
					    }
				    }else{
				    	$result['code']=false;
					    $result['message']="图片格式不正确";
					    return json_encode($result);   
				    }
				    
				    $path='/uploads/images/'.date('Y-m-d').'/'.md5(microtime()).'.'.$file->getExtension();
				    $mkdir='public/uploads/images/'.date('Y-m-d');
	
			    	if (!is_dir($mkdir)){
						if(!mkdir($mkdir, 0777)){
						    $result['code']=false;
			                $result['message']="创建文件夹失败";
			                return json_encode($result);  
						}			
					}
					clearstatcache();		
					$file->moveTo('public'.$path);
					if ($file->isMoved()) {
						$user_id=$this->request->input('user_id');						
						$user=json_decode($this->request->cookie('user'),true);
						if($user['uid']!=$user_id){
							$result['code']=false;
		                    $result['message']="用户ID不正确";
		                    return json_encode($result);
						}else{
							$where['id']=$user_id;
							$update['avatar']=$path;
							$res=$this->User->updateByWhere($where,$update);
							if($res){
								$result['code']=true;
			                    $result['message']="更换头像成功";
			                    $result['src']=$path;
			                    return json_encode($result);
							}else{
								$result['code']=false;
			                    $result['message']="更换头像失败";
			                    return json_encode($result);
							}
						}
					}else{
						$result['code']=false;
	                    $result['message']="更换头像失败";
	                    return json_encode($result);
					}	
				}else{
					$result['code']=false;
				    $result['message']="无效图片";
				    return json_encode($result);   
				} 
			}else{
				$result['code']=false;
				$result['message']="图片不存在";
				return json_encode($result);   
			}	
    	}	
    		
    }
}

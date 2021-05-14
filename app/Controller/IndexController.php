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
use App\Model\GroupList as GroupList;
use App\Model\ChatGroup as ChatGroup;
use App\Model\GroupUser as GroupUser;


class IndexController extends AbstractController{
	public function __construct(){
		 parent::__construct();
         $this->User=new User;
         $this->Chat=new Chat;
         $this->Friend=new Friend;
         $this->GroupList=new GroupList;
         $this->ChatGroup=new ChatGroup;  
         $this->GroupUser=new GroupUser;  
    }
	
	
    public function index(){
        if(check_login($this->request,$this->response)!='on'){
        	return check_login($this->request,$this->response);
        }
    	
   
//      $this->session->set('foo', 'bar');
//	    $data['id']=2;
//		$data['name']="带娃";
//		$user=$this->User->saveInfo($data);
//        
//      $user=Db::table('user')->paginate(1);
//		    
//		//使用redis缓存
//      $datas=redis_get('socket');
//      //使用kafka消息队列生产
//      send($data,"shoplist");
//        
//      //使用协程       
//      for($i=0;$i<100;$i++){
//	      	go(function()use($name,$id){
//	      		var_dump($id);
//	      		$da['name']=$name;
//	      		$user=Db::table('test')->insert($da);
//	      	});
//      }
//      
//    	//读取session
//  	$name=$this->session->get('foo');
//      //读取cookie
//      $cookies = $request->getCookieParams();
//      //读取redis缓存
//      $user=redis_get('socket_1');
//      //使用kafka消息队列消费
//      $name=consumer("shoplist");  

        return $this->render->render('index/index');
    }

    public function login(){
    	if ($this->request->isMethod('post')) {
    		$validator = $this->validationFactory->make(
	            $this->request->all(),
	            [
	                'username' => 'required|alpha_dash|between:6,20',
	                'password' => 'required|alpha_dash|between:6,20',
	            ],
	            [
	                'username.required' => '用户名不能为空',
	                'username.alpha_dash' => '用户名必须包含字母(包含中文)和数字，以及破折号和下划线',
	                'username.between' => '用户名长度必须在6-20位之间',
	                'password.required' => '密码不能为空',
	                'password.alpha_dash' => '密码必须包含字母(包含中文)和数字，以及破折号和下划线',
	                'password.between' => '密码长度必须在6-20位之间',
	            ]
	        );
	
	        if ($validator->fails()){
	            $errorMessage = $validator->errors()->first();
	            $data['code']=false;
	            $data['msg']=$errorMessage;  
	        }else{
	        	$username=$this->request->input('username');
			    $password=$this->request->input('password');
			    
			    $data=$this->User->login($username,$password);
			    if($data['code']==true){
			    	$this->session->set('user',$data);
			    	$data['url']="/";
			    	$data['msg']="登录成功";
			    }
	        }
    		
		    return json_encode($data);
		}else{
			if(check_login($this->request,$this->response)!='on'){		
	        	return $this->render->render('index/login');
		    }else{
		    	return $this->response->redirect('/');
		    }
		}
    }
    
    
    public function reg(){
    	if ($this->request->isMethod('post')) {
    		$validator = $this->validationFactory->make(
	            $this->request->all(),
	            [
	                'username' => 'required|alpha_dash|between:6,20',
	                'password' => 'required|alpha_dash|between:6,20|confirmed', 
	            ],
	            [
	                'username.required' => '用户名不能为空',
	                'username.alpha_dash' => '用户名必须包含字母(包含中文)和数字，以及破折号和下划线',
	                'username.between' => '用户名长度必须在6-20位之间',
	                'password.required' => '密码不能为空',
	                'password.alpha_dash' => '密码必须包含字母(包含中文)和数字，以及破折号和下划线',
	                'password.between' => '密码长度必须在6-20位之间',
	                'password.confirmed' => '确认密码和密码不一致',
	            ]
	        );
	
	        if ($validator->fails()){
	            $errorMessage = $validator->errors()->first();
	            $data['code']=false;
	            $data['msg']=$errorMessage;  
	        }else{
	        	$username=$this->request->input('username');
			    $password=$this->request->input('password');
			    
			    $data=$this->User->reg($username,$password,get_ip($this->request));
			    if($data['code']==true){			    
			    	$data['url']="/";
			    	$data['msg']="注册成功";
			    }
	        }
    		
		    return json_encode($data);
		}else{
			return $this->render->render('index/reg');
		}
    }
    
    
    //获取用户好友列表
     public function get_friend_list(){
     	$user_id=$this->request->input('user_id');
        
        $group=$this->GroupList->get_group_list($user_id);

        $friends=$this->Friend->get_friend_list($user_id);
        
        $result=array_merge($group,$friends);

     	return json_encode($result);
     }	 
     
     
    //获取用户推荐好友
    public function get_recommend_friend(){
     	$user_id=$this->request->input('user_id');

        $friends=$this->Friend->get_recommend_friend($user_id);

     	return json_encode($friends);
    }	
     
    //搜索   
    public function get_recommend_search(){
     	$user_id=$this->request->input('user_id');
     	$keyword=$this->request->input('keyword');

        $friends=$this->Friend->get_recommend_search($user_id,$keyword);

     	return json_encode($friends);
    }
    
    //添加好友或群聊   
    public function recommend_friend_add(){
    	$user_id=$this->request->input('user_id');
     	$type=$this->request->input('type');
     	$recommend_friend_id=$this->request->input('recommend_friend_id');

        if($type==1){
        	$result=$this->Friend->recommend_friend_add($user_id,$recommend_friend_id);
        }else if($type==2){
        	$result=$this->GroupUser->recommend_friend_add($user_id,$recommend_friend_id);
        }
        
     	return json_encode($result);
    }
    
    
     
    //获取用户聊天记录
    public function getchat(){
     	$user_id=$this->request->input('user_id');
     	$other_id=$this->request->input('other_id');
     	$type=$this->request->input('type');
     	$page=$this->request->input('page');
     	$pagenum=$this->request->input('pagenum');
        
        if($type==1){
        	$list=$this->Chat->getchat_list($user_id,$other_id,$page,$pagenum);
        }else if($type==2){
        	$list=$this->ChatGroup->get_group_chat($user_id,$other_id,$page,$pagenum);
        }
        
     	return json_encode($list);
    }	
     
     
     
    //更新用户消息状态
    public function update_chat_status(){
     	$friend_id=$this->request->input('friend_id');
     	$other_id=$this->request->input('other_id');
     	$id=$this->request->input('id');
     	$type=$this->request->input('type');
     	if($type==1){
        	$result=$this->Chat->update_chat($friend_id,$other_id,$id);
       }else if($type==2){
        	$result=$this->ChatGroup->update_chat($friend_id,$other_id);
        }
       
        
     	return $result;
    }	
     
    //更新用户语音消息状态
    public function update_audio_read(){
     	$id=$this->request->input('id');
     	$user_id=$this->request->input('user_id');
     	$fid=$this->request->input('fid');
     	$type=$this->request->input('type');
     	if($type==1){
        	$result=$this->Chat->update_audio_status($id,$user_id,$fid);
        }else if($type==2){
        	$result=$this->ChatGroup->update_audio_status($id,$user_id,$fid);
        }
        
        
     	return $result;
    }	
}

<?php

declare (strict_types=1);
namespace App\Model;
use Hyperf\DbConnection\Db;
use App\Model\User as User;
/**
 * @property int $id 
 * @property int $user_id 
 * @property int $friend_id 
 * @property string $user_group 
 * @property string $friend_group 
 */
class Friend extends BaseModel
{  
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'friend';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['id','user_id','friend_id','user_group','friend_group','last_send_time'];
    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = ['id' => 'integer', 'user_id' => 'integer', 'friend_id' => 'integer','last_send_time' => 'integer'];
    
    
    //$created_at和$updated_at格式为时间戳
    protected $dateFormat = 'U';
    
    //查询好友列表
     public function get_friend_list($user_id){
		$result = Db::select('select * from friend where  user_id="'.$user_id.'" or friend_id="'.$user_id.'";');
        $list = object_array($result); 
        
        $friend_ids=array();
    	$friend_last_time=array();
    	
    	foreach($list as $k=>$v){
    		if($v['user_id']==$user_id){
    			$friend_ids[]=$v['friend_id'];
    			$friend_last_time[$v['friend_id']]['last_send_time']=$v['last_send_time'];
    			$friend_last_time[$v['friend_id']]['created_at']=$v['created_at'];
    		}else if($v['friend_id']==$user_id){
    			$friend_ids[]=$v['user_id'];
    			$friend_last_time[$v['user_id']]['last_send_time']=$v['last_send_time'];
    			$friend_last_time[$v['user_id']]['created_at']=$v['created_at'];
    		}
    	}
    	
    	$User=new User;
    	$friend_list_cache=$User->findManyFromCache($friend_ids);
    	if(isset($friend_list_cache) && $friend_list_cache){
    		$friend_list_cache=$friend_list_cache->toArray();
    		$friend_list=[];
    		foreach($friend_list_cache as $k=>$v){
    			$friend_list[$k]['id']=$v['id'];
    			$friend_list[$k]['name']=$v['name'];
    			$friend_list[$k]['avatar']=$v['avatar'];
    		}	
    	}else{
    		if(count($friend_ids)>0){
    			$friend_list=Db::table('user')->select('id','name','avatar')->whereIn('id',$friend_ids)->get();
    			$friend_list=$friend_list->toArray();    			
    		}else{
    			$friend_list=[];
    		}
    		
    	}

    	foreach($friend_list as $k=>$v){
    		$friend_list[$k]['last_send_time']=$friend_last_time[$v['id']]['last_send_time'];
    		$friend_list[$k]['time']=$friend_last_time[$v['id']]['created_at'];
    		$friend_list[$k]['type']=1;  //好友
    		$count=object_array(Db::select('select count(*) as count from chat where tid="'.$user_id.'" and fid ="'.$v['id'].'" and is_read =0;'));
    		$friend_list[$k]['count']=$count[0]['count'];
    	}
           

    	return $friend_list;
     }
     
     //查询推荐好友
     public function get_recommend_friend($user_id){
		$result = Db::select('select * from friend where  user_id="'.$user_id.'" or friend_id="'.$user_id.'"');
        $list = object_array($result); 
        
        $friend_ids=array();
        $friend_ids[]=$user_id;
    	foreach($list as $k=>$v){
    		if($v['user_id']==$user_id){
    			$friend_ids[]=$v['friend_id'];	
    		}else if($v['friend_id']==$user_id){
    			$friend_ids[]=$v['user_id'];
    		}
    	}
    	
    	
    	$User=new User;
		if(count($friend_ids)>0){
			$friend_list=Db::table('user')->select('id','name','avatar')->whereNotIn('id',$friend_ids)->limit(9)->get();
			$friend_list=$friend_list->toArray();;    			
		}else{
			$friend_list=[];
		}
    	return $friend_list;
     }
     
     //搜索好友
     public function get_recommend_search($user_id,$keyword){        
        $where['id']=array('<>',$user_id);
        $where['name']=array("like","%$keyword%");
        $User=new User;
        $list=$User->getInfoByWhere($where,'id,name,avatar','','9');
        $ids=$this->get_friend_ids_self($user_id);
        foreach($list as $k=>$v){
        	if(in_array($v['id'],$ids)){
        		unset($list[$k]);
        	}else{
        		$list[$k]['type']=1;
        	}
        	
        }
        
        $re = Db::select('select group_id from group_user where user_id ="'.$user_id.'" group by group_id');
        $group_id = object_array($re);
        
        $result = Db::select('select id,group_name from group_list where group_name like "%'.$keyword.'%" ');
        $group_list = object_array($result); 
        if(isset($group_id) && $group_id){
        	foreach($group_id as $k=>$v){
        		$group_ids[]=$v['group_id'];
        	}
        	
        	foreach($group_list as $k=>$v){
        		if(in_array($v['id'],$group_ids)){
        			unset($group_list[$k]);
        		}else{
        			$user_list=object_array(Db::select('select group_user.group_id,group_user.user_id,user.name,user.avatar  from group_user,user where group_id="'.$v['id'].'" and group_user.user_id=user.id limit 4;'));          
		            $group_list[$k]['user_list']=$user_list;
		            $group_list[$k]['type']=2;  //群聊
        		}
	        } 
        }else{
        	foreach($group_list as $k=>$v){
	        	$user_list=object_array(Db::select('select group_user.group_id,group_user.user_id,user.name,user.avatar  from group_user,user where group_id="'.$v['id'].'" and group_user.user_id=user.id limit 4;'));          
	            $group_list[$k]['user_list']=$user_list;
	            $group_list[$k]['type']=2;  //群聊
	        } 
        }	
           
        $result=array_slice(array_merge($list,$group_list),0,9);
        
        return $result;
     }
     
     
     //查询好友ID列表
     public function get_friend_ids_self($user_id){
		$result = Db::select('select * from friend where  user_id="'.$user_id.'" or friend_id="'.$user_id.'";');
        $list = object_array($result); 
        
        $friend_ids=array();

    	foreach($list as $k=>$v){
    		if($v['user_id']==$user_id){
    			$friend_ids[]=$v['friend_id'];   		
    		}else if($v['friend_id']==$user_id){
    			$friend_ids[]=$v['user_id'];  			
    		}
    	}

    	return $friend_ids;
     }
     
     
     //添加好友
     public function recommend_friend_add($user_id,$recommend_friend_id){
     	$result = Db::select('select * from friend where  (user_id="'.$user_id.'" and friend_id="'.$recommend_friend_id.'") or (user_id="'.$recommend_friend_id.'" and friend_id="'.$user_id.'")  ;');
        $result = object_array($result); 
        
        if($result){
        	$data['code']=false;
        	$data['msg']="你们已经是好友了";
        }else{
        	$content['user_id']=$user_id;
        	$content['friend_id']=$recommend_friend_id;
        	$content['user_group']='好友';
        	$content['friend_group']='好友';
        	$content['last_send_time']=0;
        	$id=self::saveInfo($content);
        	if($id){
        		$data['code']=true;
        	    $data['msg']="添加好友成功";
        	    $data['time']=time();
        	}else{
        		$data['code']=false;
        	    $data['msg']="添加好友失败";
        	}
        }
        
        return $data; 
     }	
     
      //更新好友发送消息最后时间
     public function update_friend_send($user_id,$other_id){
     	$channel = new \Swoole\Coroutine\Channel();
    	go(function()use($user_id,$other_id,$channel){
    		$result = Db::select('update friend set  last_send_time='.time().' where (user_id="'.$user_id.'" and friend_id="'.$other_id.'") or (user_id="'.$other_id.'" and friend_id="'.$user_id.'") ;');
		    
    	    $channel->push($result);
    	});
    	
    	$result = $channel->pop();
    	return $result;
    }	
}
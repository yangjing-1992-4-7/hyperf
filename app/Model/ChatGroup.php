<?php

declare (strict_types=1);
namespace App\Model;
use Hyperf\DbConnection\Db;
use App\Model\MyGroupChat as MyGroupChat;
/**
 * @property int $id 
 * @property int $group_id 
 * @property int $user_id 
 * @property string $message 
 * @property int $type 
 * @property string $is_read 
 * @property \Carbon\Carbon $created_at 
 * @property \Carbon\Carbon $updated_at 
 */
class ChatGroup extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'chat_group';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['id','group_id','user_id','message','length','audio_read','type','created_at','updated_at'];
    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = ['id' => 'integer', 'group_id' => 'integer', 'user_id' => 'integer', 'type' => 'integer','length'=> 'integer', 'created_at' => 'integer', 'updated_at' => 'integer'];

    //$created_at和$updated_at格式为时间戳
    protected $dateFormat = 'U';
    
    
    //获取群聊记录
    public function  get_group_chat($user_id,$group_id,$page,$pagenum){
	    $list = Db::select('select user.name,user.avatar,chat_group.message,chat_group.type,chat_group.audio_read,chat_group.length,chat_group.id,chat_group.created_at,chat_group.user_id,chat_group.group_id from chat_group,user where chat_group.group_id="'.$group_id.'" and chat_group.user_id=user.id    order by created_at desc limit '.($page-1)*$pagenum.','.($pagenum+1).';');	   
	    $list = object_array($list);  
	    	    
	    if(isset($list[$pagenum])){
		    $more='has_more';
    	}else{
    		$more='no_more';
        }
        $list=array_slice($list,0,$pagenum);

        $result['more']=$more;
        $result['list']=$list;
    	

    	
        return $result;
    }
      
    //更新消息状态为已读
     public function update_chat($friend_id,$other_id){     	
		$group_id=str_replace("group_","",$other_id);
	
		$where['group_id']=$group_id;
		$last_chat= self::getInfoByWhere($where,'*','created_at desc','1');
 
		if($last_chat){
			$data['user_id']=$friend_id;
		$data['group_id']=$group_id;
		$MyGroupChat=new MyGroupChat;
		$my_chat= $MyGroupChat->getInfoByWhere($data);

		if($my_chat){
			$data['id']=$my_chat[0]['id'];
		}
		
		$data['last_message_id']=$last_chat[0]['id'];
		$result= $MyGroupChat->saveInfo($data);
		}else{
			$result=true;
		}
    	
    	return $result;
     }
     
     //更新语音消息状态为已读
     public function update_audio_status($id,$user_id,$fid){
     	$chat=self::getInfo($id,false);
		if($chat){
			if($chat['user_id']==$fid){
				if($chat['user_id']!=$user_id){
					if(!$chat['audio_read']){
						$array=array();
						$array[]=$user_id;
						$data['audio_read']=implode(",",$array);
						$data['id']=$id;
						$res=self::saveInfo($data);
						if($res){
							$result['code']=true;
						}else{
							$result['code']=false;
				            $result['message']='更新消息已读失败';
						}
					}else{						
						$array=explode(",",$chat['audio_read']);
						if(in_array($user_id,$array)){
							$result['code']=true;
						}else{
							$array[]=$user_id;
							$data['audio_read']=implode(",",$array);
							$data['id']=$id;
							$res=self::saveInfo($data);
							if($res){
								$result['code']=true;
							}else{
								$result['code']=false;
					            $result['message']='更新消息已读失败';
							}
						}
					}
				}else{
					$result['code']=true;
				}
			}else{
				$result['code']=false;
			    $result['message']='消息错误';
			}		
		}else{
			$result['code']=false;
			$result['message']='消息不存在';
		}
		
    	return $result;
     }
}
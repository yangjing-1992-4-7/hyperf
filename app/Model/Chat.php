<?php

declare (strict_types=1);
namespace App\Model;
use Hyperf\DbConnection\Db;
use App\Model\User as User;

/**
 * @property int $id 
 * @property int $fid 
 * @property int $tid 
 * @property string $message 
 * @property int $created_at 
 * @property \Carbon\Carbon $updated_at 
 */
class Chat extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'chat';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
     protected $fillable = ['id','fid','tid','message','length','type','audio_read','is_read','created_at','updated_at'];
    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = ['id' => 'integer', 'fid' => 'integer', 'tid' => 'integer','type'=>'integer','length'=> 'integer','created_at' => 'integer', 'updated_at' => 'datetime'];
    
    //$created_at和$updated_at格式为时间戳
    protected $dateFormat = 'U';
    
    //获取群聊天记录
    public function  getchat_list($user_id,$other_id,$page,$pagenum){
	    $list = Db::select('select * from chat where (fid="'.$user_id.'" and tid="'.$other_id.'") or (tid="'.$user_id.'" and fid="'.$other_id.'") order by created_at desc limit '.($page-1)*$pagenum.','.($pagenum+1).';');
	   
	    $list = object_array($list);  
    	  
	    $this->User=new User;
    	$user=$this->User->getInfo($user_id);
    	if(isset($list[$pagenum])){
    		$more='has_more';
    	}else{
    		$more='no_more';
    	}
    	
    	$list=array_slice($list,0,$pagenum);
        foreach($list as $k=>$v){
        	if($v['fid']==$user_id){
        		$list[$k]['avatar']=$user['avatar'];
        		$list[$k]['name']=$user['name'];
        	}else{
        		$friend=$this->User->getInfo($v['fid']);
        		$list[$k]['avatar']=$friend['avatar'];
        		$list[$k]['name']=$friend['name'];
        	}
        }
        
        $result['more']=$more;
        $result['list']=$list;
        return $result;
    }
    
    
    //更新消息状态为已读
     public function update_chat($friend_id,$other_id,$id){
		if($id){
			$result = Db::select('update chat set is_read="1"  where id="'.$id.'" ;'); 			
		}else{
			$result = Db::select('update chat set is_read="1"  where (fid="'.$friend_id.'" and tid="'.$other_id.'") or (tid="'.$friend_id.'" and fid="'.$other_id.'") ;');
		    
		}
    	return $result;
     }
     
     //更新语音消息状态为已读
     public function update_audio_status($id,$user_id,$fid){
     	$chat=self::getInfo($id);
		if($chat){
			if($chat['tid']==$user_id){
				if(!$chat['audio_read']){
					$data['id']=$id;
					$data['audio_read']="1";
					$res=self::saveInfo($data);
					if($res){
						$result['code']=true;
					}else{
						$result['code']=false;
			            $result['message']='更新消息已读失败';
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
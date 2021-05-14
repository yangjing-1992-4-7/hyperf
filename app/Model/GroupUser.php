<?php

declare (strict_types=1);
namespace App\Model;
use Hyperf\DbConnection\Db;
/**
 * @property int $id 
 * @property int $group_id 
 * @property int $user_id 
 * @property \Carbon\Carbon $created_at 
 * @property \Carbon\Carbon $updated_at 
 */
class GroupUser extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'group_user';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['id','group_id','user_id','created_at','updated_at'];
    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = ['id' => 'integer', 'group_id' => 'integer', 'user_id' => 'integer', 'created_at' => 'integer', 'updated_at' => 'integer'];

    //$created_at和$updated_at格式为时间戳
    protected $dateFormat = 'U';
    
    //添加群聊
     public function recommend_friend_add($user_id,$recommend_friend_id){
     	$where['group_id']=$recommend_friend_id;
     	$where['user_id']=$user_id;
     	$$result=self::getInfoByWhere($where);
     	
        if($result){
        	$data['code']=false;
        	$data['msg']="你已经加入此群聊了";
        }else{
        	$content['user_id']=$user_id;
        	$content['group_id']=$recommend_friend_id;
        	$id=self::saveInfo($content);
        	if($id){
        		$data['code']=true;
        	    $data['msg']="添加群聊成功";
        	    $data['time']=time(); 
        	    $user_list=object_array(Db::select('select group_user.group_id,group_user.user_id,user.name,user.avatar  from group_user,user where group_id="'.$recommend_friend_id.'" and group_user.user_id=user.id limit 4;'));
	            $map['group_id']=$recommend_friend_id;
	            $data['group_user_number']=self::getCount($map);
	            $data['user_list']=$user_list;
        	    
        	}else{
        		$data['code']=false;
        	    $data['msg']="添加群聊失败";
        	}
        }
        
        return $data; 
     }
}
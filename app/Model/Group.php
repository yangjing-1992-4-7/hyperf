<?php

declare (strict_types=1);
namespace App\Model;
use Hyperf\DbConnection\Db;
/**
 * @property int $id 
 * @property string $group_userids 
 * @property \Carbon\Carbon $created_at 
 * @property \Carbon\Carbon $updated_at 
 */
class Group extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'group';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */ 
    protected $fillable = ['id','group_name','created_at','updated_at','last_send_time'];
    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = ['id' => 'integer', 'created_at' => 'integer', 'updated_at' => 'integer'];
    
    //$created_at和$updated_at格式为时间戳
    protected $dateFormat = 'U';
    
    //查询群聊列表
     public function get_group_list($user_id){
		$result = Db::select('select group_user.group_id,g.group_name,g.last_send_time from group_user,group as g  where user_id="'.$user_id.'" and g.id=group_user.group_id   group by group_id;');
	      		
        $list = object_array($result);
        foreach($list as $k=>$v){
        	$user_list=object_array(Db::select('select group_user.group_id,group_user.user_id,user.name,user.avatar  from group_user,user where group_id="'.$v['group_id'].'" and group_user.user_id=user.id;'));
            $list[$k]['group_user_number']=count($user_list); 
            $list[$k]['user_list']=$user_list;
            $list[$k]['type']=2;  //群聊
        }
              
    	return $list;
     }
}
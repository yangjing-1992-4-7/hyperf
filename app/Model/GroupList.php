<?php

declare (strict_types=1);
namespace App\Model;
use Hyperf\DbConnection\Db;
use App\Model\MyGroupChat as MyGroupChat;
use App\Model\ChatGroup as ChatGroup;
use App\Model\GroupUser as GroupUser;
/**
 * @property int $id 
 * @property string $group_userids 
 * @property \Carbon\Carbon $created_at 
 * @property \Carbon\Carbon $updated_at 
 */
class GroupList extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'group_list';
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
    
    //查询好友列表
     public function get_group_list($user_id){
     	$GroupUser=new GroupUser;  
     	$MyGroupChat=new MyGroupChat;
        $ChatGroup=new ChatGroup;
		$result = Db::select('select group_user.group_id,group_list.group_name,group_list.last_send_time from group_user,group_list  where user_id="'.$user_id.'" and group_list.id=group_user.group_id   group by group_id order by group_list.created_at desc;');
	      		
        $list = object_array($result);
        foreach($list as $k=>$v){
        	$user_list=object_array(Db::select('select group_user.group_id,group_user.user_id,user.name,user.avatar  from group_user,user where group_id="'.$v['group_id'].'" and group_user.user_id=user.id limit 4;'));
            $where['group_id']=$v['group_id'];
            $list[$k]['group_user_number']=$GroupUser->getCount($where);
            $list[$k]['user_list']=$user_list;
            $list[$k]['type']=2;  //群聊
            
            $where['user_id']=$user_id;
            $where['group_id']=$v['group_id'];
            
            $my=$MyGroupChat->getInfoByWhere($where);
            unset($where['user_id']);
            if($my){                	
            	$where['id']=array('>',$my[0]['last_message_id']);
                $result=$ChatGroup->getInfoByWhere($where);
            }else{
            	$where['id']=array('>',0);
            	$result=$ChatGroup->getInfoByWhere($where);
            }
            $list[$k]['count']=count($result);
        }
              
    	return $list;
     }
}
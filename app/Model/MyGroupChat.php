<?php

declare (strict_types=1);
namespace App\Model;

/**
 * @property int $id 
 * @property int $user_id 
 * @property int $group_id 
 * @property int $last_message_id 
 * @property \Carbon\Carbon $created_at 
 * @property \Carbon\Carbon $updated_at 
 */
class MyGroupChat extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'my_group_chat';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['id','user_id','group_id','last_message_id','created_at','updated_at'];
    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = ['id' => 'integer', 'user_id' => 'integer', 'group_id' => 'integer', 'last_message_id' => 'integer', 'created_at' => 'integer', 'updated_at' => 'integer'];

     //$created_at和$updated_at格式为时间戳
    protected $dateFormat = 'U';
    
    public function update_last_send($data){
		$where['group_id']=$data['group_id'];
		$where['user_id']=$data['user_id'];
		$my_chat= self::getInfoByWhere($where);

		if($my_chat){
			$data['id']=$my_chat[0]['id'];
		}
		
		$result= self::saveInfo($data);
    	
    		
    	return $result;	
    }
}
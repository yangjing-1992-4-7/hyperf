<?php

declare (strict_types=1);
namespace App\Model;

/**
 * @property int $id 
 * @property string $name 
 * @property \Carbon\Carbon $created_at 
 * @property \Carbon\Carbon $updated_at 
 */  
class User extends BaseModel
{   

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'user';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['id','name','username','password','encrypt','avatar','last_login_time','last_login_ip','created_at','updated_at'];
    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = ['id' => 'integer', 'name'=>'varchar', 'avatar'=>'varchar','created_at' => 'datetime', 'updated_at' => 'datetime'];
    
    //$create_at和$updated_at格式为时间戳
    protected $dateFormat = 'U';
    
    
    public function login($username = '', $password = ''){
        $username = trim($username);
        $password = trim($password);
                    
        $userInfo = self::getInfoByWhere(['username'=>$username]);
        
        if (!$userInfo) {
        	$data['code']=false;
        	$data['msg']='没有此用户';
        }else{
        	if($userInfo[0]['password']==encrypt_password($password,$userInfo[0]['encrypt'])){
        		$data = [
		            'uid' => $userInfo[0]['id'],
		            'name' => $userInfo[0]['name'],
		            'avatar' =>$userInfo[0]['avatar'],
		            'last_login_time' => $userInfo[0]['last_login_time'],
		            'code'  =>true,
		        ];
        	}else{
        		$data['code']=false;
        	    $data['msg']='密码不正确';
        	}
        }
        return $data;
    }
    
     public function reg($username = '', $password = '',$ip=''){
        $username = trim($username);
        $password = trim($password);
        
        $userInfo = self::getInfoByWhere(['username'=>$username]);
        
        if ($userInfo) {
            $data['code']=false;
        	$data['msg']='用户名已存在';
        }else{
        	$pwd=encrypt_password($password);
        	$user['name']="用户".$username;
        	$user['avatar']=config('avatar_default_img');
        	$user['username']=$username;
        	$user['password']=$pwd['password'];
        	$user['encrypt']=$pwd['encrypt'];
        	$user['last_login_time']=time();
         	$user['last_login_ip']=$ip;
        	$id=self::saveInfo($user);
        	$data = [
	            'uid' => $id,
	            'name' => $user['name'],
	            'avatar' =>$user['avatar'],
	            'last_login_time' => $user['last_login_time'],
	            'code'  =>true,
	        ];
        }
        
        return $data;
    }
}
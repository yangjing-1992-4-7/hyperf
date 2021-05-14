<?php

use Hyperf\Utils\ApplicationContext;
use Hyperf\HttpServer\Contract\RequestInterface;



//去除websocket缓存
function redis_sock_init(){
	$container = ApplicationContext::getContainer();
    $redis = $container->get(\Redis::class);
    $redis->set('socket','');
    $redis->set('socket_friendlist','');
    $redis->set('fd','');
    return true; 
}

//设置websocket信息
function socket_set($data,$key,$value){
	$container = ApplicationContext::getContainer();
    $redis = $container->get(\Redis::class);
    $socket=$redis->get($data);
    $socket_list=json_decode($socket,true);
    if(!$socket_list){
    	$socket_list=array();
    }
    $socket_list[$key]=$value;
    $redis->set($data,json_encode($socket_list));    
}


//读取websocket信息
function socket_get($data,$key){
	$container = ApplicationContext::getContainer();
    $redis = $container->get(\Redis::class);
 	
	$data=$redis->get($data);
	if($data){
		$da=json_decode($data,true);
		if(!empty($da)){
			if(isset($da[$key])){
				return $da[$key];
			}else{
			    return "";		
			}
		}else{
		    return "";	
		}
	}else{
		return "";
	}
     
}


//设置redis信息
function redis_set($key,$data){
	$container = ApplicationContext::getContainer();
    $redis = $container->get(\Redis::class);
    if(is_array($data)){
    	$redis->set($key,json_encode($data));
    	return true;
    }else{
    	$redis->set($key,$data);
    	return true;
    }     
}



//读取redis信息
function redis_get($key){
	$container = ApplicationContext::getContainer();
    $redis = $container->get(\Redis::class);
    
    if($key=="*"){
    	return $redis->keys('*');
    }else{  	
    	$data=$redis->get($key);
    	if($data){
    		$da=json_decode($data,true);
    		if(is_array($da)&&!empty($da)){
    			 return $da;
    		}else{
    			 return $data;
    		}
           

    	}else{
    		return "";
    	}
    }      
}


//kafka生产信息
function send($message, $tp = 'test'){
	if(is_array($message)){
    	$message=json_encode($message);
    }
	   
	$brokerList = '127.0.0.1:9092';
    $conf = new \RdKafka\Conf();
    $conf->set('metadata.broker.list', $brokerList);
    $producer = new \RdKafka\Producer($conf);
    
    $topic = $producer->newTopic($tp);
    
    $re=$topic->produce(RD_KAFKA_PARTITION_UA, 0, json_encode($message));
  
    $producer->poll(0);
    $result = $producer->flush(100);
    if (RD_KAFKA_RESP_ERR_NO_ERROR !== $result) {
    	return false;
//      throw new \RuntimeException('Was unable to flush, messages might be lost!');
    }else{
    	return true;
    }
}

//kafka消费信息
function consumer($tp="test"){
	$brokerList = '127.0.0.1:9092';
    $conf = new \RdKafka\Conf();
    $conf->set('group.id', $tp);
    $rk = new \RdKafka\Consumer($conf);
    $rk->addBrokers("127.0.0.1");
    $topicConf = new \RdKafka\TopicConf();
    $topicConf->set('auto.commit.interval.ms', 50);
    $topicConf->set('offset.store.method', 'broker');
    $topicConf->set('auto.offset.reset', 'smallest');
    $topic = $rk->newTopic($tp, $topicConf);
    $topic->consumeStart(0, RD_KAFKA_OFFSET_STORED);
    $message = $topic->consume(0, 1000);
    if($message==null) {
       return false;
    }else{
    	switch ($message->err) {
	        case RD_KAFKA_RESP_ERR_NO_ERROR:
	            return    json_decode($message->payload,true);     
	            break;
	        case RD_KAFKA_RESP_ERR__PARTITION_EOF:
	           //没有数据了
	           return false;
	           break;
	        case RD_KAFKA_RESP_ERR__TIMED_OUT:
	           //超时
	           return false;
	           break; 
	        default:
	           //"kafka服务未开启"
	           return false;
	           break;
	    }
    }
}

//将字符传化成GBK编码
function encoding($str){
	if(is_string ($str)){
    	$encode = mb_detect_encoding($str, array("ASCII",'UTF-8',"GB2312","GBK",'BIG5')); 
        return  mb_convert_encoding($str, 'GBK', $encode);
    }else{
    	return $str;
    }
	
}

//按数组中的某一个字段排序
function array_sort($array,$keys,$type='asc'){
	//$array为要排序的数组,$keys为要用来排序的键名,$type默认为升序排序
	$keysvalue = $new_array = array();	
	foreach ($array as $k=>$v){	
	   $keysvalue[$k] = $v[$keys];	
	}
	
	if($type == 'asc'){	
	   asort($keysvalue);	
	}else{
	   arsort($keysvalue);	
	}
	
	reset($keysvalue);
		
	foreach ($keysvalue as $k=>$v){	
	   $new_array[$k] = $array[$k];	
	}
	
	return array_values($new_array);
}

//对象转化成数组
function object_array($array){
   if(is_object($array)){
    $array = (array)$array;
   }
   if(is_array($array)){
    foreach($array as $key=>$value){
     $array[$key] = object_array($value);
    }
   }
   return $array;
}


//验证登录
function check_login($request,$response){
	if(!$request->cookie('user')){
		if($request->header("X-Requested-With")=="XMLHttpRequest"){
			$ajax_message['code']=false;
			$ajax_message['message']="请先登录";
			return json_encode($ajax_message);
		}else{
			return $response->redirect('/login');
		}   
	}else{
		return 'on';
	}
}


/**
 * 对用户的密码进行加密
 * @param $password
 * @param $encrypt //传入加密串，在修改密码时做认证
 * @return array/password
 */
function encrypt_password($password, $encrypt = '')
{
    $pwd = array();
    $pwd['encrypt'] = $encrypt ? $encrypt : genRandomString();
    $pwd['password'] = md5(trim($password) . $pwd['encrypt']);
    return $encrypt ? $pwd['password'] : $pwd;
}

/**
 * 产生一个指定长度的随机字符串,并返回给用户
 * @param type $len 产生字符串的长度
 * @return string 随机字符串
 */
function genRandomString($len = 6){
    $chars = array(
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k",
        "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v",
        "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G",
        "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R",
        "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2",
        "3", "4", "5", "6", "7", "8", "9",
    );
    $charsLen = count($chars) - 1;
    // 将数组打乱
    shuffle($chars);
    $output = "";
    for ($i = 0; $i < $len; $i++) {
        $output .= $chars[mt_rand(0, $charsLen)];
    }
    return $output;
}



/**
 * 获取客户端ip地址
 * @return mixed
 */
function get_ip($request){
    $res = $request->getServerParams();
    if(isset($res['http_client_ip'])){
        return $res['http_client_ip'];
    }elseif(isset($res['http_x_real_ip'])){
        return $res['http_x_real_ip'];
    }elseif(isset($res['http_x_forwarded_for'])){
        //部分CDN会获取多层代理IP，所以转成数组取第一个值
        $arr = explode(',',$res['http_x_forwarded_for']);
        return $arr[0];
    }else{
        return $res['remote_addr'];
    }
}


?>

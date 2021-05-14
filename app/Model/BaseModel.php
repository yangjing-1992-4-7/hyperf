<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://doc.hyperf.io
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf-cloud/hyperf/blob/master/LICENSE
 */

namespace App\Model;

use Hyperf\DbConnection\Model\Model;
use Hyperf\ModelCache\Cacheable;
use Hyperf\ModelCache\CacheableInterface;

abstract class BaseModel extends Model implements CacheableInterface
{
    use Cacheable;
    
    /**
     * getInfo
     * 通过主键id/ids获取信息
     * @param $id
     * @param bool $useCache 是否使用模型缓存
     * @return BaseModel|\Hyperf\Database\Model\Model|null
     */
    public function getInfo($id,$useCache = true){   
//      $channel = new \Swoole\Coroutine\Channel();
//  	go(function()use($id,$useCache,$channel){
        $instance = make(get_called_class());
        if ($useCache === true) {
            $modelCache = is_array($id)?$instance->findManyFromCache($id):$instance->findFromCache($id);
            $query=isset($modelCache) && $modelCache ? $modelCache->toArray() : [];
        }else{
        	$query = $instance->query()->find($id);
            $query=$query ? $query->toArray() : [];
        }

//	        $channel->push($query);
//     });
       
//     $query = $channel->pop();
       return $query;
    }

    /**
     * saveInfo
     * 创建/修改记录
     * @param $data 保存数据
     * @param bool $type 是否强制写入，适用于主键是规则生成情况
     * @return null
     */
    public function saveInfo($data){     
        $id = null;
        $instance = make(get_called_class());
        if (isset($data['id']) && $data['id']) {
            $id = $data['id'];
            unset($data['id']);
            $query = $instance->query()->find($id);
            if($query){
            	foreach ($data as $k => $v) {
	                $query->$k = $v;
	            }
	            $result=$query->save();
	         
            }else{
            	$result=false;
            	
            }
        
            
        } else {
            foreach ($data as $k => $v) {
                if ($k === 'id') {
                    $id = $v;
                }
                $instance->$k = $v;
            }
            $instance->save();
            if (!$id) {
                $result = $instance->id;
            }
      
        }

       return $result;
    }
    
    public function updateByWhere($where=[],$update=[]){
		$instance = make(get_called_class());
        foreach ($where as $k => $v) {
        	if(strstr($k, '|')){
        		$w=explode('|',$k);
        		$val=$v;        		
        	    if($w[1]){
        	    	$instance= is_array($v)?$instance->where(function ($query) {
        	    		    foreach($w as $key=>$val){
        	    		    	if($key==0){
        	    		    		 $query->where($val, $v[0],$v[1]);
        	    		    	}else if(($key==count($w)-1)&&$key!=0){
        	    		    		 $query->orWhere($val, $v[0],$v[1]);
        	    		    	}
        	    		    }						       
					    }):$instance->where(function ($query) {
        	    		    foreach($w as $key=>$val){
        	    		    	if($key==0){
        	    		    		 $query->where($val, $v);
        	    		    	}else if(($key==count($w)-1)&&$key!=0){
        	    		    		 $query->orWhere($val, $v);
        	    		    	}
        	    		    }						       
					    });
        	    }
        	    
        	}else{
        		$instance = is_array($v)?$instance->where($k,$v[0],$v[1]):$instance->where($k,$v);
        	}
        }
		
		$result=$instance->update($update);
    		
        return $result ? $result:0;
    }
    
    
    /**
     * getInfoByWhere
     * 根据条件获取结果
     * @param $where
     * @param bool $type 是否查询多条
     * @return array
     */
    public function getInfoByWhere($where=[],$field='*',$orderby='',$limit=''){   
		$instance = make(get_called_class());
        foreach ($where as $k => $v) {
        	if(strstr($k, '|')){
        		$w=explode('|',$k);
        		$val=$v;        		
        	    if($w[1]){
        	    	$instance= is_array($v)?$instance->where(function ($query) {
        	    		    foreach($w as $key=>$val){
        	    		    	if($key==0){
        	    		    		 $query->where($val, $v[0],$v[1]);
        	    		    	}else if(($key==count($w)-1)&&$key!=0){
        	    		    		 $query->orWhere($val, $v[0],$v[1]);
        	    		    	}
        	    		    }						       
					    }):$instance->where(function ($query) {
        	    		    foreach($w as $key=>$val){
        	    		    	if($key==0){
        	    		    		 $query->where($val, $v);
        	    		    	}else if(($key==count($w)-1)&&$key!=0){
        	    		    		 $query->orWhere($val, $v);
        	    		    	}
        	    		    }						       
					    });
        	    }
        	    
        	}else{
        		$instance = is_array($v)?$instance->where($k,$v[0],$v[1]):$instance->where($k,$v);
        	}
        }
        
        if($orderby){
        	$order_list=explode(',',$orderby);
        	if(isset($order_list[1])){
        		foreach($order_list as $k=>$v){
        			$order=explode(' ',$v);
		        	if(isset($order[1])){
		        		 $instance =$instance->orderBy($order[0],$order[1]);
		        	}else{
		        		 $instance =$instance->orderBy($order[0],'asc');
		        	}
        		}
        	}else{
        		$order=explode(' ',$orderby);
	        	if(isset($order[1])){
	        		 $instance =$instance->orderBy($order[0],$order[1]);
	        	}else{
	        		 $instance =$instance->orderBy($order[0],'asc');
	        	}
        	} 
        }else{
        	 $instance =$instance->orderBy('id','asc');
        }
        
        
        if($limit){
        	$limit=strval($limit);
        	$limits=explode(',',$limit);
        	if(isset($limits[1])){
        		$instance =$instance->offset($limits[0])->limit($limits[1]);
        	}else{
        		$instance =$instance->limit($limit);
        	}
        }
        

        if($field!='*'&&$field){       	
      	    $fields=explode(',',$field);     	        	
            $instance1=$instance->select($fields)->get();        	
        	$result=$instance1->toArray();
        }else{
        	$instance1=$instance->get();
        	$result=$instance1->toArray();
        }
	        
		   
        return $result ? $result:[];
    }
    
   
    
    
    /**
     * deleteInfo
     * 删除/恢复
     * @param $ids 删除的主键ids
     * @param string 删除delete/恢复restore
     * @return int
     */
    public function deleteInfo($ids, $type = 'delete') {
        $instance = make(get_called_class());
        if ($type == 'delete') {
        	$count=$instance->destroy($ids);
        } else {
            $count = 0;
            $ids = is_array($ids)?$ids:[$ids];
            foreach ($ids as $id) {
                if ($instance::onlyTrashed()->find($id)->restore()) {
                    ++$count;
                }
            }

        }
            
 
        return $count;
        
    }

    /**
     * getPagesInfo
     * 获取分页信息，适用于数据量小
     * 数据量过大，可以采用服务层调用，加入缓存
     * @param $where
     * @return array
     */
    public function getPagesInfo($where = []){   
        $pageSize = 10;
        $currentPage = 1;
        if (isset($where['page_size'])) {
            $pageSize = $where['page_size']>0?$where['page_size']:10;
            unset($where['page_size']);
        }
        if (isset($where['current_page'])) {
            $currentPage = $where['current_page']>0?$where['current_page']:1;
            unset($where['current_page']);
        }

        $offset = ($currentPage-1)*$pageSize;

        $total = $this->getCount($where);

        $result=[
            'current_page' => (int)$currentPage,
            'offset' => (int)$offset,
            'page_size' => (int)$pageSize,
            'total' => (int)$total,
        ];
	 

        return $result;
    }

    /**
     * getCount
     * 根据条件获取总数
     * User：YM
     * Date：2020/2/4
     * Time：下午10:16
     * @param array $where
     * @return int
     */
    public function getCount($where = []){
        $instance = make(get_called_class());

        foreach ($where as $k => $v) {
        	if(strstr($k, '|')){
        		$w=explode('|',$k);
        		$val=$v;        		
        	    if($w[1]){
        	    	$instance= is_array($v)?$instance->where(function ($query) {
        	    		    foreach($w as $key=>$val){
        	    		    	if($key==0){
        	    		    		 $query->where($val, $v[0],$v[1]);
        	    		    	}else if(($key==count($w)-1)&&$key!=0){
        	    		    		 $query->orWhere($val, $v[0],$v[1]);
        	    		    	}
        	    		    }						       
					    }):$instance->where(function ($query) {
        	    		    foreach($w as $key=>$val){
        	    		    	if($key==0){
        	    		    		 $query->where($val, $v);
        	    		    	}else if(($key==count($w)-1)&&$key!=0){
        	    		    		 $query->orWhere($val, $v);
        	    		    	}
        	    		    }						       
					    });
        	    }
        	    
        	}else{
        		$instance = is_array($v)?$instance->where($k,$v[0],$v[1]):$instance->where($k,$v);
        	}
        }

        $count = $instance->count();
        $count= $count > 0 ? $count : 0;

        return $count;
    }
}

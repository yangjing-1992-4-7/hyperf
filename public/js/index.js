function setCookie(name,value,time=''){
	if(time==''){
		var oDate=new Date();
	    oDate.setDate(oDate.getDate());
	    document.cookie=name+"="+value+"; expires="+oDate.toDateString();
	}else{
		var exp  = new Date();  //获得当前时间
		exp.setTime(exp.getTime() + time*1000);  //换成毫秒
		document.cookie = name + "="+ value + ";expires=" + exp.toGMTString();
	}
}   
/**
 * [getCookie 获取cookie]
 */
function getCookie(key){
    var arr1=document.cookie.split("; ");//由于cookie是通过一个分号+空格的形式串联起来的，所以这里需要先按分号空格截断,变成[name=Jack,pwd=123456,age=22]数组类型；
    for(var i=0;i<arr1.length;i++){
        var arr2=arr1[i].split("=");//通过=截断，把name=Jack截断成[name,Jack]数组；
        if(arr2[0]==key){
        	if(key=='user'){
        		return  JSON.parse(decodeURI(arr2[1]));
        	}else{
        		return decodeURI(arr2[1]);
        	}
            
        }
    }
}
/**
 * [removeCookie 移除cookie]
 */
function removeCookie(key){
    setCookie(key,"",-1); // 把cookie设置为过期
};

var num=0;  //新消息数量
var lockReconnect = false;  //避免ws重复连接
var ws = null;          // 判断当前浏览器是否支持WebSocket
var wsUrl = "ws://192.168.2.65:9502/websocket";   //WebSocket服务器地址
var user_id=getCookie('user')['uid'];  //用户ID
var user_name=getCookie('user')['name'];  //用户昵称
var user_avatar=getCookie('user')['avatar'];  //用户头像
var friend_list=new Array();   //用户好友列表
var friend_id;   //当前聊天好友ID
var msgData={};  //发消息内容
var heart={};  //发送心跳
let CHAT_A;  //定时器
let CHAT_B;  //定时器
let WEBRTC_A;  //定时器
let WEBRTC_B;  //定时器
let WEBRTC_VIDEO_TIME;  //定时器
let leave_status=0;
var keyword='';  //搜索好友名称关键词  
var friend_page=new Array();//每个好友聊天记录显示页数
var chat_num=100;  //每次查询多少条聊天记录
var size=0;
// stun和turn服务器，打洞服务器设置
var iceServer = {
    "iceServers": [{
		'url': 'turn:192.168.2.65:3478',
		'credential': "123456",
		'username': "yangjing"
    }]
};
window.RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
let peerConnection=null;
var localStream = null;
var offerdesc = null;
var webrtc_friend_id=null;
var video_status=true;  //语音还是视频
let rec;  //语音输入
var door = false;   //是否在语音输入
var audio;

//表情选项
var smilies_array = new Array();
smilies_array = [
['1', ':amazed:', '1.gif','吃惊'], 
['2', ':sorry:', '2.gif','难过'], 
['3', ':love:', '3.gif','爱心'], 
['4', ':shyness:', '4.gif','害羞'], 
['5', ':handsome:', '5.gif','帅气'], 
['6', ':discharge:', '6.gif','放电'], 
['7', ':naughty:', '7.gif','调皮'], 
['8', ':doze:', '8.gif','瞌睡'], 
['9', ':cry:', '9.gif','哭泣'], 
['10', ':angry:', '10.gif','生气'], 
['11', ':furious:', '11.gif','怒'], 
['12', ':Insidious:', '12.gif','阴险'], 
['13', ':happy:', '13.gif','开心'], 
['14', ':smile:', '14.gif','微笑'], 
['15', ':unhappy:', '15.gif','不开心'], 
['16', ':cool:', '16.gif','酷'], 
['17', ':crazy:', '17.gif','抓狂'], 
['18', ':vomit:', '18.gif','呕吐'], 
['19', ':coverup:', '19.gif','捂嘴'], 
['20', ':lovely:', '20.gif','可爱'], 
['21', ':think:', '21.gif','思考'],
['22', ':curlup:', '22.gif','撇嘴'], 
['23', ':sarcastic:', '23.gif','抹嘴'], 
['24', ':asleep:', '24.gif','犯困'],
['25', ':anger:', '25.gif','怒火'], 
['26', ':sweating:', '26.gif','流汗'], 
['27', ':simple:', '27.gif','憨笑'], 
['28', ':cuckold:', '28.gif','绿帽'], 
['29', ':struggle:', '29.gif','奋斗'], 
['30', ':doubt:', '30.gif','疑惑'], 
['31', ':shock:', '31.gif','震惊'], 
['32', ':dizziness:', '32.gif','晕眩'], 
['33', ':charcoal:', '33.gif','黑炭'], 
['34', ':skeleton:', '34.gif','骷髅'],
['35', ':knock:', '35.gif','敲头'], 
['36', ':bye:', '36.gif','再见'],
];

$(document).ready(function(){
	create_chat_box();  //创建聊天框
	create_expression();  //添加表情选项
	get_friend_list(user_id);  //获取好友列表
	get_recommend_friend(user_id);  //获取推荐好友


	//发起聊天
	$(document).delegate(".myfriend,.group_chat","click",function(){
		$(".web_chat").show();
		if($(".chat_friend_"+$(this).attr("friend_id")).size()>0){
			$(".chat_friend_"+$(this).attr("friend_id")).show();
			$(".chat_friend_"+$(this).attr("friend_id")).addClass("active");
		    $(".chat_friend_"+$(this).attr("friend_id")).siblings().removeClass("active");
			$(".chat_box_all .chat_box").removeClass("show");		
			$(".chat_box_all .chat_box_"+$(this).attr("friend_id")).addClass("show");
			if($(".chat_friend_"+$(this).attr("friend_id")).children(".chat_num").size()>0){
				if(parseInt($(".chat_friend_"+$(this).attr("friend_id")).children(".chat_num").text())>0){
					$(".chat_box_all .chat_box_"+$(this).attr("friend_id")).scrollTop($(".chat_box_all .chat_box_"+$(this).attr("friend_id"))[0].scrollHeight);
				}
			}	
			
		}else{
			$(".chat_friend").removeClass("active");
			if($(this).hasClass("offline")){
				$(".chat_left_box").append('<div class="chat_friend active chat_friend_'+$(this).attr("friend_id")+' offline " friend_id="'+$(this).attr("friend_id")+'" friend_avatar="'+$(this).attr("friend_avatar")+'" >'
			    		+'<div class="friend_ava"><img src="'+$(this).attr("friend_avatar")+'"/></div>'
			    		+'<div class="chat_ft"><div class="friend_nickname"><span class="f_nickname">'+$(this).attr("friend_name")+'</span><span class="leave_status"></span></div><div class="online_status">离线</div></div><div class="chat_time">'+timetostring($(this).attr("last_send_time"))+'</div><div class="iconfont icon-guanbi"></div></div>');
			}else{
				if($(this).attr('type')==1){
					$(".chat_left_box").append('<div class="chat_friend active chat_friend_'+$(this).attr("friend_id")+'" friend_id="'+$(this).attr("friend_id")+'" friend_avatar="'+$(this).attr("friend_avatar")+'" >'
			    		+'<div class="friend_ava"><img src="'+$(this).attr("friend_avatar")+'"/></div>'
			    		+'<div class="chat_ft"><div class="friend_nickname"><span class="f_nickname">'+$(this).attr("friend_name")+'</span><span class="leave_status"></span></div><div class="online_status">在线</div></div><div class="chat_time">'+timetostring($(this).attr("last_send_time"))+'</div><div class="iconfont icon-guanbi"></div></div>');
				}else if($(this).attr('type')==2){
					$(".chat_left_box").append('<div class="chat_friend active chat_friend_'+$(this).attr("friend_id")+'" friend_id="'+$(this).attr("friend_id")+'" >'
			    		+'<div class="group_ava">'+$(this).find(".group_ava").html()+'</div>'
			    		+'<div class="chat_ft"><div class="group_name"><span class="f_nickname">'+$(this).attr("group_name")+'</span></div></div><div class="chat_time">'+timetostring($(this).attr("last_send_time"))+'</div><div class="iconfont icon-guanbi"></div></div>');
				}
				
			}
	
			if($(".chat_box_all .chat_box_"+$(this).attr("friend_id")).size()>0){
				$(".chat_box_all .chat_box").removeClass("show");		
				$(".chat_box_all .chat_box_"+$(this).attr("friend_id")).addClass("show");
			}else{
				$(".chat_box_all .chat_box").removeClass("show");
				$(".chat_box_all").append('<div class="chat_box chat_box_'+$(this).attr("friend_id")+'  show"><div class="chat_show_more"><span class="check_more">点击加载更多</span></div></div>');
				init_chat($(this).attr("friend_id"));
				
			}
			
		}
		
		$(".chat_right_box .name").text($(".chat_friend.active .f_nickname").text());
		 
		if($(this).children(".chat_num").size()>0){
			if(parseInt($(this).children(".chat_num").text())>0){
				update_chat_status(user_id,$(this).attr("friend_id"),'',$(this).attr("type"));
			}
		}
			
	})
	
	
	//显示更多消息
	$(document).delegate(".chat_show_more .check_more","click",function(){
		friend_id=$(".chat_friend.active").attr("friend_id");
		var page=friend_page[friend_id];
		if(!page){
			page=2;
		}else{
			page+=1;
		}
		friend_page[friend_id]=page;
		init_chat(friend_id,page);
	})
	
	
	
	//切换聊天对象
	$(document).delegate(".chat_friend","click",function(){
		$(this).addClass("active");
		$(this).siblings().removeClass("active");
		$(".chat_box_all .chat_box").removeClass("show");
		$(".chat_box_all .chat_box_"+$(this).attr("friend_id")).addClass("show");
		
		$(".chat_right_box .name").text($(".chat_friend.active .f_nickname").text());
	    
		if($(".chat_friend_"+$(this).attr("friend_id")).children(".chat_num").size()>0){
			if(parseInt($(".chat_friend_"+$(this).attr("friend_id")).children(".chat_num").text())>0){
				$(".chat_box_all .chat_box_"+$(this).attr("friend_id")).scrollTop($(".chat_box_all .chat_box_"+$(this).attr("friend_id"))[0].scrollHeight);
				if($(this).attr("friend_id").indexOf("group_") != -1){
					update_chat_status(user_id,$(this).attr("friend_id"),'',2);
				}else{
					update_chat_status(user_id,$(this).attr("friend_id"),'',1);
				}
				
			}
		}
	})
	
	
	//关闭聊天框
	$(document).delegate(".chat_left_box .icon-guanbi","click",function(event){
		event.stopPropagation();
		if($(this).parent().hasClass("active")){
			$(".chat_friend").eq(0).addClass("active");
			$(".chat_box_all .chat_box_"+$(".chat_friend").eq(0).attr("friend_id")).addClass("show");
		}
		
		$(".chat_box_all .chat_box_"+$(this).parent().attr("friend_id")).removeClass("show");
		$(this).parent().remove();
		if($(".chat_friend").size()<1){
			$(".web_chat").hide();
		}
	})
	
	
	//关闭所有聊天框
	$(document).delegate(".chat_right_box .icon-guanbi","click",function(event){
		$(".chat_box_all .chat_box").removeClass("show");
		$(".chat_friend").remove();
	    $(".web_chat").hide();
	})
	
	
	//搜索好友
	$(document).delegate(".chat_left .search","click",function(){
		keyword=$(".chat_friend_search").val();
		if(keyword){
			$(".chat_friend").each(function(){
				if($(this).find(".f_nickname").text().toLowerCase().indexOf(keyword.toLowerCase())==-1){
					$(this).hide();
				}
			})
		}else{
			$(".chat_friend").show();
		}
	})
	
	//搜索好友
	$(document).delegate(".friend_list_search","keyup",function(){
		keyword=$(this).val();
		if(keyword){		
			$(".friend_list .friend_list_box").children().each(function(){					
				if($(this).index()!=0){
					if($(this).attr("type")==1){
						if($(this).attr("friend_name").toLowerCase().indexOf(keyword.toLowerCase())==-1){
							$(this).hide();
						}
					}else if($(this).attr("type")==2){
						if($(this).attr("group_name").toLowerCase().indexOf(keyword.toLowerCase())==-1){
							$(this).hide();
						}
					}
				}
			})
		}else{
			$(".friend_list .friend_list_box").children().show();
		}
	})
	
	
	//添加好友
	$(document).delegate(".friend_insert .icon-guanbi","click",function(){
		$(".friend_insert").hide();
	})
	
	//关闭添加好友
	$(document).delegate(".friend_add .icon-sousuo","click",function(){
		$(".friend_insert").show();
	})
	
	//关闭好友列表
	$(document).delegate(".friend_head_close .icon-guanbi","click",function(){
		$(".friend_list").hide();
		$(".chat_q").show();
	})
	
	//关闭好友列表
	$(document).delegate(".chat_q","click",function(){
		$(this).hide();
		$(".friend_list").show();
	})
	
	
	//查找好友或群聊
	$(document).delegate(".friend_insert .friend_insert_search_btn","click",function(){
		var friend_search=$(".friend_insert .friend_insert_search_input").val();
		if(friend_search){
			$.ajax({
		        url: "/get_recommend_search",
		        method: "post",
		        data: 'user_id='+user_id+"&keyword="+friend_search,
		        dataType:'json',
		        success: function (result) {	    
		        	var html='';
		        	$(".recommend_friend_search_list").empty();
		        	if(result.length>0){
		        		$.each(result, function(k,v) {
		        			if(v.type==1){
		        				html+='<div class="recommend_friend" ><div class="recommend_friend_left"><img class="recommend_friend_avatar" src="'+v.avatar+'"/></div><div class="recommend_friend_right"><p class="recommend_friend_nickname">'+v.name+'</p><div class="recommend_friend_add_btn" recommend_friend_id="'+v.id+'" type="'+v.type+'">'
				                +'<span class="iconfont icon-iconfontadd"></span>好友</div></div></div>';
		        			}else if(v.type==2){
		        				var ava='<div class="group_avatar">';
		        				$.each(v.user_list, function(key,value) {
		        					ava+='<img src="'+value.avatar+'"/>';
		        				});
		        				ava+='</div>';
		        				html+='<div class="recommend_friend" ><div class="recommend_friend_left">'+ava+'</div><div class="recommend_friend_right"><p class="recommend_friend_nickname">'+v.group_name+'</p><div class="recommend_friend_add_btn" recommend_friend_id="'+v.id+'" type="'+v.type+'">'
				                +'<span class="iconfont icon-iconfontadd"></span>群聊</div></div></div>';
		        			}
	        			    
			        	});
			        	$(".recommend_friend_search_list").append(html);
		        	}
		        	$(".recommend_friend_search_list").show();
		        	$(".recommend_friend_list").hide();
		        }
		    });
		}else{
			$(".recommend_friend_search_list").hide();
		    $(".recommend_friend_list").show();
		}
	})
	
	
	//添加好友或群聊
	$(document).delegate(".friend_insert .recommend_friend_add_btn","click",function(){
	     var type=$(this).attr("type");
	     var recommend_friend_id=$(this).attr("recommend_friend_id");
	     var self=$(this);
	     $.ajax({
	        url: "/recommend_friend_add",
	        method: "post",
	        data: 'user_id='+user_id+'&type='+type+"&recommend_friend_id="+recommend_friend_id,
	        dataType:'json',
	        success: function (result) {	    
	        	if(result.code==true){
	        		if(type==1){
	        			friend_list.push(recommend_friend_id);       				
	        		    $(".friend_list .friend_list_box").append('<div class="myfriend myfriend_'+recommend_friend_id+' offline"  last_send_time="0"   order_by="'+result.time+'"  type="'+type+'"   friend_id="'+recommend_friend_id+'" friend_avatar="'+self.parents(".recommend_friend").find(".recommend_friend_avatar").attr("src")+'" friend_name="'+self.parents(".recommend_friend").find(".recommend_friend_nickname").text()+'">'
		        		   +'<div class="friend_ava"><img src="'+self.parents(".recommend_friend").find(".recommend_friend_avatar").attr("src")+'">'
		        		   +'</div><div class="friend_nickname"><span class="f_nickname">'+self.parents(".recommend_friend").find(".recommend_friend_nickname").text()+'</span><span class="leave_status"></span></div></div>');
	        		}else if(type==2){
	        			var g_ava=''
	        			$.each(result.user_list, function(i,j) {
	        				g_ava+='<img src="'+j.avatar+'">';
	        			});
	        			$(".friend_list .friend_list_box").append('<div class="group_chat group_chat_'+recommend_friend_id+'"  last_send_time="0"  friend_id="group_'+recommend_friend_id+'"   order_by="'+result.time+'"  type="'+type+'"  group_name="'+self.parents(".recommend_friend").find(".recommend_friend_nickname").text()+'"  group_user_number="'+result.group_user_number+'">'
		        		   +'<div class="group_ava">'+g_ava+'</div>'
		        		   +'<div class="friend_nickname"><span class="f_nickname">'+self.parents(".recommend_friend").find(".recommend_friend_nickname").text()+'</span></div></div>');
	        		}
	        		$(".friend_insert").hide();
	        		select_status();
	        	}else{
	        		layer.msg(result.msg);
	        	}
	        }
	    });
	})
	
	//发消息
	$(document).delegate(".web_chat .send","click",function(){
		if($(".web_chat .send_content").val()){
			msgData['tid']=$(".chat_friend.active").attr("friend_id");
			msgData['avatar']=user_avatar;
			msgData['name']=user_name;
			msgData['fid']=user_id;
			msgData['type']=1;
			msgData['message']=$(".web_chat .send_content").val();
		    send_msg(msgData);
		    $(".web_chat .send_content").val("");
		}
	})
	
	//换头像
	$(document).delegate(".friend_head_avatar_left img","click",function(){
		$("#change_avatar").click();
	})
	
	
	//换头像
	$("#change_avatar").change(function(){	
		var formData = new FormData();
		formData.append("user_id",user_id);
		formData.append("avatar",document.getElementById('change_avatar').files[0]);
		$("#change_avatar").val('');
	    //ajax异步上传
	    $.ajax({
	        url: "/change_avatar",
	        method: "post",
	        data: formData,
	        dataType:'json',
	        contentType: false, //必须false才会自动加上正确的Content-Type
	        processData: false,  //必须false才会避开jQuery对 formdata 的默认处理
	        success: function (result) {
	        	if(result.code==true){
	        		var user={};
	        		user.uid=user_id;
	        		user.name=user_name;
	        		user.avatar=result.src;
	        		setCookie('user',JSON.stringify(user),7*24*60*60);
	        		$(".friend_head_avatar_left img").attr("src",result.src);
	        	}else{
	        		layer.msg(result.message);
	        	}
	        }
	    });
	})
	
	
	//发送文件
	$(document).delegate(".chat_option_send_file","click",function(){
		$(".chat_biaoqing_box").hide();
		$("#send_file").click();
	})
	
	//发送文件
	$("#send_file").change(function(){	
		var formData = new FormData();
		friend_id=$(".chat_friend.active").attr("friend_id");
		formData.append("fid",user_id);
		formData.append("tid",friend_id);
		formData.append("type",2);
		formData.append("send_file",document.getElementById('send_file').files[0]);
		$("#send_file").val('');
	    //ajax异步上传
	    $.ajax({
	        url: "/send_file",
	        method: "post",
	        data: formData,
	        dataType:'json',
	        contentType: false, //必须false才会自动加上正确的Content-Type
	        processData: false,  //必须false才会避开jQuery对 formdata 的默认处理
	        success: function (result) {
	        	if(result.code=='send_msg'){
	        		send_msg(result);
	        	}else{
	        		layer.msg(result.message);
	        	}
	        }
	    });
	})
	
	//显示表情选项
	$(document).delegate(".chat_option_send_biaoqing","click",function(){
		if($(".chat_biaoqing_box").is(":hidden")){
			$(".chat_biaoqing_box").show();
		}else{
			$(".chat_biaoqing_box").hide();
		}
	})
	  
	
	//使用表情
	$(document).delegate(".chat_biaoqing_box img","click",function(){
		$(".chat_biaoqing_box").hide();
		$(".web_chat .send_content").val($(".web_chat .send_content").val()+$(this).attr("reg"));
	})
	
	//超过两秒没输入
	$(document).delegate(".send_content","keydown",function(){
	    clearTimeout(CHAT_A);		
		$(".chat_key_status").text("正在输入...");
		CHAT_A=setTimeout(function () {
	        $(".chat_key_status").text("");
	    }, 2000);
	});
	
	
	//静音或取消静音
	$(document).delegate(".yin","click",function(){
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			$(this).attr('src','images/yin.svg');
			if (localStream && localStream.getTracks()) {
			    localStream.getTracks().forEach((track) => {    
			    	if (track.kind === 'audio') {
				        track.enabled = true;
				    }
			    });
		    }
		}else{
			$(this).addClass("active");
			$(this).attr('src','images/jinyan.svg');
			if (localStream && localStream.getTracks()) {
			    localStream.getTracks().forEach((track) => {    
			    	if (track.kind === 'audio') {
				        track.enabled = false;
				    }
			    });
		    }
		}
	})	
	
	//发起语音聊天
	$(document).delegate(".yy","click",function(){		
	    friend_id=$(".chat_friend.active").attr("friend_id");
	    friend_avatar=$(".chat_friend.active").attr("friend_avatar");
	    if(friend_id.indexOf("group_") != -1){
	    	layer.msg("目前只支持一对一语音聊天");
	    }else{    	
	    	video_status=false;
	      	btnCallClick();
	    }
	});
	
	//发起视频聊天
	$(document).delegate(".call","click",function(){		
	    friend_id=$(".chat_friend.active").attr("friend_id");
	    friend_avatar=$(".chat_friend.active").attr("friend_avatar");
	    if(friend_id.indexOf("group_") != -1){
	    	layer.msg("目前只支持一对一视频聊天");
	    }else{
	    	video_status=true;
	      	btnCallClick();
	    }
	});
	
	//挂断视频或语音聊天
	$(document).delegate(".hangup","click",function(){
		if(!webrtc_friend_id){
			webrtc_friend_id=$(".chat_friend.active").attr("friend_id");
		}	    
	    ws.send(JSON.stringify({
			"fid": user_id,
			"tid":webrtc_friend_id,
			"code" : 'webRTC',
		    "event": "close",
	    }));
	    close();
	});
	
	//接听视频聊天
	$(document).delegate(".jieting","click",function(){
	    btnBackClick();	
	    $(this).hide();
	    $(".yin").show();
	});
	
	
	//超过5分钟没动键盘鼠标就显示离开
	$(document).keydown(function(event){	
		clearTimeout(CHAT_B);
		if(leave_status==1){	
			var msg={};
			msg.friend_list=friend_list;
			msg.leave_status=leave_status;
			msg.code="leave";
			msg.user_id=user_id;
	        ws.send(JSON.stringify(msg));
	        leave_status=0;
		}
		CHAT_B=setTimeout(function () {	
	        var msg={};
			msg.friend_list=friend_list;
			msg.leave_status=leave_status;
			msg.code="leave";
			msg.user_id=user_id;
	        ws.send(JSON.stringify(msg));
	        leave_status=1;
	    }, 5*60*1000);	
	    
	});
	
	
	//长按开始说话
	$(document).delegate(".anjian","mousedown",function(){
		if(!peerConnection) {
			$("body").append("<img src='images/shuohua.gif' class='shuohua'/>");
			door=true;
	        send_audio();
	    }
	})	
	
	
	//松开发送语音
	$(document).delegate(".anjian","mouseup",function(){
		friend_id=$(".chat_friend.active").attr("friend_id");
		$(".shuohua").remove();
	    door=false;
	    if(rec){
		    var formData = new FormData();
			formData.append("fid",user_id);
			formData.append("tid",friend_id);
			formData.append("send_file",rec.getBlob());
			formData.append("length",rec.getDuration());
			formData.append("type",3);
			
			rec.stop();
			
		    //ajax异步上传
		    $.ajax({
		        url: "/send_file",
		        method: "post",
		        data: formData,
		        dataType:'json',
		        contentType: false, //必须false才会自动加上正确的Content-Type
		        processData: false,  //必须false才会避开jQuery对 formdata 的默认处理
		        success: function (result) {
		        	if(result.code=='send_msg'){
		        		send_msg(result);
		        	}else{
		        		layer.msg(result.message);
		        	}
		        }
		    });
	    }
	});	
	
	
	//播放语音
	$(document).delegate(".chat_message.shengboyuyin","click",function(){
		receive("audio1","start",$(this).attr("message"));
		var self=$(this);
		var id=$(this).attr("id");
		var fid=$(this).attr("fid");
		var tid=$(".chat_friend.active").attr("friend_id");
		if(tid.indexOf("group_")== -1){
			var type=1;
		}else{
			var type=2;
		}
		var size=$(this).parent().find(".audio_read").length;
		
		if(fid!=user_id&&size){
			$.ajax({
		        url: "/update_audio_read",
		        method: "post",
		        data: {id:id,fid:fid,type:type,user_id:user_id},
		        dataType:'json',
		        success: function (result) {
		        	if(result.code==true){
		        		self.parent().find(".audio_read").remove();
		        	}else{
		        		layer.msg(result.message);
		        	}
		        }
		    });
		}
	})	
	
	var SRecorder = function(stream) {
	    config = {};
	 
	    config.sampleBits = config.smapleBits || 16;
	    config.sampleRate = config.sampleRate || (44100 / 6);
	 
	    var context = new AudioContext();
	    var audioInput = context.createMediaStreamSource(stream);
	    var recorder = context.createScriptProcessor(4096, 1, 1);
	 
	    var audioData = {
	        size: 0          //录音文件长度
	        , buffer: []    //录音缓存
	        , inputSampleRate: context.sampleRate    //输入采样率
	        , inputSampleBits: 16      //输入采样数位 8, 16
	        , outputSampleRate: config.sampleRate    //输出采样率
	        , oututSampleBits: config.sampleBits      //输出采样数位 8, 16
	        , clear: function() {
	            this.buffer = [];
	            this.size = 0;
	        }
	        , input: function (data) {
	            this.buffer.push(new Float32Array(data));
	            this.size += data.length;
	        }
	        , compress: function () { //合并压缩
	            //合并
	            var data = new Float32Array(this.size);
	            var offset = 0;
	            for (var i = 0; i < this.buffer.length; i++) {
	                data.set(this.buffer[i], offset);
	                offset += this.buffer[i].length;
	            }
	            //压缩
	            var compression = parseInt(this.inputSampleRate / this.outputSampleRate);
	            var length = data.length / compression;
	            var result = new Float32Array(length);
	            var index = 0, j = 0;
	            while (index < length) {
	                result[index] = data[j];
	                j += compression;
	                index++;
	            }
	            return result;
	        }
	        , encodeWAV: function () {
	            var sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
	            var sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
	            var bytes = this.compress();
	            var dataLength = bytes.length * (sampleBits / 8);
	            var buffer = new ArrayBuffer(44 + dataLength);
	            var data = new DataView(buffer);
	 
	            var channelCount = 1;//单声道
	            var offset = 0;
	 
	            var writeString = function (str) {
	                for (var i = 0; i < str.length; i++) {
	                    data.setUint8(offset + i, str.charCodeAt(i));
	                }
	            };
	            
	            // 资源交换文件标识符
	            writeString('RIFF'); offset += 4;
	            // 下个地址开始到文件尾总字节数,即文件大小-8
	            data.setUint32(offset, 36 + dataLength, true); offset += 4;
	            // WAV文件标志
	            writeString('WAVE'); offset += 4;
	            // 波形格式标志
	            writeString('fmt '); offset += 4;
	            // 过滤字节,一般为 0x10 = 16
	            data.setUint32(offset, 16, true); offset += 4;
	            // 格式类别 (PCM形式采样数据)
	            data.setUint16(offset, 1, true); offset += 2;
	            // 通道数
	            data.setUint16(offset, channelCount, true); offset += 2;
	            // 采样率,每秒样本数,表示每个通道的播放速度
	            data.setUint32(offset, sampleRate, true); offset += 4;
	            // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
	            data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true); offset += 4;
	            // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
	            data.setUint16(offset, channelCount * (sampleBits / 8), true); offset += 2;
	            // 每样本数据位数
	            data.setUint16(offset, sampleBits, true); offset += 2;
	            // 数据标识符
	            writeString('data'); offset += 4;
	            // 采样数据总数,即数据总大小-44
	            data.setUint32(offset, dataLength, true); offset += 4;
	            // 写入采样数据
	            if (sampleBits === 8) {
	                for (var i = 0; i < bytes.length; i++, offset++) {
	                    var s = Math.max(-1, Math.min(1, bytes[i]));
	                    var val = s < 0 ? s * 0x8000 : s * 0x7FFF;
	                    val = parseInt(255 / (65535 / (val + 32768)));
	                    data.setInt8(offset, val, true);
	                }
	            } else {
	                for (var i = 0; i < bytes.length; i++, offset += 2) {
	                    var s = Math.max(-1, Math.min(1, bytes[i]));
	                    data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
	                }
	            }
	            
	            return new Blob([data], { type: 'audio/wav' });
	        }
	    };
	 
	    this.start = function () {
	        audioInput.connect(recorder);
	        recorder.connect(context.destination);
	    }
	 
	    this.stop = function () {	   
	        recorder.disconnect();
	        audioInput.disconnect();
	        audioData.clear();
	        audio.getTracks()[0].stop();
	        context.close();
	        rec=null;
	    }
	    
	    this.getDuration =function() {
		    return (4096 * audioData.buffer.length) / audioData.inputSampleRate ;
		} 
	
	    this.getBlob = function () {
	
	        return audioData.encodeWAV();
	    }
	 
	 
	    recorder.onaudioprocess = function (e) {
	        
	        audioData.input(e.inputBuffer.getChannelData(0));
	    }
	};
	 
	
	//按F2发送语音
	function  send_audio() {
		if (!navigator.mediaDevices ||!navigator.mediaDevices.getUserMedia) {
		    layer.msg('该浏览器不支持语音');
		    $(".shuohua").remove();
	        door=false;
	   } else { 
		   	var constraints = {audio: {
		        echoCancellation: true, //回音消除
		        noiseSuppression: true, //噪声抑制
		        autoGainControl: true  //自动增益
		    }};
	
		    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
			    if(door){
				   	rec = new SRecorder(stream);
			        audio=stream;
			        rec.start();
			    }else{
			   	    stream.getTracks()[0].stop();
			    }
		    }).catch(function(err) {
				if(err.name=='NotFoundError'){
					layer.msg("找不到麦克风");
				}else if(err.name=='PermissionDeniedError'){
					layer.msg("请允许使用麦克风");
				}else if(err.name=='NotReadableError'){
					layer.msg("麦克风正在被使用");
				}else if(err.name=='NotAllowedError'){
					layer.msg("请允许使用麦克风");
				}else if(err.name=='NotSupportedError'){
					layer.msg("必须在https模式下");
				}
				$(".shuohua").remove();
	            door=false;
			})
	   }
		
	}
	
	//播放语音 
	function receive(dom,type='start',src='',loop='') {
		if(type=='start'){
			if($("."+dom).length>0){
				if(loop){
					$("."+dom).attr("loop","loop");
				}else{
					$("."+dom).removeAttr("loop");
				}
				$("."+dom).attr("src",src);
			}else{
				if(loop){
					$("body").append("<audio class='"+dom+"' autoplay='' src='"+src+"' loop='loop'></audio>");	
				}else{
					$("body").append("<audio class='"+dom+"' autoplay='' src='"+src+"'></audio>");	
				}
			}
		}else if(type=='stop'){
			$("."+dom).remove();
		}
	    
	}
	
	//超过5分钟没动键盘鼠标就显示离开
	$(document).mousemove(function(){
		clearTimeout(CHAT_B);
		if(leave_status==1){	
			var msg={};
			msg.friend_list=friend_list;
			msg.leave_status=leave_status;
			msg.code="leave";
			msg.user_id=user_id;
	        ws.send(JSON.stringify(msg));
	        leave_status=0;
		}
		CHAT_B=setTimeout(function () {	
	        var msg={};
			msg.friend_list=friend_list;
			msg.leave_status=leave_status;
			msg.code="leave";
			msg.user_id=user_id;
	        ws.send(JSON.stringify(msg));
	        leave_status=1;
	    }, 5*60*1000);	
	})
	
	
	//创建聊天框
	function create_chat_box(){
		$("body").append('<div class="web_chat"><div class="chat_left"><div class="top"><input type="text" class="chat_friend_search" placeholder="搜索好友或群聊名称" />'
	                +'<a href="javascript:;" class="search"></a></div><div class="chat_left_box"></div></div>'
			    	+'<div class="chat_right_box"><div class="top"><span>发送给: <span class="name"></span><span class="chat_key_status"></span></span><span class="iconfont icon-guanbi"></span></div><div class="chat_box_all"></div>'
			    	+'<div class="chat_biaoqing_box"></div><div class="chat_option">'
			    	+'<img src="/images/biaoqing.jpg" class="chat_option_send_biaoqing" title="表情"/>'
			        +'<img src="/images/tu.png" class="chat_option_send_file"  title="发送图片"/>'
			        +'<img src="/images/yy.png"   class="yy" title="语音聊天"/><img src="/images/call.png"   class="call" title="视频聊天"/><span class="anjian">长按这里发送语音</span>'
			        +'<input type="file"  id="send_file"  style="display: none;" /><input type="file"  id="change_avatar"  style="display: none;" /></div>'
				    +'<div class="write"><input type="text" class="send_content"  value="" /><div  class="send" /></div></div></div>'
					+'<div class="friend_list"><div class="friend_head"><div class="friend_head_avabox"><div class="friend_head_close"><span class="iconfont icon-guanbi"></span></div>'
					+'<div class="friend_head_avatar"><div class="friend_head_avatar_left"><img src="'+user_avatar+'"/></div><div class="friend_head_avatar_right">'
					+'<p class="friend_head_nickname" title="'+user_name+'">'+user_name+'</p><p class="friend_head_autograph" title="这家伙很懒,没有签名">这家伙很懒,没有签名</p></div></div>'
					+'</div><div class="friend_add"><span class="iconfont icon-sousuo" title="添加好友"></span><input class="friend_list_search" placeholder="搜索好友或群聊名称"/></div></div><div class="friend_list_box"></div></div><div class="call_box"><div class="call_shade"></div><div class="call_container">'
			        +'<video id="localvideo" autoplay="" playsinline="" muted=""></video>'
			        +'<video id="remotevideo" autoplay="" playsinline=""></video>'
			        +'<div class="call_tool"><img src="images/yin.svg" class="yin">'
			        +'<img src="images/hang_up.svg" class="hangup"><img src="images/jieting.svg" class="jieting"></div></div></div><div class="friend_insert">'
			        +'<div class="friend_insert_head"><span class="friend_insert_head_title">添加用户好友或群聊</span><span class="iconfont icon-guanbi"></span></div>'
			        +'<div class="friend_insert_content"><input class="friend_insert_search_input" placeholder="请输入用户或群聊名称"/><input type="button" class="friend_insert_search_btn" value="查找用户或群聊"/> </div>'
			        +'<div class="friend_insert_bottom"><p class="friend_insert_bottom_title">好友推荐</p><div class="recommend_friend_list">'
			        +'</div><div class="recommend_friend_search_list"></div></div></div><div class="chat_q"></div>');
			 
	}
	
	
	//添加表情选项
	function create_expression(){
		var biaoqing='';
		for(var i in smilies_array) {
		    var s = smilies_array[i];
		    biaoqing +='<img class="biaoqing"  reg="'+s[1]+'"  title="'+s[3]+'" alt="'+s[3]+'" src="smilieimg/'+s[2]+'">';
		}
		$(".chat_biaoqing_box").append(biaoqing);
	}
	
	
	//转换年月日方法
	function timetostring(str,time=0){ 
		if(str==''||str==0){
			return '';
		}
		
	    var oDate = new Date(str*1000),  
	    oYear = oDate.getFullYear(),  
	    oMonth = oDate.getMonth()+1,  
	    oDay = oDate.getDate(),  
	    oHour = oDate.getHours(),  
	    oMin = oDate.getMinutes(),  
	    oSec = oDate.getSeconds(); 
	    
	    var timestamp = Date.parse(new Date());
	    var now=new Date(timestamp);
	    
	    
		if(timestamp-str*1000<5*60*1000){
		 	if(time==0){
	    	    return "刚刚";  
	    	}else{
	    	    return "";  
	    	}
	    }
	   
	   
	    
	    if(now.getDate()==oDay&&now.getMonth()==oMonth-1&&now.getFullYear()==oYear){
	    	if(oHour<=12){
	    		return  "上午 "+getzf(oHour) +':'+ getzf(oMin);
	    	}else if(now.getHours()>12&&now.getHours()<19){
	    		return  "下午 "+getzf(oHour) +':'+ getzf(oMin) ;
	    	}else if(now.getHours()>=19){
	    		return  "晚上 "+getzf(oHour)+':'+ getzf(oMin) ;
	    	}	   
	    }else{
	    	if(time==0){
	    	    oTime = oYear +'/'+ getzf(oMonth) +'/'+ getzf(oDay);//最后拼接时间
	    	    return oTime;
	    	}else{
	    		if(oHour<=12){
		    		return  oYear +'/'+ getzf(oMonth) +'/'+ getzf(oDay)+" 上午 "+getzf(oHour) +':'+ getzf(oMin);
		    	}else if(oHour>12&&oHour<19){
		    		return  oYear +'/'+ getzf(oMonth) +'/'+ getzf(oDay)+" 下午 "+getzf(oHour) +':'+ getzf(oMin);
		    	}else if(oHour>=19){
		    		return  oYear +'/'+ getzf(oMonth) +'/'+ getzf(oDay)+" 晚上 "+getzf(oHour) +':'+ getzf(oMin);
	    	    }
	    	}
	    }
	 };
	 
	//补0操作  
	function getzf(num){  
	    if(parseInt(num) < 10){  
	        num = '0'+num;  
	    }  
	    return num;  
	}
	
	
	
	//获取好友列表
	function get_friend_list(user_id){
		$.ajax({
	        url: "/get_friend_list",
	        method: "post",
	        data: 'user_id='+user_id,
	        dataType:'json',
	        success: function (result) {
	        	friend_list=new Array();
	        	var html='';
	        	var avatar='';
	        	if(result.length>0){
	        		$.each(result, function(k,v) {
	        			if(v.type==1){
	        				friend_list.push(v.id);
	        				if(v.count>0){
	        					html+='<div class="myfriend myfriend_'+v.id+' offline"  last_send_time="'+v.last_send_time+'"   order_by="'+v.time+'"  type="'+v.type+'"   friend_id="'+v.id+'" friend_avatar="'+v.avatar+'" friend_name="'+v.name+'">'
			        		   +'<div class="friend_ava"><img src="'+v.avatar+'">'
			        		   +'</div><div class="friend_nickname"><span class="f_nickname">'+v.name+'</span><span class="leave_status"></span></div><div class="chat_num">'+v.count+'</div></div>';
	        				}else{
	        					html+='<div class="myfriend myfriend_'+v.id+' offline"  last_send_time="'+v.last_send_time+'"   order_by="'+v.time+'"  type="'+v.type+'"   friend_id="'+v.id+'" friend_avatar="'+v.avatar+'" friend_name="'+v.name+'">'
			        		   +'<div class="friend_ava"><img src="'+v.avatar+'">'
			        		   +'</div><div class="friend_nickname"><span class="f_nickname">'+v.name+'</span><span class="leave_status"></span></div></div>';
	        				}
			        		
	        			}else if(v.type==2){
	        				$.each(v.user_list, function(i,j) {
	        					avatar+='<img src="'+j.avatar+'">';
	        				});
	        		
	        				if(v.count>0){
	        					html+='<div class="group_chat group_chat_'+v.group_id+'"  last_send_time="'+v.last_send_time+'"  friend_id="group_'+v.group_id+'"   order_by="'+v.last_send_time+'"  type="'+v.type+'"  group_name="'+v.group_name+'"  group_user_number="'+v.group_user_number+'">'
			        		   +'<div class="group_ava">'+avatar+'</div>'
			        		   +'<div class="friend_nickname"><span class="f_nickname">'+v.group_name+'</span></div><div class="chat_num">'+v.count+'</div></div>';
	        				}else{
	        					html+='<div class="group_chat group_chat_'+v.group_id+'"  last_send_time="'+v.last_send_time+'"  friend_id="group_'+v.group_id+'"   order_by="'+v.last_send_time+'"  type="'+v.type+'"  group_name="'+v.group_name+'"  group_user_number="'+v.group_user_number+'">'
			        		   +'<div class="group_ava">'+avatar+'</div>'
			        		   +'<div class="friend_nickname"><span class="f_nickname">'+v.group_name+'</span></div></div>';
	        				}
	        				
	        			}
		        		
		        	});
		        	$(".friend_list .friend_list_box").append(html);
	        	}
	        	
	        	createWebSocket(wsUrl);   //连接ws
	        }
	    });
	}
	
	
	//获取推荐好友
	function get_recommend_friend(user_id){
		$.ajax({
	        url: "/get_recommend_friend",
	        method: "post",
	        data: 'user_id='+user_id,
	        dataType:'json',
	        success: function (result) {	    
	        	var html='';
	        	if(result.length>0){
	        		$.each(result, function(k,v) {
        			    html+='<div class="recommend_friend" ><div class="recommend_friend_left"><img class="recommend_friend_avatar" src="'+v.avatar+'"/></div><div class="recommend_friend_right"><p class="recommend_friend_nickname">'+v.name+'</p><div class="recommend_friend_add_btn" recommend_friend_id="'+v.id+'" type=1>'
			            +'<span class="iconfont icon-iconfontadd"></span>好友</div></div></div>';
		        	});
		        	$(".recommend_friend_list").append(html);
	        	}
	        }
	    });
	}
	
	//发消息
	function send_msg(msgData){
	   if(msgData['fid']==''){
	   	 msgData['fid']=user_id;
	   }
	   
	   if(msgData['type']==''){
	   	 msgData['type']=1;
	   }
	  msgData.code="send_msg";
	  ws.send(JSON.stringify(msgData));
	
	  msgData.created_at=Date.parse(new Date())/1000;
	
	  insert_html(msgData,msgData['tid'],2);
	  $(".chat_friend_"+msgData['tid']).find(".chat_time").text("刚刚");
	  $(".chat_box_all .chat_box.show").scrollTop($(".chat_box_all .chat_box.show")[0].scrollHeight);
	}
	
	//发起视频聊天
	function btnCallClick() {
		if (!navigator.mediaDevices ||!navigator.mediaDevices.getUserMedia) {
		    layer.msg('该浏览器不支持视频语音');	    
		    close();
	   } else {   	
	        createPeerConnection();      
		  	var constraints = {video: video_status,
		      audio: {
		        echoCancellation: true, //回音消除
		        noiseSuppression: true, //噪声抑制
		        autoGainControl: true  //自动增益
		      }};
	
			navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		
			
			  if (localStream) {
			    stream.getAudioTracks().forEach((track) => {
			      localStream.addTrack(track);
			      stream.removeTrack(track);
			    });
			  } else {
			    localStream = stream;
			  }
		
			  $(".call_box").show();
			  receive("audio1","start","audio/wait.wav","loop");
	    	  $(".call_box .call_container").append("<div class='webrtc_con'><img class='webrtc_friend_avatar' src='"+friend_avatar+"'/><p class='webrtc_message'>等待对方接听</p></div>");
	          $(".jieting").hide();
	           // 向PeerConnection中加入需要发送的流 
		       localStream.getTracks().forEach((track) => {
			      peerConnection.addTrack(track, localStream);
			   });
	           
		       //发送一个offer信令
		       peerConnection.createOffer(sendOfferFn, function (error) {
		            console.log('offer信令发送失败');
		       });
		       
	            
			}).catch(function(err) {
//				if(err.name=='NotFoundError'){
//					layer.msg("找不到摄像头或麦克风");
//				}else if(err.name=='PermissionDeniedError'){
//					layer.msg("请允许使用摄像头或麦克风");
//				}else if(err.name=='NotReadableError'){
//					layer.msg("摄像头或麦克风正在被使用");
//				}else if(err.name=='NotAllowedError'){
//					layer.msg("请允许使用摄像头或麦克风");
//				}else if(err.name=='NotSupportedError'){
//					layer.msg("必须在https模式下");
//				}
//              close();
                console.log(err.name + ": " + err.message);
			});
	    }
	    
	}	
	
	
	function createPeerConnection(friend_id=''){
		if(peerConnection==null){
			peerConnection = new RTCPeerConnection(iceServer);
			if(!friend_id){
				friend_id=$(".chat_friend.active").attr("friend_id");
			}
			// 发送ICE候选到其他客户端
			peerConnection.onicecandidate = function(event){
			    if (event.candidate !== null) {
			        ws.send(JSON.stringify({
			        	"fid": user_id,
			    	    "tid":friend_id,
			        	"code" : 'webRTC',
			            "event": "_ice_candidate",
			            "data": {
			                "candidate": event.candidate
			            }
			        }));
			    }
			};
			
			// 如果检测到媒体流连接到本地，将其绑定到一个video标签上输出
			peerConnection.ontrack = function(event){
				var remoteVideo = document.querySelector("#remotevideo");
			    remoteVideo.srcObject = event.streams[0];
			};
			
			let timeout=0;
			
			WEBRTC_A=setInterval(function() {
				if(peerConnection){
					//对方断开连接
					if(peerConnection.iceConnectionState=='disconnected'||peerConnection.iceConnectionState=='closed'){
						clearInterval(WEBRTC_A);
						close();
					}
					
					//呼叫超时	
					if(peerConnection.iceConnectionState=='new'){
						timeout++;
					}
					
					if(timeout>20){
						clearInterval(WEBRTC_A);
						close();
					}
				}
			}, 3000);
			
				
	
		}
	}
	
	//接听视频聊天
	function btnBackClick() {
		if (!navigator.mediaDevices ||!navigator.mediaDevices.getUserMedia) {
		    layer.msg('该浏览器不支持视频语音');		    
		    ws.send(JSON.stringify({
				"fid": user_id,
				"tid":webrtc_friend_id,
				"code" : 'webRTC',
			    "event": "notsupport",
		    }));
		    close();
	    } else {
	    	createPeerConnection();
	     	var localVideo = document.querySelector("#localvideo");
		  	var constraints = {video: video_status,
		      audio: {
		        echoCancellation: true, //回音消除
		        noiseSuppression: true, //噪声抑制
		        autoGainControl: true  //自动增益
		      }};
		
			navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
				
			  if (localStream) {
			    stream.getAudioTracks().forEach((track) => {
			      localStream.addTrack(track);
			      stream.removeTrack(track);
			    });
			  } else {
			    localStream = stream;
			  }
			 
			  $(".call_box").show();         
			  $(".hangup").show();
			  $(".jieting").hide();
			  receive("audio1","stop");
			  if(video_status==false){
			  	 var video_time=0;
			  	 clearInterval(WEBRTC_VIDEO_TIME);
			  	 WEBRTC_VIDEO_TIME=setInterval(function(){
			  	 	 video_time++;
			  	 	 $(".webrtc_con .webrtc_message").text(time_desc(video_time));
			  	 },1000)
			  }else{
			  	$(".call_box .call_container .webrtc_con").remove();
			  }
			  
			
			  localVideo.srcObject = localStream;
			
			 
			  // 向PeerConnection中加入需要发送的流 
		      localStream.getTracks().forEach((track) => {
			    peerConnection.addTrack(track, localStream);
			  });
			  
	          //发送一个answer信令
		       peerConnection.createAnswer(sendAnswerFn, function (error) {
	            console.log('Failure callback: ' + error);
	           });
	
			}).catch(function(err) {
//				if(err.name=='NotFoundError'){
//					layer.msg("找不到摄像头或麦克风");
//				}else if(err.name=='PermissionDeniedError'){
//					layer.msg("请允许使用摄像头或麦克风");
//				}else if(err.name=='NotReadableError'){
//					layer.msg("摄像头或麦克风正在被使用");
//				}else if(err.name=='NotAllowedError'){
//					layer.msg("请允许使用摄像头或麦克风");
//				}else if(err.name=='NotSupportedError'){
//					layer.msg("必须在https模式下");
//				}
//				ws.send(JSON.stringify({
//					"fid": user_id,
//					"tid":webrtc_friend_id,
//					"code" : 'webRTC',
//				    "event": "notsupport",
//			    }));
//			    close();
				console.log(err.name + ": " + err.message);
			});
	    }
	}	
	
	
	
	
	
	// 发送offer的函数
	var sendOfferFn = function (desc) {
		friend_id=$(".chat_friend.active").attr("friend_id");
	    // 设置本地Offer
	    peerConnection.setLocalDescription(desc); 
	    // 发送offer
	    ws.send(JSON.stringify({
	    	"fid": user_id,
	    	"f_avatar":user_avatar,
	    	"video_status":video_status,
	    	"tid":friend_id,
	    	"code" : 'webRTC',
	        "event": "_offer",
	            "data": {
	                "sdp": desc
	            }
	        }));
	};
	// 发送answer的函数，发送本地session描述
	var sendAnswerFn = function(desc){ // 发送answer	
	    peerConnection.setLocalDescription(desc); // 设置本地Offer
	    ws.send(JSON.stringify({ // 发送answer
	    	"fid": user_id,
	    	"tid":webrtc_friend_id,
	    	"code" : 'webRTC',
	        "event": "_answer",
	        "data": {
	            "sdp": desc
	        }
	    }));
	};
	
	
	
	
	function close() {
	  receive("audio1","stop");
	  closeLocalMedia();
	  closePc();
	  webrtc_friend_id='';
	  $(".call_box").hide();
	  $(".call_box .call_container .webrtc_con").remove();
	  $(".yin").removeClass("active");
	  $(".yin").attr('src','images/yin.svg');
	  $(".hangup").show();
	  $(".jieting").show();
	  clearInterval(WEBRTC_VIDEO_TIME);
	}
	
	
	function closePc() {
	  if (peerConnection) {
	    offerdesc = null;
	    peerConnection.close();
	    peerConnection = null;
	  }
	
	}
	
	function closeLocalMedia() {
	  if (localStream && localStream.getTracks()) {
	    localStream.getTracks().forEach((track) => {    
	        track.stop();
	    });
	  }
	  localStream = null;
	}
	
	
	
	
	
	//更新消息状态
	function update_chat_status(friend_id,other_id,id='',type){
		$.ajax({
			type:"post",
			url:"/update_chat_status",
			async:true,
			data:"friend_id="+friend_id+"&other_id="+other_id+"&id="+id+"&type="+type,
			dataType:'json',
			success:function(data){
				if(friend_id==user_id){
					$(".chat_friend_"+other_id).children(".chat_num").remove();
					other_id=other_id.toString();
					if(other_id.indexOf("group_") != -1){
						$(".group_chat_"+other_id.replace('group_', '')).children(".chat_num").remove();
					}else{
						$(".myfriend_"+other_id).children(".chat_num").remove();
					}
					
				}else{
					$(".chat_friend_"+friend_id).children(".chat_num").remove();
					friend_id=friend_id.toString();
					if(friend_id.indexOf("group_") != -1){
						$(".group_chat_"+friend_id.replace('group_', '')).children(".chat_num").remove();
					}else{
						$(".myfriend_"+friend_id).children(".chat_num").remove();
					}
				}
			}
		});
	}
	
	
	
	//创建websocket连接
	function createWebSocket(url) {
	    try{
	        if(typeof(WebSocket)!=="undefined"){
	            ws = new WebSocket(url);
	            initEventHandle();
	        }else{
	        	layer.msg("当前浏览器不支持在线聊天");
	        }
	        
	    }catch(e){
	        reconnect(url);
	    }     
	}
	
	//重连websocket
	function reconnect(url) {
	    if(lockReconnect) return;
	    lockReconnect = true;
	    setTimeout(function () {     
	    	//没连接上会一直重连，设置延迟避免请求过多
	    	createWebSocket(url);
	        lockReconnect = false;
	    }, 5000);
	}
	
	
	//初始化
	function initEventHandle() {
		ws.onopen = function(e){
			update_status(1);
			select_status();
			heartCheck.reset().start(); 
		    
		};
		
		ws.onclose = function () {
			update_status(0);
			console.log("与服务器断开连接");
	//	    reconnect(wsUrl);
		};
		
		ws.onerror = function () {
	//	    reconnect(wsUrl);
		};
		
		ws.onmessage = function(e){
			heartCheck.reset().start();  
		    var data =JSON.parse(e.data);
		    if(data.code==true){
				if(data.type!='pong'){
					receive("audio2","start","audio/message.wav");
					data.fid=data.fid.toString();    
					$(".chat_friend_"+data.fid).find(".chat_time").text("刚刚");
					data.created_at=Date.parse(new Date())/1000;
					insert_html(data,data.fid,2);
					if($(".chat_friend.active").attr("friend_id")==data.fid&&(!$('.web_chat').is(':hidden'))){
						if(data.fid.indexOf("group_") != -1){
							update_chat_status(user_id,data.fid,data.id,2);
						}else{
							update_chat_status(data.fid,data.tid,data.id,1);
						}					
						$(".chat_box_all .chat_box_"+data.fid).scrollTop($(".chat_box_all .chat_box_"+data.fid)[0].scrollHeight);
					}else{
						if(data.fid.indexOf("group_") != -1){
							size=$(".group_chat_"+data.fid.replace('group_', '')).children('.chat_num').size();
						}else{
							size=$(".myfriend_"+data.fid).children('.chat_num').size();
						}
						if(size>0){
							if(data.fid.indexOf("group_") != -1){
								num=parseInt($(".group_chat_"+data.fid.replace('group_', '')).children('.chat_num').text())+1;
								$(".group_chat_"+data.fid.replace('group_', '')).children('.chat_num').text(num);
							}else{
								num=parseInt($(".myfriend_"+data.fid).children('.chat_num').text())+1;
								$(".myfriend_"+data.fid).children('.chat_num').text(num);
							}
							$(".chat_friend_"+data.fid).children('.chat_num').text(num);
						}else{
						    $(".chat_friend_"+data.fid).append('<div class="chat_num">1</div>');
						    if(data.fid.indexOf("group_") != -1){
								$(".group_chat_"+data.fid.replace('group_', '')).append('<div class="chat_num">1</div>');
							}else{
								$(".myfriend_"+data.fid).append('<div class="chat_num">1</div>');
							}
						   
						}
					}
				}				 	  
			}else if(data.code=='update_status'){
				if(data.status==1){
					$(".myfriend_"+data.user_id).removeClass("offline");
					$(".chat_friend_"+data.user_id).removeClass("offline");
					$(".chat_friend_"+data.user_id).find(".online_status").text("在线");
				}else if(data.status==0){
					$(".myfriend_"+data.user_id).addClass("offline");
					$(".chat_friend_"+data.user_id).addClass("offline");
					$(".chat_friend_"+data.user_id).find(".online_status").text("离线");
					$(".myfriend_"+data.user_id).find(".leave_status").text("");
					$(".chat_friend_"+data.user_id).find(".leave_status").text("");
				}
				order_by();  //按是否在线和order_by排序
			}else if(data.code=='select_status'){
				if(data.friend_list){
					$.each(data.friend_list, function(k,v) {
						$(".myfriend_"+v).removeClass("offline");
						$(".chat_friend_"+v).removeClass("offline");
						$(".chat_friend_"+v).find(".online_status").text("在线");
					});
				}
				
				order_by();  //按是否在线和order_by排序		
			}else if(data.code=='other'){		
				layer.msg(data.msg);
				ws.close();
				location.href = "about:blank";              
	            window.close();
			}else if(data.code=='leave'){
				if(!$(".friend_list .myfriend_"+data.user_id).hasClass("offline")){
					if(data.leave_status==1){
						$(".friend_list .myfriend_"+data.user_id).find(".leave_status").text("");
						$(".chat_left_box .chat_friend_"+data.user_id).find(".leave_status").text("");
					}else{
						$(".friend_list .myfriend_"+data.user_id).find(".leave_status").text("(离开)");
						$(".chat_left_box .chat_friend_"+data.user_id).find(".leave_status").text("(离开)");
					}
					
				}
			}else if(data.code=='webRTC'){
				//如果是一个ICE的候选，则将其加入到PeerConnection中，否则设定对方的session描述为传递过来的描述
		        if(data.event === "_ice_candidate" ){
		        	if(peerConnection){
		        		peerConnection.addIceCandidate(new RTCIceCandidate(data.data.candidate));
		        	}
		            
		        } else {
		            if(data.event === "_answer") {
		            	if(peerConnection){
		            		peerConnection.setRemoteDescription(new RTCSessionDescription(data.data.sdp));
			            	var localVideo = document.querySelector("#localvideo");
			            	receive("audio1","stop");
			            	// 如果是一个offer，那么需要回复一个answer
			            	if ("srcObject" in localVideo) {
							    localVideo.srcObject = localStream;
							} else {
							    // 防止在新的浏览器里使用它，应为它已经不再支持了
							    localVideo.src = window.URL.createObjectURL(localStream);
							}	
							
							webrtc_friend_id=data.fid;
							if(video_status==false){
							  	var video_time=0;
							  	clearInterval(WEBRTC_VIDEO_TIME);
							  	WEBRTC_VIDEO_TIME=setInterval(function(){
							  	 	video_time++;
							  	 	$(".webrtc_con .webrtc_message").text(time_desc(video_time));
							  	},1000)
							}else{
								$(".call_box .call_container .webrtc_con").remove();
								
							} 
		            	}	
		            }else if(data.event==='_offer'){
		            	data.fid=data.fid.toString();
		                if(data.fid.indexOf("group_")== -1){
		            		if(webrtc_friend_id){
		            			//正在通话中
		            			ws.send(JSON.stringify({ // 发送answer
							    	"fid": user_id,
							    	"tid":data.fid,
							    	"code" : 'webRTC',
							        "event": "onphone"
							    }));
		            		}else{
		            			video_status=data.video_status;
		            			createPeerConnection(data.fid);
		            	        peerConnection.setRemoteDescription(new RTCSessionDescription(data.data.sdp));
		            			$(".call_box").show();
		            			receive("audio1","start","audio/wait.wav","loop");
			            		$(".call_box .call_container .webrtc_con").remove();
			            		$(".call_box .call_container").append("<div class='webrtc_con'><img class='webrtc_friend_avatar' src='"+data.f_avatar+"'/><p class='webrtc_message'></p></div>");
			            		$(".yin").hide();
		            			webrtc_friend_id=data.fid;
		            		}
		            	}
		            }else if(data.event==='close'){
		            	data.tid=data.tid.toString();
		            	if(data.tid.indexOf("group_")== -1){
		            		close();	            		
		            	}	
		            }else if(data.event==='onphone'){
		            	close();
		            	layer.msg("对方正在通话中");		
		            }else if(data.event==='offline'){
		            	close();
		            	layer.msg("对方不在线");		
		            }else if(data.event==='notsupport'){
		            	close();
		            	layer.msg("对方不支持视频语音");	
		            }
		        }
			}else if(data.code==false){
				layer.msg(data.msg);
			}
		};  
		
		window.onbeforeunload = function() {
			update_status(0);
		    ws.close();
		};
		
		
		
	
		var heartCheck = {
		    timeout: 30*1000,        //30秒发一次心跳
		    timeoutObj: null,
		    serverTimeoutObj: null,
		    reset: function(){
		        clearTimeout(this.timeoutObj);
		        clearTimeout(this.serverTimeoutObj);
		        return this;
		    },
		    start: function(){
		        var self = this;
		        this.timeoutObj = setTimeout(function(){
		            //这里发送一个心跳，后端收到后，返回一个心跳消息，
		            heart.code="ping";
		            ws.send(JSON.stringify(heart));
		            self.serverTimeoutObj = setTimeout(function(){
		            	//如果超过一定时间还没重置，说明后端主动断开了
		                ws.close();     
		                //如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
		            }, self.timeout)
		        }, this.timeout)
		    }
		}
	}
	
	
	//计时
	function time_desc(secondTime){
	    var minuteTime = 0;// 分
	    var hourTime = 0;// 小时
	    if(secondTime >= 60) {//如果秒数大于60，将秒数转换成整数
	        //获取分钟，除以60取整数，得到整数分钟
	        minuteTime = parseInt(secondTime / 60);
	        //获取秒数，秒数取佘，得到整数秒数
	        secondTime = parseInt(secondTime % 60);
	        //如果分钟大于60，将分钟转换成小时
	        if(minuteTime >= 60) {
	            //获取小时，获取分钟除以60，得到整数小时
	            hourTime = parseInt(minuteTime / 60);
	            //获取小时后取佘的分，获取分钟除以60取佘的分
	            minuteTime = parseInt(minuteTime % 60);
	        }
	    }
	    var result = getzf(parseInt(minuteTime)) + ":" +getzf(parseInt(secondTime));
	 
	
	    if(hourTime > 0) {
	        result = getzf(parseInt(hourTime)) + ":" + result;
	    }
	    return result;
	}
	
	//按是否在线和order_by排序
	function order_by(){
		var ar=new Array();
	    var br=new Array();
	    var offline;
	    $(".friend_list_box .myfriend").each(function(){
	    	if($(this).hasClass("offline")){
	    		offline=0;
	    	}else{
	    		offline=1;
	    	}
	        ar[ar.length]={'offline':offline,'order_by':$(this).attr("order_by")};
	    });
	    
	    //offline从大到小，order_by从大到小
	    br=ar.sort(function(a,b){
			if (a.offline === b.offline) {
		        return b.order_by - a.order_by;
	         } else {
	            return b.offline - a.offline;
	         }
		});
	    for(var i=0;i<br.length;i++){
	        $(".friend_list_box").append($(".myfriend[order_by="+br[i]['order_by']+"]"));
	    }
	
	}
	
	//向好友更新在线状态
	function update_status(status){	
		var msg={};
		msg.friend_list=friend_list;
		msg.status=status;
		msg.code="update_status";
		msg.user_id=user_id;
		setTimeout(function(){
	    	ws.send(JSON.stringify(msg));
	    }, 1000)	
	}
	
	//查询好友是否在线
	function select_status(){	
	    var msg={};
		msg.friend_list=friend_list;
		msg.code="select_status";
		ws.send(JSON.stringify(msg));
	}
	
	
	
	//初始化信息
	function init_chat(friend_id,page=1){
		friend_id=friend_id.toString();
		if(friend_id.indexOf("group_") != -1){
			var other_id=friend_id.replace('group_', '');
			var type=2;
		}else{
			var other_id=friend_id;
			var type=1;
		}
		
		$(".chat_box_"+friend_id).find(".chat_show_more").html('<span><img src="/images/jiazai.gif"/>正在加载</span>');	
		$.ajax({
			type:"post",
			url:"/getchat",
			async:true,
			data:"user_id="+user_id+"&other_id="+other_id+"&type="+type+"&page="+page+"&pagenum="+chat_num,
			dataType:'json',
			success:function(data){
		
				if(data.list.length>0){
					var height=$(".chat_box_"+friend_id)[0].scrollHeight;
					$.each(data.list, function(k,v) {
						insert_html(v,friend_id);
					});
					if(data.more=='has_more'){
						$(".chat_box_"+friend_id).find(".chat_show_more").html('<span class="check_more">点击加载更多</span>');
					}else if(data.more=='no_more'){
						$(".chat_box_"+friend_id).find(".chat_show_more").remove();
					}
						
					if(page==1){
						$(".chat_box_"+friend_id).scrollTop($(".chat_box_"+friend_id)[0].scrollHeight);
					}else{
						$(".chat_box_"+friend_id).scrollTop($(".chat_box_"+friend_id)[0].scrollHeight-height);
					}
				}else{
					$(".chat_box_"+friend_id).find(".chat_show_more").remove();
				}
			}
		});
	}
	
	
	//Html结构转字符串形式显示
	function ToHtmlString(str) {
		str = str.replace(/\<|\>|\"|\'|\&|　| /g,function (MatchStr){
			switch (MatchStr) {
				case "<":
					return "&lt;";
					break;
				case ">":
					return "&gt;";
					break;
				case "\"":
					return "&quot;";
					break;
				case "'":
					return "&#39;";
					break;
				case "&":
					return "&amp;";
					break;
				case " ":
					return "&ensp;";
					break;
				case "　":
					return "&emsp;";
					break;
				default:
				    break;
			}
		})
		return str.replace(/\&lt\;br[\&ensp\;|\&emsp\;]*[\/]?\&gt\;|\r\n|\n/g, "<br/>");
	}
	
	
	// 表情
	function update_chat_msg(msg){
		msg=ToHtmlString(msg);
	    for(var i in smilies_array) {
	        var s = smilies_array[i];
	        var re = new RegExp(""+s[1],"g");
	        var smilieimg = '<img class="biaoqing"  title="'+s[3]+'" alt="'+s[3]+'" src="smilieimg/'+s[2]+'">';
	        msg = msg.replace(re,smilieimg);
	    }
	    return msg;
	}
	
	
	//显示消息
	function insert_html(msgData,friend_id,type=1) {
		if(msgData.group_id){
			msgData.fid=msgData.user_id;
		}
		
		//是否是自己所发
		if(msgData.fid==user_id){
			var fangxiang="left";
		}else{
			var fangxiang="right";
		}
		
		//type 1:文字 2:图片 3:语音
		if(msgData.type==1){
			var h='<div class="chat_message"><span>'+update_chat_msg(msgData.message)+'</span></div>';
		}else if(msgData.type==2){
			var h='<div class="chat_message"><img class="chat_send_img" src="'+msgData.message+'"/></div>';
		}else if(msgData.type==3){
			
			if(msgData.fid==user_id){
				var h='<div class="chat_message shengboyuyin" message="'+msgData.message+'" id="'+msgData.id+'"  fid="'+msgData.fid+'"><span class="iconfont icon-shengboyuyinxiaoxi" ></span>'+msgData.length+'</div>';
			}else{
				if(!msgData.audio_read){
					var h='<div class="chat_message shengboyuyin" message="'+msgData.message+'" id="'+msgData.id+'" fid="'+msgData.fid+'">'+msgData.length+'<span class="iconfont icon-shengboyuyinxiaoxi" ></span></div><div class="audio_read"></div>';
				}else{				
					if(msgData.group_id){
						var audio_read=msgData.audio_read.split(",");
						if(audio_read.indexOf(user_id)==-1){
							var h='<div class="chat_message shengboyuyin" message="'+msgData.message+'" id="'+msgData.id+'"  fid="'+msgData.fid+'">'+msgData.length+'<span class="iconfont icon-shengboyuyinxiaoxi" ></span></div><div class="audio_read"></div>';
						}else{
							var h='<div class="chat_message shengboyuyin" message="'+msgData.message+'" id="'+msgData.id+'"  fid="'+msgData.fid+'">'+msgData.length+'<span class="iconfont icon-shengboyuyinxiaoxi" ></span></div>';
						}					
					}else{
						var h='<div class="chat_message shengboyuyin" message="'+msgData.message+'" id="'+msgData.id+'"  fid="'+msgData.fid+'">'+msgData.length+'<span class="iconfont icon-shengboyuyinxiaoxi" ></span></div>';
					}
					
				}
				
			}
			
		}
		
		if(type==1){
			$(".chat_box_"+friend_id).find(".chat_show_more").after('<div class="'+fangxiang+'"><div class="chat_create_time">'+timetostring(msgData.created_at,1)+'</div><div class="chat_bottom_box"><div class="chat_ava">'
			          +'<img src="'+msgData.avatar+'"/></div>'
					  +'<div class="chat_img"></div>'+h+'</div></div>');
				
		}else{
			$(".chat_box_"+friend_id).append('<div class="'+fangxiang+'"><div class="chat_create_time">'+timetostring(msgData.created_at,1)+'</div><div class="chat_bottom_box"><div class="chat_ava">'
			          +'<img src="'+msgData.avatar+'"/></div>'
					  +'<div class="chat_img"></div>'+h+'</div></div>');
		}
	}

})
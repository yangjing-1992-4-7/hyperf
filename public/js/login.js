layui.config({
	base: 'js/sliderVerify/'
}).use(['sliderVerify', 'jquery', 'form'], function() {
	var sliderVerify = layui.sliderVerify,
		$ = layui.jquery,
		form = layui.form;
	var slider = sliderVerify.render({
		elem: '#slider',
		onOk: function(){
			//当验证通过回调
			layer.msg("验证通过",{time:2000});
		}
	})
	
	//表单输入效果
    $(".login-main .input-item").click(function(e) {
        e.stopPropagation();
        $(this).addClass("layui-input-focus").find(".layui-input").focus();
    })
    $(".login-main .input-item .layui-input").focus(function() {
    	$(this).parent().addClass("layui-input-focus");
    })
    $(".login-main .input-item .layui-input").blur(function() {
        $(this).parent().removeClass("layui-input-focus");
        if ($(this).val() != '') {
            $(this).parent().addClass("layui-input-active");
        } else {
            $(this).parent().removeClass("layui-input-active");
        }
    })
	
	//登录
    form.on("submit(login)", function(data) {
        var action = $(data.form).attr('action');
        $.post(action, $(data.form).serialize(), success, "json");
        return false;

        function success(data) {
            if (data.code) {
			    setCookie('user',JSON.stringify(data),7*24*60*60);
                layer.msg(data.msg, {
                    offset: '15px',
                    icon: 1,
                    time: 1000
                }, function() {
                    window.location.href = data.url;
                });
            } else {
                layer.msg(data.msg, { icon: 5,time:2000 });
            }
        }
    });
})
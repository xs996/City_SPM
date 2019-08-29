/**

 @Name：HydView 视图模块
 @Author：徐豪
        
 */
 
layui.define(['laytpl', 'layer', '_view'], function(exports){
    var $ = layui.jquery
    ,laytpl = layui.laytpl
    ,layer = layui.layer
    ,setter = layui.setter
    ,device = layui.device()
    ,hint = layui.hint()
    ,router = layui.router()
    ,view = layui._view;


    view.ajaxOption = {
        contentType: 'application/json; charset=utf-8'
        ,method: 'post'
        ,type: 'post'
        ,response: {
            statusCode: 1
            ,msgName: 'message'
        }
    }

    view.exit = function(){

        for(var prop in setter.request) {
            layui.data(setter.tableName, {
                key: setter.request[prop]
                ,remove: true
            });
        }

        //跳转到登入页
        location.hash = '/user/login'; 
    };

    view.reLogin=function(request,options){
        layer.open({
            type: 1
            ,title: false //不显示标题栏
            ,closeBtn: false
            ,area: '400px;'
            ,shade: 0.8
            ,id: 'LAY_expire' //设定一个id，防止重复弹出
            ,btnAlign: 'c'
            ,scrollbar:false
            ,skin:'hyd-modal'
            ,moveType: 0 //拖拽模式，0或者1
            ,content: '<div class="layui-inline" style="width:100%;text-align:center;margin-bottom: 5px;"><span hyd-filter="loginMsg" style="color: #dd4b39;"></span></div><div class="layui-inline" style="width:100%"><div class="layui-input-inline" style="width:100%"><input id="LAY_expire_pwd" type="password" name="password" lay-verify="pass" placeholder="会话已超时, 请重新输入密码" autocomplete="off" class="layui-input"></div><label id="LAY_expire_login" class="layui-form-label" style="top: 0;right: 0;width: 40px;text-align: center;padding: 10px 0px;position: absolute;cursor: pointer;"><i class="layui-icon fa fa-rotate-180">&#xe65c;</i></label></div><div class="layui-inline" style="width:100%;text-align:center;margin-top: 10px;margin-bottom: 5px;"><span hyd-filter="loginReload" style="cursor: pointer;color: #3c8dbc;">重新登录</span></div>'
            ,success: function(layero, idx){
                $('.layui-form-label',layero).on('click',function (e) {
                    var passW0rd = $('#LAY_expire_pwd').val();
                    if (!passW0rd){
                        $('[hyd-filter=loginMsg]',layero).html('请输入密码');
                        return;
                    }
                    $('[hyd-filter=loginMsg]',$(layero)).html('');
                    layui.admin.req({
                        url: '/rest/SystemCtr/login'
                        ,type: 'post'
                        ,data: {
                            owner: layui.data(setter.tableName)[request.userInfo].owner,
                            secret: CryptoJS.SHA256(passW0rd)+''
                        }
                        ,done: function(res,msg,rp){
                            layui.data(setter.tableName, {
                                key: setter.request.tokenName
                                ,value: rp.getResponseHeader(setter.request.tokenName)
                            });
                            layui.data(setter.tableName, {
                                key: setter.request.userInfo
                                ,value: {
                                    owner: res.data[0].owner
                                    ,name: res.data[0].name
                                    ,levelCd: res.data[0].levelCd
                                    ,workNo: res.data[0].workNo
                                    ,org: res.data[0].org
                                }
                            });

                            layui.data(setter.tableName, {
                                key: setter.request.owner
                                ,value: res.data[0].owner
                            });
                            layer.close(idx);
                            if (options.url == '/rest/SystemCtr/queryUserMenus'){
                                layui.view('TPL_menu').render('menu');
                            }
                        }
                    });
                });
                $('[hyd-filter=loginReload]',layero).on('click',function (e) {
                    layer.close(idx);
                    view.exit();
                });
            }
        });
    }


    //Ajax请求
    view.req = function(options){
        var that = this
        ,success = options.success
        ,error = options.error
        ,request = setter.request
        ,response = setter.response
        ,debug = function(){
            return setter.debug 
                ? '<br><cite>URL：</cite>' + options.url
            : '';
        };

        options.data = options.data || {};
        options.headers = options.headers || {};
        
        if(request.tokenName){
            var sendData = typeof options.data === 'string' 
                ? JSON.parse(options.data) 
            : options.data;
         
            //自动给 Request Headers 传入 token
            options.headers[request.tokenName] = request.tokenName in options.headers 
                ?  options.headers[request.tokenName]
            : (layui.data(setter.tableName)[request.tokenName] || '');
            
            //访问模式
            options.headers[setter.request.device] = $.inArray('quick',router.path) == -1 ? setter.device.PC : setter.device.QUICK_PC;
        }
        
        delete options.success;
        delete options.error;

        if (request['owner']) {
            options.data[request['owner']] = request['owner'] in options.data 
                ?  options.data[request['owner']]
            : (layui.data(setter.tableName)[request['owner']] || '');
        }

        if(options.type && options.type.toLowerCase() === 'post'){
            options.contentType = 'application/json; charset=utf-8';
            options.data = JSON.stringify(options.data);
        }

        return $.ajax($.extend({
            type: 'get'
            ,dataType: 'json'
            ,success: function(res, msg, rp){
                var statusCode = response.statusCode;

                //只有 response 的 code 一切正常才执行 done
                if(res[response.statusName] == statusCode.ok) {
                    typeof options.done === 'function' && options.done(res, msg, rp); 
                } 
                
                //其它异常
                else {
                    layer.msg(res[setter.response.msgName], {
                        offset: '30px'
                        ,icon: 2
                        ,time: 2000
                    });
                }
                
                //只要 http 状态码正常，无论 response 的 code 是否正常都执行 success
                typeof success === 'function' && success(res);
            }
            ,error: function(e, code){
                var statusCode = response.statusCode;
                if (e.responseJSON) {
                    var respStatus = e.responseJSON.status,
                            respCode = e.responseJSON.code;
                    if (respStatus === statusCode.illegal) {
                        if (respCode === statusCode.expire) {
                            view.reLogin(request,options);
                        } else {
                            view.exit();
                        }
                    } else {
                        var error = [
                            '请求异常，请重试<br><cite>错误信息：</cite>'+ code 
                            ,debug()
                        ].join('');
                        view.error(error);
                        
                        typeof error === 'function' && error(res);
                    }
                } else {
                    var error = [
                        '请求异常，请重试<br><cite>错误信息：</cite>'+ code 
                        ,debug()
                    ].join('');
                    view.error(error);
                    
                    typeof error === 'function' && error(res);
                }

            }
        }, options));
    };

    //对外输出
    exports('view', view);
});

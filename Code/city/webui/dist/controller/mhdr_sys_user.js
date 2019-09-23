layui.define(function(exports) {

    layui.use(['laydate', 'table', 'upload', 'hdk'], function() {
        var $ = layui.$,
            laydate = layui.laydate,
            table = layui.table,
            setter = layui.setter,
            router = layui.router(),
            form = layui.form,
            upload = layui.upload,
            hdk = layui.hdk,
            admin = layui.admin,
            queryTimer, typingTimer, params = {},
            headers = {},
            formObject = {
                dataState: 1
            },
            formID = 'LAY-sys-user-form',
            table_id = 'LAY-sys-user';

        params[setter.request['owner']] = layui.data(setter.tableName)[setter.request['owner']];
        headers[setter.request.tokenName] = layui.data(setter.tableName)[setter.request.tokenName];
        headers[setter.request.device] = $.inArray('quick',router.path) == -1 ? setter.device.PC : setter.device.QUICK_PC;
        
        //table-init
        var user_table = table.render({
            elem: '#'+table_id
            ,page: true
            ,cols: [[
                {type:'radio'}
                ,{field: 'name', title: '用户姓名'}
                ,{field: 'workNo', title: '工号'}
                ,{field: 'levelName', title: '角色'}
                ,{field: 'enabled', templet: '#LAY-sys-user-enabled', title: '使用状态'}
            ]]
            ,toolbar: '#LAY-sys-user-toolbar'
            ,defaultToolbar: []
            ,url:'/rest/SysUserCtr/querUser'
            ,response: {
                statusCode: 200
                ,msgName: 'message'
            }
            ,method:'post'
            ,contentType: 'application/json'
            ,headers: headers
            ,where: params
            ,done:function(){
                //upload
                var uploadInst = upload.render({
                    elem: $('[lay-event=import]').get(0)
                    ,url: '/rest/SysUserCtr/uploadUser' 
                    ,headers:headers
                    ,accept:'file'
                    ,field:'file'
                    ,exts:'xls|xlsx'
                    ,data:params
                    ,done: function(result){
                        var filePath = result.data.filePath;
                        var download_from = $('<form action="' + '/rest/SysUserCtr/donwloadUser'  + '" method="post"><input type="text" name="filePath" value="' + filePath + '" /></form>');
                        $(document.body).append(download_from);
                        download_from.submit();
                        download_from.remove();
                        user_table.reload();
                    }
                    ,error: function(){
                        
                    }
                });
            }
        });
        
        //elem-event
        table.on('toolbar('+table_id+')',function(o){
            var toolbarEvent = {
                area: ['450px', '350px']
                ,btn: ['确认', '取消']
                ,content: $('#LAY-sys-user-window').html()
                ,submit: function(idx, obj){
                    form.render();
                    form.on('submit(userSubmit)', function(input) {
                        admin.req({
                            url: '/rest/SysUserCtr/saveUser'
                            ,type: 'post'
                            ,data: $.extend({
                                cd: obj && obj['cd'] ? obj['cd'] : null
                                ,password: CryptoJS.SHA256('123456') + ''
                            }, input.field)
                            ,done: function(res){
                                layer.close(idx);
                                layer.msg('操作成功!');
                                user_table.reload();
                            }
                        });
                    });
                }
                ,add:function(){
                    var that = this;
                    hdk.openWindow({
                        content: that.content
                        ,area: that.area
                        ,btn: that.btn
                        ,title:'新增用户'
                        ,yes: function(idx, layero) {
                            $('[lay-filter=userSubmit]', layero).trigger('click');
                        }
                        ,success: function(layero, idx){
                            that.submit(idx);
                        }
                    });
                }
                ,edit:function(obj){
                    var that = this;
                    hdk.openWindow({
                        content: that.content
                        ,area: that.area
                        ,btn: that.btn
                        ,title:'修改'
                        ,yes: function(idx, layero) {
                            $('[lay-filter=userSubmit]', layero).trigger('click');
                        }
                        ,success: function(layero, idx){
                            that.submit(idx,obj);
                            form.val(formID,obj);
                        }
                    });
                }
            }
            
            var checkData = table.checkStatus(o.config.id).data;
            switch (o.event){
                case 'add' :
                    toolbarEvent.add();
                    break;
                case 'edit' :
                    if (checkData.length > 0) {
                        toolbarEvent.edit(checkData[0]);
                        
                    } else {
                        layer.msg('请选择一条数据');
                    }
                    break;
                case 'password' :
                    if (checkData.length > 0) {
                        layer.confirm('确认重置该密码为123456?', function(idx){
                            admin.req({
                                url: '/rest/SysUserCtr/resetPassWord'
                                ,type: 'post'
                                ,data: {
                                    cd: checkData[0].cd
                                    ,password: CryptoJS.SHA256('123456') + ''
                                }
                                ,done: function(res){
                                    layer.close(idx);
                                    layer.msg('操作成功!');
                                    user_table.reload();
                                }
                            });
                        }); 
                    } else {
                        layer.msg('请选择一条数据');
                    }
                    break;
            }
            
        });
        
        
        form.on('switch(enabled)', function(obj){
            var idx = $(obj.elem).parents('tr').attr('data-index');
            if (obj.elem.checked === true){
                table.cache[table_id][idx].enabled = this.value.split('|')[0];
            } else {
                table.cache[table_id][idx].enabled = this.value.split('|')[1];
            }
            admin.req({
                url: '/rest/SysUserCtr/saveUser'
                ,type: 'post'
                ,data: table.cache[table_id][idx]
                ,done: function(res){}
            });
        });
        
        
        form.on('submit(userQuery)',function(o){
            user_table.reload({
                where:lay.extend(params,o.field)
            });
            return false;
        });
        
    });
    exports('mhdr_sys_user', {});
});

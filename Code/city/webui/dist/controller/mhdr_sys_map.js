layui.define(function(exports) {

    layui.use(['laydate', 'table', 'hdk'], function() {
        var $ = layui.$,
            laydate = layui.laydate,
            table = layui.table,
            setter = layui.setter,
            router = layui.router(),
            form = layui.form,
            hdk = layui.hdk,
            admin = layui.admin,
            queryTimer, typingTimer, params = {},
            headers = {},
            formObject = {
                dataState: 1
            },
            formID = 'LAY-sys-map-query-form',
            inner_table_id = 'LAY-sys-map-inner',
            center_table_id = 'LAY-sys-map-center';

        params[setter.request['owner']] = layui.data(setter.tableName)[setter.request['owner']];
        headers[setter.request.tokenName] = layui.data(setter.tableName)[setter.request.tokenName];
        headers[setter.request.device] = $.inArray('quick',router.path) == -1 ? setter.device.PC : setter.device.QUICK_PC;
        
        //dict-init
        hdk.renderDict({
            elem: formID,
            done: function() {}
        });

        //table-init
        //center
        var center_table = table.render({
                elem: '#'+center_table_id
                ,page: true
                ,cols: [[
                    {field: 'Cd', title: '编号'}
                    ,{field: 'Nam', title: '字典名称'}
                    ,{field: 'MenCode', title: '助记码'}
                    ,{field: 'DictTpNam', title: '字典类型名称'}
                    ,{field: 'State', title: '使用状态',templet:function(d){
                        if (d.Effect) {
                            return d.Effect;
                        } else {
                            return d.State;
                        }
                    }}
                ]]
                ,data:[]
            }),
            inner_table = table.render({
                elem: '#'+inner_table_id
                ,page: false
                ,cols: [[
                    {field: 'codeValue', title: '编号', edit: 'text'}
                    ,{field: 'codeName', title: '名称', edit: 'text'}
                    ,{field: 'dataState', templet: '#LAY-sys-map-inner-dataState', title: '使用状态'},
                    ,{title: '操作', toolbar: function(){
                        return '<div><button lay-event="add" class="layui-btn layui-btn-xs">删除</button></div>';
                    }()}
                ]]
                ,data:[]
                ,defaultToolbar:false
            });




        //elem-event
        // form.on('select(dictType)', function(o) {
        //     o.value;
        // });

        form.on('submit(mapQuery)', function(o) {
            hdk.getDict({
                dict: o.field['dictType'],
                done: function(json) {
                    center_table.reload({
                        data: json
                        ,page: {
                            curr: 1
                        }
                    });
                    inner_table.reload({
                        data: []
                        ,url:''
                        ,toolbar: function() {
                            return '';
                        }()
                        ,done: function() {
                            formObject.dictType = null;
                            formObject.codeMap = null;
                        }
                    });
                }
            });
        });

        table.on('row('+center_table_id+')', function(o) {
            $(o.tr).addClass('hyd-table-click-background').siblings('tr').removeClass('hyd-table-click-background');
            inner_table.reload({
                url: '/rest/SysUserCtr/queryDictEntitys',
                method: 'POST',
                contentType: 'application/json',
                response: {
                    statusCode: 200,
                    msgName: 'message'
                },
                headers: headers,
                where: lay.extend({}, params, {
                    dictType: o.data['DictTpCd'],
                    codeMap: o.data['Cd']
                }),
                toolbar: function() {
                    return '1' === o.data['State'] || '启用' === o.data['Effect'] ?
                        '<div><button lay-event="add" class="layui-btn">添加</button></div>' :
                        '';
                }(),
                done: function() {
                    formObject.dictType = o.data['DictTpCd'];
                    formObject.codeMap = o.data['Cd'];
                }
            });
        });

        table.on('toolbar('+inner_table_id+')', function(o) {
            hdk.openWindow({
                content: $('#LAY-sys-map-inner-window').html()
                ,area: ['450px', '250px']
                ,btn: ['确认', '取消']
                ,yes: function(idx, layero) {
                    $('[lay-filter=innerSubmit]', layero).trigger('click');
                }
                ,success: function(layero, idx){
                    form.on('submit(innerSubmit)', function(o) {
                        admin.req({
                            url: '/rest/SysUserCtr/saveDictEntity'
                            ,type: 'post'
                            ,data: $.extend(formObject, o.field)
                            ,done: function(res){
                                layer.close(idx);
                                layer.msg('操作成功!');
                                inner_table.reload();
                            }
                        });
                    });
                }
            });
        });
        
        table.on('tool('+inner_table_id+')', function(o) {
            layer.confirm('确认删除该条数据？'
            ,function(idx, layero){
                admin.req({
                    url: '/rest/SysUserCtr/delDictEntity'
                    ,type: 'post'
                    ,data: {cd:o.data.cd}
                    ,done: function(res){
                        o.del();
                        layer.close(idx);
                        layer.msg('操作成功!');
                    }
                });
            }
            ,function(index){
                
            });
        });
        
        table.on('edit('+inner_table_id+')', function(obj){
            admin.req({
                url: '/rest/SysUserCtr/saveDictEntity'
                ,type: 'post'
                ,data: obj.data
                ,done: function(res){}
            });
        });
        
        form.on('switch(dataState)', function(obj){
            var idx = $(obj.elem).parents('tr').attr('data-index');
            if (obj.elem.checked === true){
                table.cache[inner_table_id][idx].dataState = this.value.split('|')[0];
            } else {
                table.cache[inner_table_id][idx].dataState = this.value.split('|')[1];
            }
            admin.req({
                url: '/rest/SysUserCtr/saveDictEntity'
                ,type: 'post'
                ,data: table.cache[inner_table_id][idx]
                ,done: function(res){}
            });
        });
        
        
    });
    exports('mhdr_sys_map', {});
});

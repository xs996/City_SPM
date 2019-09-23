layui.define(function(exports){
    
    layui.use(['laydate','table','element','hdk'], function(){
        var $ = layui.$
        ,laydate = layui.laydate
        ,router = layui.router()
        ,table = layui.table
        ,setter = layui.setter
        ,form = layui.form
        ,element = layui.element
        ,hdk = layui.hdk
        ,admin = layui.admin
        ,params = {}
        ,headers = {}
        ,userInfo = {}
        ,thisTab = 0;

        params['relateLinkNum'] = layui.data(setter.tableName)['out_patinfo_relateLinkNum'];

        params[setter.request['owner']] = layui.data(setter.tableName)[setter.request['owner']];
        headers[setter.request.tokenName] = layui.data(setter.tableName)[setter.request.tokenName];
        headers[setter.request.device] = $.inArray('quick',router.path) == -1 ? setter.device.PC : setter.device.QUICK_PC;
        userInfo = layui.data(setter.tableName)[setter.request.userInfo];

        if (router.search && router.search.relateLinkNum) {
            params['relateLinkNum'] = router.search.relateLinkNum;
            $('[lay-filter=LAY-report-patinfo-query-form] input[name=relateLinkNum]').val(params['relateLinkNum']);
            layui.data(setter.tableName)['out_patinfo_relateLinkNum'] = params['relateLinkNum'];
        }

        if (!params['relateLinkNum']) {
            $('[lay-filter=LAY-report-patinfo-tab]').addClass('hyd-no-add');
        }
        if (userInfo.levelCd < 2) {
            $('[lay-filter=LAY-report-patinfo-tab]').addClass('hyd-no-audit ');
        }
        form.render();

        // 创建时间
        laydate.render({
            elem: '#createDate'
            ,max: 0
            ,range: true
            ,done: function(o) {
            }
        });

        // 未审核
        table.render({
            elem: '#LAY-report-patinfo-unaudit'
            ,url: '/rest/ReportCtr/queryOutPatInfos' //模拟接口
            ,toolbar: '#LAY-report-patinfo-unaudit-header-toolbar'
            ,method: 'POST'
            ,contentType: 'application/json'
            ,where: lay.extend({},params,{reportStatus:'待审核'})
            ,response: {
                statusCode: 200
                ,msgName: 'message'
            }
            ,headers: headers
            ,defaultToolbar: []
            ,page: true
            ,cols: [[
                {type: 'checkbox', fixed: 'left'}
                ,{field: 'cd', title: '编号', minWidth: 120}
                ,{field: 'relateLinkNum', title: '省网报告卡号', minWidth: 80}
                ,{field: 'patName', title: '姓名', minWidth: 80}
                ,{field: 'patSex', title: '性别', width: 60}
                ,{field: 'patDisease', title: '疾病名称'}
                ,{field: 'createTime', title: '创建时间'}
                ,{field: 'reportStatus', title: '状态'}
                ,{fixed: 'right', minWidth:120, align:'center', toolbar: '#LAY-report-patinfo-unaudit-toolbar'}
            ]]
            ,skin: 'line'
        });
        
        // 已审核
        table.render({
            elem: '#LAY-report-patinfo-audited'
            ,url: '/rest/ReportCtr/queryOutPatInfos'
            ,method: 'POST'
            ,contentType: 'application/json'
            ,where: lay.extend({},params,{reportStatus:'已审核'})
            ,response: {
                statusCode: 200
                ,msgName: 'message'
            }
            ,headers: headers
            ,page: true
            ,cols: [[
                {type: 'numbers', fixed: 'left'}
                ,{field: 'cd', title: '编号', minWidth: 120}
                ,{field: 'relateLinkNum', title: '省网报告卡号', minWidth: 80}
                ,{field: 'patName', title: '姓名', minWidth: 80}
                ,{field: 'patSex', title: '性别', width: 60}
                ,{field: 'patDisease', title: '疾病名称'}
                ,{field: 'auditTime', title: '审核时间'}
                ,{field: 'postStatus', title: '状态'}
                ,{fixed: 'right',minWidth:120, align:'center', toolbar: '#LAY-report-patinfo-audited-toolbar'}
            ]]
            ,skin: 'line'
        });

        // 提交
        form.on('submit(reportQuery)', function(o){
            var filter = thisTab ? 'LAY-report-patinfo-audited':'LAY-report-patinfo-unaudit';
            if (o.field.createTime) {
                o.field.createTimeStart = moment(o.field.createTime.split(' - ')[0]).unix();
                o.field.createTimeEnd = moment(o.field.createTime.split(' - ')[1] + ' 23:59:59').unix();
            }

            table.reload(filter, {
                page: {
                    curr: 1
                }
                ,where: lay.extend({},params, o.field, {reportStatus: thisTab?'已审核':'待审核'})
            });
            
        });

        // 重置
        form.on('submit(reportReset)', function(o){
            $('[lay-filter=LAY-report-patinfo-query-form] input').val(null);
            $('[lay-filter=LAY-report-patinfo-query-form] input[name=patSex]')[0].checked = true;
            form.render();
        });

        // tool
        table.on('tool(LAY-report-patinfo-unaudit)', function(o) {
            switch(o.event) {
                case 'detail':
                    if (userInfo.levelCd > 1 || o.data.reportStatus === '未审核') {
                        location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo_add/cd=' + o.data.cd);
                    } else {
                        location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo_view/cd=' + o.data.cd);
                    }
                    break;
                case 'audit':
                     if (userInfo.levelCd > 1) {
                        layer.confirm('是否审核该条记录?', {}, function(index) {
                            admin.req({
                                url: '/rest/ReportCtr/auditOutPatInfo'
                                ,type: 'post'
                                ,data: {
                                    cd: o.data.cd
                                }
                                ,done: function(res) {
                                    layer.msg('审核成功');
                                    $('[lay-filter=reportQuery]').click();
                                }
                            });
                            layer.close(index);
                        });
                     }
                    break;
                case 'del':
                    layer.confirm('是否删除该条记录?', {}, function(index) {
                        admin.req({
                            url: '/rest/ReportCtr/deleteOutPatInfo'
                            ,type: 'post'
                            ,data: {
                                cd: o.data.cd
                            }
                            ,done: function(res) {
                                layer.msg('删除成功');
                                $('[lay-filter=reportQuery]').click();
                            }
                        });
                        layer.close(index);
                    });
                    break;
                default:
                    break;
            }
        });

        table.on('tool(LAY-report-patinfo-audited)', function(o) {
            switch(o.event) {
                case 'upload':
                    if (userInfo.levelCd < 2) return;
                    layer.confirm('是否重新上传?', {}, function(index) {
                        admin.req({
                            url: '/rest/ReportCtr/postOutPatInfo'
                            ,type: 'post'
                            ,data: {
                                cd: o.data.cd
                            }
                            ,done: function(res) {
                                layer.msg('重新上传成功');
                                $('[lay-filter=reportQuery]').click();
                            }
                        });
                        layer.close(index);
                    });
                    break;
                case 'detail':
                    if (o.data.postStatus === '待上传') {
                        location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo_add/cd=' + o.data.cd);
                    } else {
                        location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo_view/cd=' + o.data.cd);
                    }
                    break;
                default:
                    break;
            }
        });

        // toolbar
        table.on('toolbar(LAY-report-patinfo-unaudit)', function(o) {
            var checkStatus = table.checkStatus(o.config.id);
            switch(o.event) {
                case 'add':
                    var data = checkStatus.data;
                    location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo_add/relateLinkNum='+params['relateLinkNum']);
                    
                    break;
                case 'batch-audit':
                    var data = checkStatus.data;
                    if (userInfo.levelCd < 2) return;
                    if (data.length) {
                        layer.confirm('是否审核已选中的记录?', {}, function(index) {
                            layui.each(data, function(idx, row) {
                                admin.req({
                                    url: '/rest/ReportCtr/auditOutPatInfo'
                                    ,type: 'post'
                                    ,data: {
                                        cd: row.cd
                                    }
                                    ,done: function(res) {

                                    }
                                });
                            })
                            $('[lay-filter=reportQuery]').click();
                            layer.close(index);
                        });
                    } else {
                        layer.msg('请选择需要审核的记录');
                    }
                    break;
                case 'batch-del':
                    var data = checkStatus.data;
                    if (data.length) {
                        layer.confirm('是否删除已选中的记录?', {}, function(index) {
                            layui.each(data, function(idx, row) {
                                admin.req({
                                    url: '/rest/ReportCtr/deleteOutPatInfo'
                                    ,type: 'post'
                                    ,data: {
                                        cd: row.cd
                                    }
                                    ,done: function(res) {

                                    }
                                });
                            })
                            $('[lay-filter=reportQuery]').click();
                            layer.close(index);
                        });
                    } else {
                        layer.msg('请选择需要删除的记录');
                    }
                    break;
                default:
                    break;
            };
        });

        element.on('tab(LAY-report-patinfo-tab)', function(o) {
            thisTab = o.index;
            $('[lay-filter=reportQuery]').click();
        });

    });
    
    exports('mhdr_report_out_patinfo', {})
});
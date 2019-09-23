layui.define(function(exports){
    
    layui.use(['laydate','table','hdk'], function(){
        var $ = layui.$
        ,laydate = layui.laydate
        ,table = layui.table
        ,setter = layui.setter
        ,router = layui.router()
        ,form = layui.form
        ,hdk = layui.hdk
        ,admin = layui.admin
        ,inputQuery
        ,queryTimer,typingTimer
        ,params = {}
        ,headers = {}
        ,formObject = {}
        ,durgData = []
        ,drugGuideData = []
        ,isQuickMode = false
        ,formID = 'LAY-report-patinfo-view-form'
        ,drugTableID = 'LAY-report-patinfo-view-drug'
        ,drugGuideTableID = 'LAY-report-patinfo-view-drug-guide';

        $('*[lay-verify]', '[lay-filter=' + formID + ']').each(function(idx, elem) {
            $(elem).removeAttr('lay-verify');
        });

        if (router.search && router.search.p1) {
            isQuickMode = true;
            layer.msg('已进入Quick模式, 请配置自动查询接口');
        }

        params[setter.request['owner']] = layui.data(setter.tableName)[setter.request['owner']];
        headers[setter.request.tokenName] = layui.data(setter.tableName)[setter.request.tokenName];
        headers[setter.request.device] = $.inArray('quick',router.path) == -1 ? setter.device.PC : setter.device.QUICK_PC;

        formObject = {
            ZoneCd: layui.data(setter.tableName)[setter.request.userInfo].ZoneCd
            ,ZoneNam: layui.data(setter.tableName)[setter.request.userInfo].ZoneNam
            ,OrganCd: layui.data(setter.tableName)[setter.request.userInfo].OrganCd
            ,OrgNam: layui.data(setter.tableName)[setter.request.userInfo].OrgNam
            ,FillDoctorNam: layui.data(setter.tableName)[setter.request.userInfo].name
            ,FillDate: moment().format('YYYY-MM-DD')
        };

        if (router.search && router.search.cd) {
            admin.req({
                url: '/rest/ReportCtr/getOutPatInfo'
                ,type: 'post'
                ,async: false
                ,data: router.search
                ,done: function(res) {
                    if (res.data.length) {
                        formObject = res.data[0].reportData;
                        formObject.cd = router.search.cd;

                        layui.each(formObject.MedList, function(idx, med) {
                                if (med.Type === 'FUMedTp001') {
                                    durgData.push(med);
                                } else if (med.Type === 'FUMedTp002') {
                                    drugGuideData.push(med);
                                }
                        });
                    }
                }
            });

            admin.req({
                url: '/rest/ReportCtr/getLogs'
                ,type: 'post'
                ,data: router.search
                ,done: function(res) {
                    if (res.data.length) {
                        var timelineEl = '<ul class="layui-timeline hyd-timeline"></ul>';
                        layui.each(res.data, function(idx, item) {
                            var tpl = '<li class="layui-timeline-item"><i class="layui-icon layui-timeline-axis">&#xe63f;</i><div class="layui-timeline-content layui-text"><div class="layui-timeline-title">' + item.createTime + '</div><p>' + item.actor + ' - ' + item.status + '</p>' + (item.notes ? '<p>' + item.notes + '</p>' : '') + '</div></li>';
                            timelineEl = $(timelineEl).append(tpl).prop("outerHTML");
                        });

                        layer.open({
                            title: '操作记录'
                            ,type: 1
                            ,shade: 0
                            ,shadeClose: true
                            ,offset: 'r'
                            ,skin: 'hyd-ui-air'
                            ,area: ['200px']
                            ,content: timelineEl
                            ,success: function(layero, idx) {

                            }
                        })
                    }
                }
            });
        }

        hdk.initICD10();
        hdk.initDrugData();
        hdk.initGender();
        hdk.initWhether();
        if (formObject.OtherMeasure) {
            $('[lay-filter=Add_OtherMeasure]').removeClass('layui-hide').attr('lay-verify', 'required|OtherMeasure');
        }

        // 初始化字典
        hdk.renderDict({
            elem: formID
            ,done: function(field) {
                var fo = {};
                if (formObject[field]) {
                    fo[field] = formObject[field];
                    form.val(formID, fo);
                }

                if (field === 'RiskActCdBox' && formObject.RiskActCd) {
                    layui.each(formObject.RiskActCd.split(','), function(idx, key) {
                        $('[lay-filter=' + field + '][hyd-key=' + key + ']').prop('checked', true);
                    });
                    layui.form.render('checkbox');
                }

                if (field === 'MeasuresCdBox' && formObject.MeasuresCd) {
                    layui.each(formObject.MeasuresCd.split(','), function(idx, key) {
                        $('[lay-filter=' + field + '][hyd-key=' + key + ']').prop('checked', true);
                    });
                    layui.form.render('checkbox');
                }
            }
        });

        form.render();

        form.val(formID, formObject);

        // 初始化用药情况
        table.render({
            elem: '#' + drugTableID
            ,page: false
            ,minWidth: 600
            ,cellMinWidth: 40
            ,data: durgData
            ,defaultToolbar: []
            ,cols: [[
                {field:'vDrug', minWidth:230, templet: '#LAY-report-patinfo-view-drug-column'}
                ,{field:'lbDrugSpecifications',align:'center', width:40}
                ,{field:'vDrugSpecifications',minWidth:280, templet: '#LAY-report-patinfo-view-drug-radio-column'}
                ,{field:'lb1',align:'center'}
                ,{field:'v1',align:'center', minWidth:100, edit: 'text'}
                ,{field:'lb1Unit',align:'center'}
                ,{field:'lb2',align:'center'}
                ,{field:'v2',align:'center', minWidth:100, edit: 'text'}
                ,{field:'lb2Unit',align:'center'}
                ,{field:'lb3',align:'center'}
                ,{field:'v3',align:'center', minWidth:100, edit: 'text'}
                ,{field:'lb3Unit',align:'center'}
            ]]
            ,limit: 100
            ,done: function(res) {
                layui.each(res.data, function(i, d) {
                    if (d.isLong) {
                        $('[lay-id=' + drugTableID + '] tr[data-index='+i+'] td[data-field=v3]').removeAttr('data-edit').remove();
                        $('[lay-id=' + drugTableID + '] tr[data-index='+i+'] td[data-field=lb3Unit]').remove();
                        $('[lay-id=' + drugTableID + '] tr[data-index='+i+'] td[data-field=lb3]').attr('colspan',3);
                    }
                });
            }
        });

        // 用药指导
        table.render({
            elem: '#' + drugGuideTableID
            ,page: false
            ,minWidth: 600
            ,cellMinWidth: 40
            ,data: drugGuideData
            ,defaultToolbar: []
            ,cols: [[
                {field:'vDrug', minWidth:230, templet: '#LAY-report-patinfo-view-drug-guide-column'}
                ,{field:'lbDrugSpecifications',align:'center', width:40}
                ,{field:'vDrugSpecifications',minWidth:280, templet: '#LAY-report-patinfo-view-drug-guide-radio-column'}
                ,{field:'lb1',align:'center'}
                ,{field:'v1',align:'center', minWidth:100, edit: 'text'}
                ,{field:'lb1Unit',align:'center'}
                ,{field:'lb2',align:'center'}
                ,{field:'v2',align:'center', minWidth:100, edit: 'text'}
                ,{field:'lb2Unit',align:'center'}
                ,{field:'lb3',align:'center'}
                ,{field:'v3',align:'center', minWidth:100, edit: 'text'}
                ,{field:'lb3Unit',align:'center'}
            ]]
            ,limit: 100
            ,done: function(res) {
                layui.each(res.data, function(i, d) {
                    if (d.isLong) {
                        $('[lay-id=' + drugGuideTableID + '] tr[data-index='+i+'] td[data-field=v3]').removeAttr('data-edit').remove();
                        $('[lay-id=' + drugGuideTableID + '] tr[data-index='+i+'] td[data-field=lb3Unit]').remove();
                        $('[lay-id=' + drugGuideTableID + '] tr[data-index='+i+'] td[data-field=lb3]').attr('colspan',3);
                    }
                });
            }
        });

        $('[lay-filter=' + formID + ']').on('click', '[lay-filter=report-patinfo-view-back]', function(o) {
            var relateLinkNum = $('[lay-filter=Add_relateLinkNum]').val();
            if (relateLinkNum) {
                location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo/relateLinkNum=' + relateLinkNum);
            } else {
                location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo');
            }
        });
    });
    
    exports('mhdr_report_out_patinfo_view', {})
});
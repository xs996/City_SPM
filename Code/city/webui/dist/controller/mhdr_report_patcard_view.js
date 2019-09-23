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
        ,isQuickMode = false
        ,formID = 'LAY-report-patcard-view-form'
        ,drugTableID = 'LAY-report-patcard-view-drug';

        $('*[lay-verify]', '[lay-filter=' + formID + ']').each(function(idx, elem) {
            $(elem).removeAttr('lay-verify');
        });

        params[setter.request['owner']] = layui.data(setter.tableName)[setter.request['owner']];
        headers[setter.request.tokenName] = layui.data(setter.tableName)[setter.request.tokenName];
        headers[setter.request.device] = $.inArray('quick',router.path) == -1 ? setter.device.PC : setter.device.QUICK_PC;

        if (router.search && router.search.p1) {
            isQuickMode = true;
            layer.msg('已进入Quick模式, 请配置自动查询接口');
        }
        
        if (router.search && router.search.cd) {
            admin.req({
                url: '/rest/ReportCtr/getPatCard'
                ,type: 'post'
                ,async: false
                ,data: router.search
                ,done: function(res) {
                    if (res.data.length) {
                        formObject = res.data[0].reportData;
                        formObject.cd = router.search.cd;
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

        params[setter.request['owner']] = layui.data(setter.tableName)[setter.request['owner']];
        headers[setter.request.tokenName] = layui.data(setter.tableName)[setter.request.tokenName];
        hdk.initICD10();
        hdk.initDrugData();
        hdk.initPrecision();
        hdk.initGender();
        hdk.initWhether(function() {
            if (formObject.IfCureCd && formObject.IfCureCd === hdk.whether['是'].Cd) {
                $('#FirstCureTime_Section').removeClass('layui-hide');
            }
        });

        if (formObject.SenderOther) {
            $('[lay-filter=Add_SenderOther]').removeClass('layui-hide');
        }
        hdk.initAddressData(function() {
            hdk.renderOption('Add_DProvinceCd', hdk.getZoneData('RegLevel001', ''));
            hdk.renderOption('Add_DCityCd', hdk.getZoneData('RegLevel002', formObject.DProvinceCd));
            hdk.renderOption('Add_DCountyCd', hdk.getZoneData('RegLevel003', formObject.DCityCd));
            hdk.renderOption('Add_DTownCd', hdk.getZoneData('RegLevel004', formObject.DCountyCd));

            hdk.renderOption('Add_LProvinceCd', hdk.getZoneData('RegLevel001', ''));
            hdk.renderOption('Add_LCityCd', hdk.getZoneData('RegLevel002', formObject.LProvinceCd));
            hdk.renderOption('Add_LCountyCd', hdk.getZoneData('RegLevel003', formObject.LCityCd));
            hdk.renderOption('Add_LTownCd', hdk.getZoneData('RegLevel004', formObject.LCountyCd));

            form.render('select', formID);

            form.val(formID, {
                DProvinceCd: formObject.DProvinceCd
                ,DCityCd: formObject.DCityCd
                ,DCountyCd: formObject.DCountyCd
                ,DTownCd: formObject.DTownCd
                ,LProvinceCd: formObject.LProvinceCd
                ,LCityCd: formObject.LCityCd
                ,LCountyCd: formObject.LCountyCd
                ,LTownCd: formObject.LTownCd
            });
        });

        // 初始化字典
        hdk.renderDict({
            elem: formID
            ,done: function(field) {
                var fo = {};
                if (formObject[field]) {
                    fo[field] = formObject[field];
                    form.val(formID, fo);
                }

                if (field === 'RegistertypeCd' && formObject.RegistertypeCd === 'ResidenceTp004') {
                    $('[lay-filter=Add_UnknownCause]').removeClass('layui-hide');
                }

                if (field === 'RiskActCdBox' && formObject.RiskActCd) {
                    layui.each(formObject.RiskActCd.split(','), function(idx, key) {
                        $('[lay-filter=' + field + '][hyd-key=' + key + ']').prop('checked', true);
                    });
                }

                if (field === 'SenderBodyStrBox' && formObject.SenderBodyStr) {
                    layui.each(formObject.SenderBodyStr.split(','), function(idx, key) {
                        $('[lay-filter=' + field + '][hyd-key=' + key + ']').prop('checked', true);
                    });
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
            ,data: formObject.MedList || []
            ,defaultToolbar: []
            ,cols: [[
                {field:'vDrug', minWidth:230, templet: '#LAY-report-patcard-view-drug-column'}
                ,{field:'lbDrugSpecifications',align:'center', width:40}
                ,{field:'vDrugSpecifications',minWidth:280, templet: '#LAY-report-patcard-view-drug-radio-column'}
                ,{field:'lb1',align:'center'}
                ,{field:'v1',align:'center', minWidth:100}
                ,{field:'lb1Unit',align:'center'}
                ,{field:'lb2',align:'center'}
                ,{field:'v2',align:'center', minWidth:100}
                ,{field:'lb2Unit',align:'center'}
                ,{field:'lb3',align:'center'}
                ,{field:'v3',align:'center', minWidth:100}
                ,{field:'lb3Unit',align:'center'}
            ]]
            ,limit: 6
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


        // 初始化初次发布时间
        var initDateOption = function(filter, unit, min, max) {
            if (unit === 'year') {
                var minYear = min || 1900,
                    maxYear = max  || moment().year();
                $('[lay-filter=' + filter + ']').empty();
                $('[lay-filter=' + filter + ']').append('<option value="">请选择</option>');
                for(var year=maxYear; year>=minYear; year--) {
                    $('[lay-filter=' + filter + ']').append('<option value="' + year + '">' + year + '</option>');
                }
                form.render('select', formID);
            } else if (unit === 'month') {
                var minMonth = min || 1,
                    maxMonth = max  || 12;
                $('[lay-filter=' + filter + ']').empty();
                $('[lay-filter=' + filter + ']').append('<option value="">不详</option>');
                for(var month=minMonth; month<=maxMonth; month++) {
                    $('[lay-filter=' + filter + ']').append('<option value="' + month + '">' + month + '</option>');
                }
                form.render('select', formID);
            } else if (unit === 'day') {
                var minDay = min || 1,
                    maxDay = max  || 12;
                $('[lay-filter=' + filter + ']').empty();
                $('[lay-filter=' + filter + ']').append('<option value="">不详</option>');
                for(var day=minDay; day<=maxDay; day++) {
                    $('[lay-filter=' + filter + ']').append('<option value="' + day + '">' + day + '</option>');
                }
                form.render('select', formID);
            }
        };

        var setDateValue = function(filter) {
            var year,month,day,date,precision;
            if (filter === 'FirstOnsetDate') {
                year = $('[lay-filter=Add_FirstOnsetYear]').val();
                month = $('[lay-filter=Add_FirstOnsetMon]').val();
                day = $('[lay-filter=Add_FirstOnsetDay]').val();

                if (month && day) {
                    precision = hdk.precision['时间准确'];
                    date = moment([year, month, day]).format('YYYY-MM-DD');
                } else if (month && !day) {
                    precision = hdk.precision['日不详'];
                    date = moment([year, month, 1]).format('YYYY-MM-DD');
                } else {
                    precision = hdk.precision['月不详'];
                    date = moment([year, month || 1, day || 1]).format('YYYY-MM-DD');
                }

                $('[lay-filter=Add_FirstOnsetDate]').val(date);
                $('[lay-filter=Add_AccuracyCd]').val(precision);


            } else if (filter === 'FirstCureTime') {
                year = $('[lay-filter=Add_FirstCureTimeYear]').val();
                month = $('[lay-filter=Add_FirstCureTimeMonth]').val();
                day = $('[lay-filter=Add_FirstCureTimeDay]').val();

                if (month && day) {
                    precision = hdk.precision['时间准确'];
                    date = moment([year, month, day]).format('YYYY-MM-DD');
                } else if (month && !day) {
                    precision = hdk.precision['日不详'];
                    date = moment([year, month, 1]).format('YYYY-MM-DD');
                } else {
                    precision = hdk.precision['月不详'];
                    date = moment([year, month || 1, day || 1]).format('YYYY-MM-DD');
                }

                $('[lay-filter=Add_FirstCureTime]').val(date);
                $('[lay-filter=Add_FstCureAccCd]').val(precision);
            }
        }

        initDateOption('Add_FirstOnsetYear', 'year', moment(formObject.BirthDate || '1900-01-01').year());
        initDateOption('Add_FirstOnsetMon', 'month');

        if (formObject.FirstOnsetDay) {
            initDateOption('Add_FirstOnsetDay', 'day', moment(formObject.FirstOnsetDate).startOf('month').date(), moment(formObject.FirstOnsetDate).endOf('month').endOf('month').date());
        }
        
        initDateOption('Add_FirstCureTimeYear', 'year', moment(formObject.BirthDate || formObject.FirstOnsetDate || '1900-01-01').year());
        initDateOption('Add_FirstCureTimeMonth', 'month');

        if (formObject.FirstCureTimeDay) {
            initDateOption('Add_FirstCureTimeDay', 'day', moment(formObject.FirstCureTime).startOf('month').date(), moment(formObject.FirstCureTime).endOf('month').endOf('month').date());
        }

        form.val(formID, {
            FirstOnsetYear: formObject.FirstOnsetYear
            ,FirstOnsetMon: formObject.FirstOnsetMon
            ,FirstOnsetDay: formObject.FirstOnsetDay
            ,FirstCureTimeYear: formObject.FirstCureTimeYear
            ,FirstCureTimeMonth: formObject.FirstCureTimeMonth
            ,FirstCureTimeDay: formObject.FirstCureTimeDay
        });
    
        $('[lay-filter=' + formID + ']').on('click', '[lay-filter=report-patcard-add-back]', function(o) {
            location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_patcard');
        });
    });
    
    exports('mhdr_report_patcard_view', {})
});
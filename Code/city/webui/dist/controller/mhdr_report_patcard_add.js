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
        ,sfzTpCd = 'CertType001'
        ,formID = 'LAY-report-patcard-add-form'
        ,drugTableID = 'LAY-report-patcard-add-drug';
        
        params[setter.request['owner']] = layui.data(setter.tableName)[setter.request['owner']];
        headers[setter.request.tokenName] = layui.data(setter.tableName)[setter.request.tokenName];
        headers[setter.request.device] = $.inArray('quick',router.path) == -1 ? setter.device.PC : setter.device.QUICK_PC;
        
        formObject = {
            ZoneCd: layui.data(setter.tableName)[setter.request.userInfo].ZoneCd
            ,ZoneNam: layui.data(setter.tableName)[setter.request.userInfo].ZoneNam
            ,OrganCd: layui.data(setter.tableName)[setter.request.userInfo].OrganCd
            ,OrgNam: layui.data(setter.tableName)[setter.request.userInfo].OrgNam
            ,Province: layui.data(setter.tableName)[setter.request.userInfo].Province
            ,City: layui.data(setter.tableName)[setter.request.userInfo].City
            ,NationalityCd: 'Nationality000'
            ,FillCardDoc: layui.data(setter.tableName)[setter.request.userInfo].name
            ,FillCardDate: moment().format('YYYY-MM-DD')
            ,DiagnosisHos:'广元市精神卫生中心'
        };

        if (router.search && router.search.p1) {
            isQuickMode = true;
            $('[name=AdmCd]').val(decodeURIComponent(router.search.p1));
            admin.req({
                url: '/rest/ThridCtr/queryAdms'
                ,type: 'post'
                ,async: false
                ,data: {queryString: $('input[name=AdmCd]').val()}
                ,done: function(res) {
                    if (res.data.length) {
                        formObject = $.extend(formObject,res.data[0]);
                    }
                }
            });
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

        hdk.initICD10();
        hdk.initDrugData();
        hdk.initPrecision();
        hdk.initGender();
        hdk.initWhether(function() {
            if (formObject.IfCureCd && formObject.IfCureCd === hdk.whether['是'].Cd) {
                $('[lay-filter=Add_FirstCureTimeYear]').attr('lay-verify', 'required|FirstCureTimeYear');
                $('#FirstCureTime_Section').removeClass('layui-hide');
            }
        });

        if (formObject.SenderOther) {
            $('[lay-filter=Add_SenderOther]').removeClass('layui-hide').attr('lay-verify', 'required|SenderOther');
        }
        if (formObject.IDTypeCd === sfzTpCd) {
            $('[lay-filter=Add_NationalityCd]').attr('disabled', true).addClass('layui-disabled');
        }
        hdk.initAddressData(function() {
            hdk.renderOption('Add_DProvinceCd', hdk.getZoneData('RegLevel001', ''));
            hdk.renderOption('Add_DCityCd', hdk.getZoneData('RegLevel002', formObject.DProvinceCd || formObject.Province));
            hdk.renderOption('Add_DCountyCd', hdk.getZoneData('RegLevel003', formObject.DCityCd || formObject.City));
            hdk.renderOption('Add_DTownCd', hdk.getZoneData('RegLevel004', formObject.DCountyCd || formObject.ZoneCd));

            hdk.renderOption('Add_LProvinceCd', hdk.getZoneData('RegLevel001', ''));
            hdk.renderOption('Add_LCityCd', hdk.getZoneData('RegLevel002', formObject.LProvinceCd || formObject.Province));
            hdk.renderOption('Add_LCountyCd', hdk.getZoneData('RegLevel003', formObject.LCityCd || formObject.City));
            hdk.renderOption('Add_LTownCd', hdk.getZoneData('RegLevel004', formObject.LCountyCd || formObject.ZoneCd));

            form.render('select', formID);

            form.val(formID, {
                DProvinceCd: formObject.DProvinceCd || formObject.Province
                ,DCityCd: formObject.DCityCd || formObject.City
                ,DCountyCd: formObject.DCountyCd || formObject.ZoneCd
                ,DTownCd: formObject.DTownCd
                ,LProvinceCd: formObject.LProvinceCd || formObject.Province
                ,LCityCd: formObject.LCityCd || formObject.City
                ,LCountyCd: formObject.LCountyCd || formObject.ZoneCd
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
                    form.render('checkbox');
                }

                if (field === 'SenderBodyStrBox' && formObject.SenderBodyStr) {
                    layui.each(formObject.SenderBodyStr.split(','), function(idx, key) {
                        $('[lay-filter=' + field + '][hyd-key=' + key + ']').prop('checked', true);
                    });
                    form.render('checkbox');
                }
                
                if (field === 'DAddrTpCd') {
                    if (formObject.DAddrTpCd) {
                        $('[name=DAddrTpCd]').next().find('dd[lay-value='+formObject.DAddrTpCd+']').trigger('click');
                    } else {
                        $('[name=DAddrTpCd]').next().find('dd[lay-value=PatBelongs001]').trigger('click');
                    }
                }
                
                if (field === 'LAddrTpCd') {
                    if (formObject.LAddrTpCd) {
                        $('[name=LAddrTpCd]').next().find('dd[lay-value='+formObject.LAddrTpCd+']').trigger('click');
                    } else {
                        $('[name=LAddrTpCd]').next().find('dd[lay-value=PatBelongs001]').trigger('click');
                    }
                }
                
                if (field == 'IfNomedication') {
                    $('[name=IfNomedication][value='+formObject.IfNomedication+']').next().trigger('click');
                }
                
                
            }
        });

        form.render();

        form.val(formID, formObject);

        // 初始化用药情况
        table.render({
            elem: '#' + drugTableID
            ,toolbar: '#LAY-report-patcard-add-drug-header-toolbar'
            ,page: false
            ,minWidth: 600
            ,cellMinWidth: 40
            ,data: formObject.MedList || []
            ,defaultToolbar: []
            ,cols: [[
                {fixed: 'left',align:'center', toolbar: '#LAY-report-patcard-add-drug-toolbar'}
                ,{field:'vDrug', minWidth:230, templet: '#LAY-report-patcard-add-drug-column'}
                ,{field:'lbDrugSpecifications',align:'center', width:40}
                ,{field:'vDrugSpecifications',minWidth:280, templet: '#LAY-report-patcard-add-drug-radio-column'}
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
        
        
        
        

        // 提交验证
        form.verify({
            PatNam: function(value, item) {
                if (value && value.length > 10) {
                    return '该项最大只能10位长度';
                }
            }
            ,UnknownCause: function(value, item) {
                if (value && value.length > 100) {
                    return '该项最大只能100位长度';
                }
            }
            ,IDCode: function(value, item) {
                if (!hdk.REGEX.identity.test(value)) {
                    return '请输入正确的身份证号';
                }
            }
            ,GuardianNam: function(value, item) {
                if (value && value.length > 10) {
                    return '该项最长只能10位长度';
                }
            }
            ,GuardianTel: function(value, item) {
                if (value && value.length > 13) {
                    return '该项最大只能10位长度';
                }
                if (!hdk.REGEX.phone.test(value)) {
                    return '请输入正确的监护人电话';
                }
            }
            ,GuardianTelVice: function(value, item) {
                if (value && value.length > 13) {
                    return '该项最大只能10位长度';
                }
                if (value && !hdk.REGEX.phone.test(value)) {
                    return '请输入正确的联系电话(副)';
                }
            }
            ,DAddress: function(value, item) {
                if (value && value.length > 100) {
                    return '该项最大只能100位长度';
                }
            }
            ,LAddress: function(value, item) {
                if (value && value.length > 100) {
                    return '该项最大只能100位长度';
                }
            }
            ,FirstOnsetDate: function(value, item) {
                return dateVerify('FirstOnsetDate');
            }
            ,FirstCureTime: function(value, item) {
                return dateVerify('FirstCureTime');
            }
            ,HospStateHis: function(value, item) {
                if (!/^\+?[1-9][0-9]{0,1}$/.test(value)) {
                    return '该项最大只能2位正整数';
                }
            }
            ,RiskActCd: function(value, item) {

            }
            ,SenderBodyStr: function(value, item) {

            }
            ,SenderOther: function(value, item) {
                if (value && value.length > 20) {
                    return '该项最大只能20位长度';
                }
            }
            ,DiagnosisDate: function(value, item) {
                return dateVerify('DiagnosisDate');
            }
            ,ICSignDate: function(value, item) {
                return dateVerify('ICSignDate');
            }
            ,FillCardDate: function(value, item) {
                return dateVerify('FillCardDate');
            }
            ,RptDeptTel: function(value, item) {
                var stop = false
                if (!hdk.REGEX.phone.test(value) && !hdk.REGEX.mobilePhone.test(value)) {
                    stop =true;
                }
                if (stop) return '请输入正确的联系电话';
            }
        });

        // 院内就诊信息查询
        $('#admQuery').on('click', function(o) {

            layer.open({
                title:'院内患者信息查询 (前十条)'
                ,type: 1
                ,shadeClose: true
                ,area: ['700px', '410px']
                ,content: '<div style="padding:0 20px;" id="LAY-air-adm-window"><input type="text" name="airQuery" id="airAdmQuery" placeholder="搜索" class="layui-input" style="width: 280px;margin-bottom: -10px;margin-top: 20px;"><table class="layui-table"lay-filter="LAY-air-adm" id="LAY-air-adm"></table></div>'
                ,success: function(layero, idx) {

                    table.on('tool(LAY-air-adm)', function(o) {
                        form.val(formID, o.data);
                        form.render();
                        reloadPatInfo(o.data);
                        layer.close(idx);
                        $('[lay-filter=Add_IDCode]').trigger('blur');
                    });


                    table.render({
                        elem: '#LAY-air-adm'
                        ,id: 'LAY-air-adm'
                        ,url: '/rest/ThridCtr/queryAdms'
                        ,method: 'POST'
                        ,contentType: 'application/json'
                        ,where: lay.extend({},params,{queryString: $('input[name=AdmCd]').val()})
                        ,response: {
                            statusCode: 200
                            ,msgName: 'message'
                        }
                        ,headers: headers
                        ,cols: [[
                            {fixed: 'left',align:'center', title:'选择', toolbar: '#LAY-air-adm-toolbar', width:60}
                            ,{field:'AdmCd', title:'就诊号', width:100}
                            ,{field:'AdmTime', title:'就诊时间', minWidth:160}
                            ,{field:'PatNam', title:'姓名', width:120}
                            ,{field:'IDCode', title:'身份证',align:'center', minWidth:180}
                        ]]
                        ,done: function(res) {
                            $('#LAY-air-adm-window').on('keyup', '#airAdmQuery',function(e) {
                                var keyCode = e.keyCode;

                                if(keyCode === 9 || keyCode === 13 
                                    || keyCode === 37 || keyCode === 38 
                                    || keyCode === 39 || keyCode === 40
                                ){
                                    return false;
                                }                
                                clearTimeout(queryTimer);
                                queryTimer = setTimeout(function() {
                                    var target = [];
                                    inputQuery = $('#airAdmQuery').val();

                                    if (inputQuery && inputQuery.length) {
                                        table.reload('LAY-air-adm', {
                                            where: {
                                                queryString: inputQuery
                                            }
                                        });
                                    } else {
                                        table.reload('LAY-air-adm', {
                                            data: []
                                        });
                                    }

                                }, 600);
                            });
                        }
                    });
                }
            });
        });

        // 省网身份证信息查询
        $('#idCardQuery').on('click', function() {
            var tp = $('select[name=IDTypeCd]').find("option:selected").text();
            if (tp.indexOf('身份证') === -1) {
                layer.msg('仅支持身份证号码查询');
                return;
            }
            layer.open({
                title:'省网患者基本信息查找'
                ,type: 1
                ,shadeClose: true
                ,area: ['400px', '230px']
                ,content: '<div style="padding:0 20px;" id="LAY-air-idcard-window"><input type="text" name="airQuery" id="airIdCardQuery" placeholder="身份证" class="layui-input" style="width: 360px;margin-bottom: -10px;margin-top: 20px;"><table class="layui-table"lay-filter="LAY-air-idcard" id="LAY-air-idcard"></table></div>'
                ,success: function(layero, idx) {
                    $('#airIdCardQuery').val($('input[name=IDCode]').val());
                    $('#LAY-air-idcard-window').on('keyup', '#airIdCardQuery',function(e) {
                        var keyCode = e.keyCode;

                        if(keyCode === 9 || keyCode === 13 
                            || keyCode === 37 || keyCode === 38 
                            || keyCode === 39 || keyCode === 40
                        ){
                            return false;
                        }                
                        clearTimeout(queryTimer);
                        queryTimer = setTimeout(function() {
                            var target = [];
                            inputQuery = $('#airIdCardQuery').val();

                            if (inputQuery && inputQuery.length && hdk.REGEX.identity.test(inputQuery)) {
                                admin.req({
                                    url: '/rest/ThridCtr/getPatInfoByIDCode'
                                    ,type: 'post'
                                    ,data: {
                                        idCard: inputQuery
                                    }
                                    ,done: function(res){
                                        var idData = [];
                                        if (res.data) {
                                            idData.push(res.data);
                                        }
                                        table.render({
                                            elem: '#LAY-air-idcard'
                                            ,id: 'LAY-air-idcard'
                                            ,data: idData
                                            ,text: {
                                                none: '查无此人'
                                            }
                                            ,cols: [[
                                                {fixed: 'left',align:'center', title:'选择', toolbar: '#LAY-air-idcard-toolbar', width:60}
                                                ,{field:'PatNam', title:'姓名'}
                                                ,{field:'IDCode', title:'身份证',align:'center', minWidth:180}
                                            ]]
                                        })
                                    }
                                });
                            } else {
                                    table.reload('LAY-air-idcard', {
                                        data: []
                                    });
                            }
                        }, 600);
                    });
                    $('#airIdCardQuery').trigger('keyup');
                    table.on('tool(LAY-air-idcard)', function(o) {
                        form.val(formID, o.data);
                        form.render();
                        layer.closeAll();
                        $('[lay-filter=Add_IDCode]').trigger('blur');
                        var radio = $('[name=RegistertypeCd]:checked');
                        layui.event.call(radio[0], 'form', 'radio(RegistertypeCd)', {
                            elem: radio[0]
                            ,value: radio[0].value
                            ,othis: null
                        });
                    });
                }
            });
        });

        // 日期字段校验
        var dateVerify = function(field) {
            // 出生日期≤初次发病时间≤首次抗精神病药物治疗时间≤当前日期
            // 初次发病时间≤知情同意时间≤当前日期
            // 初次发病时间≤确诊日期≤填卡日期≤当前日期
            var now = moment().format('YYYY-MM-DD'),
                birth = $('[lay-filter=Add_BirthDate]').val(),
                firstOnset = $('[lay-filter=Add_FirstOnsetDate]').val(),
                firstCure = $('[lay-filter=Add_FirstCureTime]').val(),
                icSign = $('[lay-filter=Add_ICSignDate]').val(),
                diagnosis = $('[lay-filter=Add_DiagnosisDate]').val(),
                fillCard = $('[lay-filter=Add_FillCardDate]').val();

            if (field === 'FirstOnsetDate') {
                if (moment(firstOnset).isBefore(birth)) {
                    return '【初次发病时间】不能早于【出生日期】';
                }

                if (moment(firstOnset).isAfter(now)) {
                    return '【初次发病时间】不能晚于【当前日期】';
                }
            } else if (field === 'FirstCureTime') {
                if (moment(firstCure).isBefore(firstOnset)) {
                    return '【首次抗精神病药物治疗时间】不能早于【初次发病时间】';
                }

                if (moment(firstCure).isAfter(now)) {
                    return '【首次抗精神病药物治疗时间】不能晚于【当前日期】';
                }       
            } else if (field === 'DiagnosisDate') {
                if (moment(diagnosis).isBefore(firstOnset)) {
                    return '【确诊日期】不能早于【初次发病时间】';
                }

                if (moment(diagnosis).isAfter(now)) {
                    return '【确诊日期】不能晚于【当前日期】';
                }  
            } else if (field === 'ICSignDate') {
                if (moment(icSign).isBefore(firstOnset)) {
                    return '【知情同意时间】不能早于【初次发病时间】';
                }

                if (moment(icSign).isAfter(now)) {
                    return '【知情同意时间】不能晚于【当前日期】';
                }  
            } else if (field === 'FillCardDate') {
                if (moment(fillCard).isBefore(diagnosis)) {
                    return '【填卡日期】不能早于【确诊日期】';
                }

                if (moment(fillCard).isAfter(now)) {
                    return '【填卡日期】不能晚于【当前日期】';
                }  
            }
        }

        // 身份证号码加工 $('[lay-filter=Add_IDCode]').trigger('blur')
        $('[lay-filter=' + formID + ']').on('blur', '[lay-filter=Add_IDCode]', function(e) {
            if (hdk.REGEX.identity.test(e.target.value)) {
                var idCode = e.target.value,
                    vSexCd = idCode.substring(14, 17) % 2 ? hdk.gender['男'].Cd:hdk.gender['女'].Cd,
                    vSex = idCode.substring(14, 17) % 2 ? hdk.gender['男'].Nam:hdk.gender['女'].Nam
                    vBirthDate= idCode.substring(6, 10) + '-' + idCode.substring(10, 12) + '-' + idCode.substring(12, 14);

                form.val(formID, {
                    GenderCd: vSexCd
                    ,Gender: vSex
                    ,BirthDate: vBirthDate
                });
            }
        });

        // 去除日期多余空字符串
        $('[lay-filter=' + formID + ']').on('blur', '[lay-filter=Add_BirthDate]', function(e) {
            var vDate = e.target.value.replace(' ','');
            if (hdk.REGEX.date.test(vDate)) {
                form.val(formID, {
                    BirthDate: vDate
                });
            }
            return false;
        });

        $('[lay-filter=' + formID + ']').on('blur', '[lay-filter=Add_DiagnosisDate]', function(e) {
            var vDate = e.target.value.replace(' ','');
            if (hdk.REGEX.date.test(vDate)) {
                form.val(formID, {
                    DiagnosisDate: vDate
                });
            }
            return false;
        });

        $('[lay-filter=' + formID + ']').on('blur', '[lay-filter=Add_ICSignDate]', function(e) {
            var vDate = e.target.value.replace(' ','');
            if (hdk.REGEX.date.test(vDate)) {
                form.val(formID, {
                    ICSignDate: vDate
                });
            }
            return false;
        });

        $('[lay-filter=' + formID + ']').on('blur', '[lay-filter=Add_FillCardDate]', function(e) {
            var vDate = e.target.value.replace(' ','');
            if (hdk.REGEX.date.test(vDate)) {
                form.val(formID, {
                    FillCardDate: vDate
                });
            }
            return false;
        });

        // 初始化出生日期
        laydate.render({
            elem: '[lay-filter=Add_BirthDate]'
            ,max: 0
            ,btns: ['clear', 'confirm']
            ,done: function(value, o) {

            }
        });

        // 初始化确诊日期
        laydate.render({
            elem: '[lay-filter=Add_DiagnosisDate]'
            ,max: 0
            ,btns: ['clear', 'confirm']
            ,done: function(value, o) {

            }
        });

        // 知情同意时间
        laydate.render({
            elem: '[lay-filter=Add_ICSignDate]'
            ,max: 0
            ,btns: ['clear', 'confirm']
            ,done: function(value, o) {

            }
        });

        // 初始化填卡日期
        laydate.render({
            elem: '[lay-filter=Add_FillCardDate]'
            ,max: 0
            ,btns: ['clear', 'confirm']
            ,done: function(value, o) {

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
                    date = moment([year, month-1, day]).format('YYYY-MM-DD');
                } else if (month && !day) {
                    precision = hdk.precision['日不详'];
                    date = moment([year, month-1, 1]).format('YYYY-MM-DD');
                } else {
                    precision = hdk.precision['月不详'];
                    date = moment([year, 0, 1]).format('YYYY-MM-DD');
                }

                $('[lay-filter=Add_FirstOnsetDate]').val(date);
                $('[lay-filter=Add_AccuracyCd]').val(precision.Cd);


            } else if (filter === 'FirstCureTime') {
                year = $('[lay-filter=Add_FirstCureTimeYear]').val();
                month = $('[lay-filter=Add_FirstCureTimeMonth]').val();
                day = $('[lay-filter=Add_FirstCureTimeDay]').val();

                if (month && day) {
                    precision = hdk.precision['时间准确'];
                    date = moment([year, month-1, day]).format('YYYY-MM-DD');
                } else if (month && !day) {
                    precision = hdk.precision['日不详'];
                    date = moment([year, month-1, 1]).format('YYYY-MM-DD');
                } else {
                    precision = hdk.precision['月不详'];
                    date = moment([year, 0, 1]).format('YYYY-MM-DD');
                }

                $('[lay-filter=Add_FirstCureTime]').val(date);
                $('[lay-filter=Add_FstCureAccCd]').val(precision.Cd);
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

        form.on('select(Add_GenderCd)', function(o) {

        });

        // 初次发病时间 - 年
        form.on('select(Add_FirstOnsetYear)', function(o) {
            if (o.value === $(o.elem).data('previous')) return;
            setDateValue('FirstOnsetDate');
            $(o.elem).data('previous', o.value);
        });

        // 初次发病时间 - 月
        form.on('select(Add_FirstOnsetMon)', function(o) {
            if (o.value === $(o.elem).data('previous')) return;
            var year = $('[lay-filter=Add_FirstOnsetYear]').val() || 0,
                month = o.value,
                day = $('[lay-filter=Add_FirstOnsetDay]').val() || 1,
                mDate = moment([year,month-1,day]);

            // 初始化 - 日
            initDateOption('Add_FirstOnsetDay', 'day', mDate.startOf('month').date(), mDate.endOf('month').endOf('month').date());
            setDateValue('FirstOnsetDate');
            $(o.elem).data('previous', o.value);
        });

        // 初次发病时间 - 日
        form.on('select(Add_FirstOnsetDay)', function(o) {
            if (o.value === $(o.elem).data('previous')) return;
            setDateValue('FirstOnsetDate');
            $(o.elem).data('previous', o.value);
        });

        // 建档前是否已进行抗精神病药物治
        form.on('select(Add_IfCureCd)', function(o) {
            if (o.value === $(o.elem).data('previous')) return;
            if (o.elem[o.elem.selectedIndex].text === '是') {
                $('[lay-filter=Add_FirstCureTimeYear]').attr('lay-verify', 'required');
                $('[name=FirstCureTime]').attr('lay-verify', 'required|FirstCureTime');
                $('[name=FstCureAccCd]').attr('lay-verify', 'required');
                $('#FirstCureTime_Section').removeClass('layui-hide');
                
            } else {
                $('[lay-filter=Add_FirstCureTimeYear]').removeAttr('lay-verify');
                $('[name=FirstCureTime]').removeAttr('lay-verify');
                $('[name=FstCureAccCd]').removeAttr('lay-verify');
                $('#FirstCureTime_Section').addClass('layui-hide').find('select').val('');
                form.render('select');
            }
            $(o.elem).data('previous', o.value);
        });

        // 首次抗精神病药物治疗时间 - 年
        form.on('select(Add_FirstCureTimeYear)', function(o) {
            if (o.value === $(o.elem).data('previous')) return;
            setDateValue('FirstCureTime');
            $(o.elem).data('previous', o.value);
        });

        // 首次抗精神病药物治疗时间 - 月
        form.on('select(Add_FirstCureTimeMonth)', function(o) {
            if (o.value === $(o.elem).data('previous')) return;
            var year = $('[lay-filter=Add_FirstCureTimeYear]').val() || 0,
                month = o.value,
                day = $('[lay-filter=Add_FirstCureTimeDay]').val() || 1,
                mDate = moment([year,month-1,day]);

            // 首次抗精神病药物治疗时间 - 日
            initDateOption('Add_FirstCureTimeDay', 'day', mDate.startOf('month').date(), mDate.endOf('month').endOf('month').date());
            setDateValue('FirstCureTime');
            $(o.elem).data('previous', o.value);
        });

        // 首次抗精神病药物治疗时间 - 日
        form.on('select(Add_FirstCureTimeDay)', function(o) {
            if (o.value === $(o.elem).data('previous')) return;
            setDateValue('FirstCureTime');
            $(o.elem).data('previous', o.value);
        });

        // 户别
        form.on('radio(RegistertypeCd)', function(o) {
            var text = $(o.elem).next().find('div').text();
            if (text.indexOf('不详') != -1) {
                $('[lay-filter=Add_UnknownCause]').removeClass('layui-hide').val(null);
            } else {
                $('[lay-filter=Add_UnknownCause]').addClass('layui-hide').val(null);
            }
        });

        // 证件类型
        form.on('select(Add_IDTypeCd)', function(o) {
            if (o.value === $(o.elem).data('previous')) return;
            if (o.value === sfzTpCd) {
                $('[lay-filter=Add_IDCode]').attr('lay-verify', 'required|IDCode');
                form.val(formID, {
                    NationalityCd: 'Nationality000'
                });
                $('[lay-filter=Add_NationalityCd]').attr('disabled', true).addClass('layui-disabled');
                form.render('select');
            } else {
                $('[lay-filter=Add_IDCode]').attr('lay-verify', 'required');
                $('[lay-filter=Add_NationalityCd]').removeAttr('disabled').removeClass('layui-disabled');
                form.render('select');
            }
            $(o.elem).data('previous', o.value);
        });

        // 户籍地址
        form.on('select(Add_DProvinceCd)', function(o){
            if (o.value === $(o.elem).data('previous')) return;
            $('[lay-filter=Add_DCountyCd]').empty();
            $('[lay-filter=Add_DTownCd]').empty();

            hdk.renderOption('Add_DCityCd', hdk.getZoneData('RegLevel002', o.value));
            form.render('select', formID);
            $(o.elem).data('previous', o.value);
        });


        //户籍地址类型
        form.on('select(Add_DAddrTpCd)', function(o){
            switch (o.value){
                //本县区
                case 'PatBelongs001':
                    $('[name=DProvinceCd]').attr('disabled',true);
                    $('[name=DCityCd]').attr('disabled',true);
                    $('[name=DCountyCd]').attr('disabled',true);
                    $('[name=DTownCd]').attr('disabled',false);
                    break;
                //本市其它县区
                case 'PatBelongs002':
                    $('[name=DProvinceCd]').attr('disabled',true);
                    $('[name=DCityCd]').attr('disabled',true);
                    $('[name=DCountyCd]').attr('disabled',false);
                    $('[name=DTownCd]').attr('disabled',false);
                    break;
                //本省其它地市
                case 'PatBelongs003':
                    $('[name=DProvinceCd]').attr('disabled',true);
                    $('[name=DCityCd]').attr('disabled',false);
                    $('[name=DCountyCd]').attr('disabled',false);
                    $('[name=DTownCd]').attr('disabled',false);
                    break;
                //其它省    
                case 'PatBelongs004':
                    $('[name=DProvinceCd]').attr('disabled',false);
                    $('[name=DCityCd]').attr('disabled',false);
                    $('[name=DCountyCd]').attr('disabled',false);
                    $('[name=DTownCd]').attr('disabled',false);
                    break;
                //港澳台    
                case 'PatBelongs005':
                    $('[name=DProvinceCd]').attr('disabled',true);
                    $('[name=DCityCd]').attr('disabled',true);
                    $('[name=DCountyCd]').attr('disabled',true);
                    $('[name=DTownCd]').attr('disabled',true);
                    break;
                //外籍    
                case 'PatBelongs006':
                    $('[name=DProvinceCd]').attr('disabled',true);
                    $('[name=DCityCd]').attr('disabled',true);
                    $('[name=DCountyCd]').attr('disabled',true);
                    $('[name=DTownCd]').attr('disabled',true);
                    break;
            }
            form.render('select');
        });

        //现居住地址类型
        form.on('select(Add_LAddrTpCd)', function(o){
            switch (o.value){
                //本县区
                case 'PatBelongs001':
                    $('[name=LProvinceCd]').attr('disabled',true);
                    $('[name=LCityCd]').attr('disabled',true);
                    $('[name=LCountyCd]').attr('disabled',true);
                    $('[name=LTownCd]').attr('disabled',false);
                    break;
                //本市其它县区
                case 'PatBelongs002':
                    $('[name=LProvinceCd]').attr('disabled',true);
                    $('[name=LCityCd]').attr('disabled',true);
                    $('[name=LCountyCd]').attr('disabled',false);
                    $('[name=LTownCd]').attr('disabled',false);
                    break;
                //本省其它地市
                case 'PatBelongs003':
                    $('[name=LProvinceCd]').attr('disabled',true);
                    $('[name=LCityCd]').attr('disabled',false);
                    $('[name=LCountyCd]').attr('disabled',false);
                    $('[name=LTownCd]').attr('disabled',false);
                    break;
                //其它省    
                case 'PatBelongs004':
                    $('[name=LProvinceCd]').attr('disabled',false);
                    $('[name=LCityCd]').attr('disabled',false);
                    $('[name=LCountyCd]').attr('disabled',false);
                    $('[name=LTownCd]').attr('disabled',false);
                    break;
                //港澳台    
                case 'PatBelongs005':
                    $('[name=LProvinceCd]').attr('disabled',true);
                    $('[name=LCityCd]').attr('disabled',true);
                    $('[name=LCountyCd]').attr('disabled',true);
                    $('[name=LTownCd]').attr('disabled',true);
                    break;
                //外籍    
                case 'PatBelongs006':
                    $('[name=LProvinceCd]').attr('disabled',true);
                    $('[name=LCityCd]').attr('disabled',true);
                    $('[name=LCountyCd]').attr('disabled',true);
                    $('[name=LTownCd]').attr('disabled',true);
                    break;
            }
            form.render('select');
        });

        form.on('select(Add_DCityCd)', function(o){
            if (o.value === $(o.elem).data('previous')) return;
            $('[lay-filter=Add_DTownCd]').empty();

            hdk.renderOption('Add_DCountyCd', hdk.getZoneData('RegLevel003', o.value));
            form.render('select', formID);
            $(o.elem).data('previous', o.value);
        });

        form.on('select(Add_DCountyCd)', function(o){
            if (o.value === $(o.elem).data('previous')) return;
            hdk.renderOption('Add_DTownCd', hdk.getZoneData('RegLevel004', o.value));
            form.render('select', formID);
            $(o.elem).data('previous', o.value);
        });

        form.on('select(Add_DTownCd)', function(o){
            if (o.value === $(o.elem).data('previous')) return;
            $('[lay-filter=Add_DCode]').val(o.value);
            $(o.elem).data('previous', o.value);
            
            $('[name=DAddress]').val(
                $('[name=DProvinceCd]').find('option:selected').text() +
                $('[name=DCityCd]').find('option:selected').text() +
                $('[name=DCountyCd]').find('option:selected').text() +
                $('[name=DTownCd]').find('option:selected').text()
            );
        });

        // 现居住地址
        form.on('select(Add_LProvinceCd)', function(o){
            if (o.value === $(o.elem).data('previous')) return;
            $('[lay-filter=Add_LCountyCd]').empty();
            $('[lay-filter=Add_LTownCd]').empty();

            hdk.renderOption('Add_LCityCd', hdk.getZoneData('RegLevel002', o.value));
            form.render('select', formID);
            $(o.elem).data('previous', o.value);
        });

        form.on('select(Add_LCityCd)', function(o){
            if (o.value === $(o.elem).data('previous')) return;
            $('[lay-filter=Add_LTownCd]').empty();

            hdk.renderOption('Add_LCountyCd', hdk.getZoneData('RegLevel003', o.value));
            form.render('select', formID);
            $(o.elem).data('previous', o.value);
        });

        form.on('select(Add_LCountyCd)', function(o){
            if (o.value === $(o.elem).data('previous')) return;
            hdk.renderOption('Add_LTownCd', hdk.getZoneData('RegLevel004', o.value));
            form.render('select', formID);
            $(o.elem).data('previous', o.value);
        });

        form.on('select(Add_LTownCd)', function(o){
            if (o.value === $(o.elem).data('previous')) return;
            $('[lay-filter=Add_LCode]').val(o.value);
            $(o.elem).data('previous', o.value);
            
            $('[name=LAddress]').val(
                $('[name=LProvinceCd]').find('option:selected').text() +
                $('[name=LCityCd]').find('option:selected').text() +
                $('[name=LCountyCd]').find('option:selected').text() +
                $('[name=LTownCd]').find('option:selected').text()
            );
            
        });

        // 既往危险行为
        form.on('checkbox(RiskActCdBox)', function(o) {
            var checked = [],
                thisKey = $(o.elem).attr('hyd-key'),
                riskSelector = $('[name=RiskCd]');
            
            if ($(o.elem).attr('title').indexOf('无上述') != -1) {
                $('[lay-filter=RiskActCdBox]:checked').each(function(idx, cb) {
                    if (thisKey != $(cb).attr('hyd-key')) {
                        $(cb).prop('checked', false);
                    }
                });
                
                riskSelector.find('option[value=Risk001]').attr('disabled',false);
                form.render('select', formID);
                form.render('checkbox', formID);
                checked.push(thisKey);
            } else {
                $('[lay-filter=RiskActCdBox]:checked').each(function(idx, cb) {
                    if ($(cb).attr('title').indexOf('无上述') === -1) {
                        checked.push($(cb).attr('hyd-key'));
                    } else {
                        $(cb).prop('checked', false);
                        form.render('checkbox', formID);
                    }
                });
                if (!riskSelector.find('option[value=Risk001]').attr('disabled')) {
                    if (riskSelector.val() === 'Risk001') {
                        riskSelector.val('');
                    }
                    riskSelector.find('option[value=Risk001]').attr('disabled',true)
                    form.render('select', formID);
                }
            }

            $('[lay-filter=Add_RiskActCd]').val(checked);
        });

        // 送诊主体
        form.on('checkbox(SenderBodyStrBox)', function(o) {
            var checked = [],
                hasOther = false;

            $('[lay-filter=SenderBodyStrBox]:checked').each(function(idx, cb) {
                checked.push($(cb).attr('hyd-key'));
                if ($(cb).attr('title').indexOf('其他') != -1) {
                    hasOther = true;
                }
            });

            if (hasOther) {
                $('[lay-filter=Add_SenderOther]').removeClass('layui-hide').attr('lay-verify', 'required|SenderOther');
            } else {
                $('[lay-filter=Add_SenderOther]').addClass('layui-hide').removeAttr('lay-verify').val(null);
            }

            $('[lay-filter=Add_SenderBodyStr]').val(checked);
        });

        // 疾病名称
        form.on('select(Add_DiseaseCd)', function(o){
            if (o.value === $(o.elem).data('previous')) return;

            $('[lay-filter=Add_DiseaseICD]').val(hdk.ICD10[o.value].DictCode);
            $('[lay-filter=Add_Disease]').val(hdk.ICD10[o.value].Nam);
            $(o.elem).data('previous', o.value);
        });

        //勿需服药
        form.on('radio(IfNomedication)', function(o){
            if ('Whether001' === o.value){
                //填
                $('#LAY-report-patcard-drug').removeClass('layui-hide');
            } else {
                //不填
                $('#LAY-report-patcard-drug').addClass('layui-hide');
            }
        });

        // 用药情况
        table.on('toolbar(' + drugTableID + ')', function(o) {
            if (o.event != 'add') return;
            var oData = table.cache[drugTableID],
                    oCount = 0;
            layui.each(oData, function(idx, r) {
                if (!$.isArray(r)) {
                    oCount = oCount + 1;
                }
            });
            if (oCount === 6) {
                layer.msg('用药情况已经记录6条记录');
                return;
            }

            layer.open({
                title:'药品查询'
                ,type: 1
                ,shadeClose: true
                ,area: ['700px', '410px']
                ,content: '<div style="padding:0 20px;" id="LAY-air-window"><input type="text" name="airQuery" id="airQuery" placeholder="搜索" class="layui-input" style="width: 280px;margin-bottom: -10px;margin-top: 20px;"><table class="layui-table"lay-filter="LAY-air-drug" id="LAY-air-drug"></table></div>'
                ,success: function(layero, idx) {

                    table.on('tool(LAY-air-drug)', function(o) {
                        var existed = false;
                        layui.each(table.cache[drugTableID], function(dIdx, dItem) {
                            if (!$.isArray(dItem)) {
                                if (dItem.Cd === o.data.Cd) {
                                    existed = true;
                                    return;
                                }
                            }
                        });
                        if (existed) {
                            layer.msg(o.data.Nam + ': 已被记录');
                            return;
                        }
                        o.data.vSpec = o.data.Spec.split(',');
                        o.data.vDrugSpecifications = o.data.vSpec[0];
                        o.data.Type = 'FUMedTp001';
                        o.data.DrugType = o.data.CtlRelease;
                        o.data.CountryDrugCd = o.data.Cd;

                        if (o.data['CtlRelease'] === hdk.whether['是'].Cd) {
                            o.data.isLong = true;
                            o.data.vDrug = o.data.Nam;
                            o.data.lbDrugSpecifications = '规格';
                            o.data.lb1 = '剂量';
                            o.data.lb1Unit = 'mg';
                            o.data.lb2 = '每';
                            o.data.lb2Unit = o.data.CtlRelUnit;
                        } else {
                            o.data.isLong = false;
                            o.data.vDrug = o.data.Nam;
                            o.data.lbDrugSpecifications = '规格';
                            o.data.lb1 = '每早';
                            o.data.v1 = 0;
                            o.data.lb1Unit = 'mg';
                            o.data.lb2 = '每中';
                            o.data.v2 = 0;
                            o.data.lb2Unit = 'mg';
                            o.data.lb3 = '每晚';
                            o.data.v3 = 0;
                            o.data.lb3Unit = 'mg';
                        }
                        oData.push(o.data);
                        table.reload(drugTableID,{
                            data: oData,
                            done: function(res) {
                                if (res.count === 0) return;
                                layui.each(res.data, function(i, d) {
                                    if (d.isLong) {
                                        $('[lay-id=' + drugTableID + '] tr[data-index='+i+'] td[data-field=v3]').removeAttr('data-edit').remove();
                                        $('[lay-id=' + drugTableID + '] tr[data-index='+i+'] td[data-field=lb3Unit]').remove();
                                        $('[lay-id=' + drugTableID + '] tr[data-index='+i+'] td[data-field=lb3]').attr('colspan',3);
                                    }
                                });
                                form.render();
                                layer.closeAll();
                            }
                        });
                    });

                    table.render({
                        elem: '#LAY-air-drug'
                        ,id: 'LAY-air-drug'
                        ,data: hdk.drug
                        ,defaultToolbar: []
                        ,cols: [[
                            {fixed: 'left',align:'center', title:'选择', toolbar: '#LAY-air-drug-toolbar', width:60}
                            ,{field:'Nam', title:'名称', minWidth:230, templet: function(d) {
                                return d['CtlRelease'] === 'Whether002' ? ('<span class="layui-badge layui-bg-orange">长效</span> ' + d.Nam):d.Nam;
                            }}
                            ,{field:'Cate', title:'分类'}
                            ,{field:'Spec', title:'规格',align:'center', minWidth:180}
                        ]]
                        ,page: true
                        ,limit: 5
                        ,limits: [5]
                        ,done: function(res) {
                            $('#LAY-air-window').on('keyup', '#airQuery',function(e) {
                                var keyCode = e.keyCode;

                                if(keyCode === 9 || keyCode === 13 
                                    || keyCode === 37 || keyCode === 38 
                                    || keyCode === 39 || keyCode === 40
                                ){
                                    return false;
                                }                
                                clearTimeout(queryTimer);
                                queryTimer = setTimeout(function() {
                                    var target = [];
                                    inputQuery = $('#airQuery').val();
                                    console.log(inputQuery);
                                    if (inputQuery && inputQuery.length) {
                                        layui.each(hdk.drug, function(i, d) {
                                            if (d.Nam.indexOf(inputQuery.toUpperCase()) != -1 || d.MemCode.indexOf(inputQuery.toUpperCase()) != -1) {
                                                target.push(d);
                                            }
                                        });
                                        table.reload('LAY-air-drug', {
                                            data: target
                                        });
                                    } else {
                                        table.reload('LAY-air-drug', {
                                            data: hdk.drug
                                        });
                                    }

                                }, 600);
                            });
                        }
                    });
                }
            });
        });

        // 用药情况填写
        table.on('edit(' + drugTableID + ')', function(o) {
            var td,original;
            if (o.data.isLong) {
                // 剂量
                if (o.field === 'v1') {
                    td = $(o.tr[0]).find('[data-field=' + o.field + ']');
                    original = td.data('original') || null;
                    if (!hdk.REGEX.postiveFloat.test(o.value)) {
                        setTimeout(function() {
                            var obj = {};
                            obj[o.field] = original;
                            o.update(obj);
                        }, 50);
                        layer.msg('只能输入大于0的数字, 最长10位, 最多保留两位小数点');
                    } else {
                        td.data('original', o.value);
                    }
                } // 用户 正整数
                else if (o.field === 'v2') {
                    td = $(o.tr[0]).find('[data-field=' + o.field + ']');
                    original = td.data('original') || null;
                    if (!hdk.REGEX.positiveInteger.test(o.value)) {
                        setTimeout(function() {
                            var obj = {};
                            obj[o.field] = original;
                            o.update(obj);
                        }, 50);
                        layer.msg('只能输入大于0的数字, 最长10位');
                    } else {
                        td.data('original', o.value);
                    }
                }
            } else {
                td = $(o.tr[0]).find('[data-field=' + o.field + ']');
                original = td.data('original') || null;
                if (!hdk.REGEX.postiveFloat.test(o.value)) {
                    setTimeout(function() {
                        var obj = {};
                        obj[o.field] = original;
                        o.update(obj);
                    }, 50);
                    layer.msg('只能输入大于0的数字, 最长10位, 最多保留两位小数点');
                } else {
                    td.data('original', o.value);
                }
            }
        });

        // 用药情况规格
        form.on('radio(DrugSpecifications)', function(o) {
            var rowIndex = o.othis.parents('tr').eq(0).data('index'),
                    key = o.othis.parents('.layui-table-view').eq(0).attr('lay-id'),
                    rowData = table.cache[key][rowIndex];

                rowData.vDrugSpecifications = o.value;
        });

        // 用药情况删除
        table.on('tool(' + drugTableID + ')', function(o) {
            switch(o.event) {
                case 'del':
                    layer.confirm('是否删除该条用药情况记录?<br><span style="color:#FF5722;">【注：需要提交保存才生效】</span>', {
                        btn: ['确定','取消']
                    }, function(index) {
                        o.del();
                        layer.close(index);
                    });
                    break;
                default:
                    break;
            }
        });

        form.on('submit(report-patcard-add-save)', function(o) {
            var report = {
                admCd: o.field.AdmCd
                ,linkCd: o.field.InciReportNum
                ,reporterCd: layui.data(setter.tableName)[setter.request.userInfo].owner
                ,reporter: layui.data(setter.tableName)[setter.request.userInfo].name
                ,patName: o.field.PatNam
                ,patIDCard: o.field.IDCode
                ,patSex: o.field.IDCode.substring(14, 17) % 2 ? hdk.gender['男'].Nam:hdk.gender['女'].Nam
                ,patDisease: o.field.Disease
                ,patDiseaseCd: o.field.DiseaseCd
                ,patDiseaseICD: o.field.DiseaseICD
            }
            ,meds = o.field.IfNomedication === 'Whether001' ? (table.cache[drugTableID] || []) : []
            ,medList = []
            ,stop = false;
            
            layui.each(meds, function(idx, med) {
                if (!$.isArray(med)) {
                    if (med.isLong) {
                        if (!hdk.REGEX.postiveFloat.test(med.v1)) {
                            layer.msg(med.vDrug + '的【剂量】录入有误');
                            stop = true;
                            return;
                        }
                        if (!hdk.REGEX.positiveInteger.test(med.v2)) {
                            layer.msg(med.vDrug + '的【用法】录入有误');
                            stop = true;
                            return;
                        }
                        med.LDrug = med.vDrug;
                        med.LDrugSpecifications = med.vDrugSpecifications;
                        med.LDrugDose = med.v1;
                        med.LDrugUsage = med.v2;
                        med.LDrugTime = med.lb2Unit;
                    } else {
                        if (!hdk.REGEX.postiveFloat.test(med.v1)) {
                            layer.msg(med.vDrug + '的【剂量】录入有误');
                            stop = true;
                            return;
                        }
                        if (!hdk.REGEX.postiveFloat.test(med.v2)) {
                            layer.msg(med.vDrug + '的【用法】录入有误');
                            stop = true;
                            return;
                        }
                        if (!hdk.REGEX.postiveFloat.test(med.v3)) {
                            layer.msg(med.vDrug + '的【用法】录入有误');
                            stop = true;
                            return;
                        }
                        if ((med.v1 + med.v2 + med.v3) === 0) {
                            layer.msg(med.vDrug + '的【早中晚剂量】不能同时为0');
                            stop = true;
                            return;
                        }

                        med.SDrug = med.vDrug;
                        med.SDrugSpecifications = med.vDrugSpecifications;
                        med.SDrugDosem = med.v1;
                        med.SDrugDosen = med.v2;
                        med.SDrugDosee = med.v3;
                    }
                    medList.push(med);
                }
            });
            
            if(medList.length == 0 && o.field.IfNomedication === 'Whether001'){
                layer.msg('请添加目前用药情况');
                stop = true;
            }

            if (stop) return;

            o.field.MedList = medList;
            report.reportData = o.field;
            admin.req({
                url: '/rest/ReportCtr/savePatCard'
                ,type: 'post'
                ,data: report
                ,done: function(res){
                    if (res.data.length === 1) {
                        layer.msg('操作成功!');
                        if (isQuickMode) return;
                        setTimeout(function() {
                            location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_patcard');
                        }, 1000);
                    }
                }
            })
        });

        $('[lay-filter=' + formID + ']').on('click', '[lay-filter=report-patcard-add-back]', function(o) {
            location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_patcard');
        });
        
        var reloadPatInfo = function (obj) {
            var elem = $('[lay-filter=' + formID + ']'),
            	dictElem = elem.find('*[hyd-dict]');
            dictElem.each(function(idx,item){
                var filter = $(item).attr('lay-filter'),
                    name = $(item).attr('hyd-dict-field') || $(item).attr('name'),
                    renderType = item.tagName.toLowerCase() === 'select' ? 'select' : $(item).attr('hyd-dict-render');
                    
                if (name === 'RiskActCdBox' && obj['RiskActCd']) {
                    layui.each(obj['RiskActCd'].split(','), function(idx, key) {
                        var el = $('[lay-filter=' + name + '][hyd-key=' + key + ']');
                        el.prop('checked', true);
                        layui.event.call(el, 'form', renderType+'('+name+')', {
                            elem: el.get(0)
                            ,value: key
                            ,othis: null
                        });
                    });
                    form.render('checkbox');
                }
                
                if (name === 'SenderBodyStrBox' && obj['SenderBodyStr']) {
                    layui.each(obj['SenderBodyStr'].split(','), function(idx, key) {
                        var el = $('[lay-filter=' + name + '][hyd-key=' + key + ']');
                        el.prop('checked', true);
                        layui.event.call(el, 'form', renderType+'('+name+')', {
                            elem: el.get(0)
                            ,value: key
                            ,othis: null
                        });
                    });
                    form.render('checkbox');
                }
                
                if (name === 'IfNomedication' && obj[name]){
                    var el = $('[lay-filter=' + name + '][value=' + obj[name] + ']');
                    layui.event.call(el, 'form', renderType+'('+name+')', {
                        elem: el.get(0)
                        ,value: obj[name]
                        ,othis: null
                    });
                }
                
                
                if (obj[name]) {
                    layui.event.call($(item), 'form', renderType+'('+filter+')', {
                        elem: $(item).get(0)
                        ,value: obj[name]
                        ,othis: null
                    });
                } 
            });
        
            if (obj['MedicineList']){
                var oData = [];
                $.each(obj['MedicineList'].split(','),function(idx,val){
                    var drgObj = val.split('|');
                    $.each(hdk.drug,function(i,o){
                        if (o.Cd == drgObj[0]){
                            o.vSpec = o.Spec.split(',');
                            o.vDrugSpecifications = $.inArray(drgObj[1],o.vSpec) != 0 ? drgObj[1] : o.vSpec[0];
                            o.Type = 'FUMedTp001';
                            o.DrugType = o.CtlRelease;
                            o.CountryDrugCd = o.Cd;
                            
                            if (o['CtlRelease'] === hdk.whether['是'].Cd) {
                                o.isLong = true;
                                o.vDrug = o.Nam;
                                o.lbDrugSpecifications = '规格';
                                o.lb1 = '剂量';
                                o.v1 = drgObj[2];
                                o.lb1Unit = 'mg';
                                o.lb2 = '每';
                                o.v2 = drgObj[3];
                                o.lb2Unit = o.CtlRelUnit;
                            } else {
                                o.isLong = false;
                                o.vDrug = o.Nam;
                                o.lbDrugSpecifications = '规格';
                                o.lb1 = '每早';
                                o.v1 = drgObj[4];
                                o.lb1Unit = 'mg';
                                o.lb2 = '每中';
                                o.v2 = drgObj[5];
                                o.lb2Unit = 'mg';
                                o.lb3 = '每晚';
                                o.v3 = drgObj[6];
                                o.lb3Unit = 'mg';
                            }
                            oData.push(o);
                            table.reload(drugTableID,{
                                data: oData,
                                done: function(res) {
                                    if (res.count === 0) return;
                                    layui.each(res.data, function(i, d) {
                                        if (d.isLong) {
                                            $('[lay-id=' + drugTableID + '] tr[data-index='+i+'] td[data-field=v3]').removeAttr('data-edit').remove();
                                            $('[lay-id=' + drugTableID + '] tr[data-index='+i+'] td[data-field=lb3Unit]').remove();
                                            $('[lay-id=' + drugTableID + '] tr[data-index='+i+'] td[data-field=lb3]').attr('colspan',3);
                                        }
                                    });
                                    form.render();
                                }
                            });
                        }
                    });
                });
            }
        }
        
    });
    
    exports('mhdr_report_patcard_add', {})
});
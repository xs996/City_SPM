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
        ,sfzTpCd = 'CertType001'
        ,formID = 'LAY-report-patinfo-add-form'
        ,drugTableID = 'LAY-report-patinfo-add-drug'
        ,drugGuideTableID = 'LAY-report-patinfo-add-drug-guide';

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
        
        
        if (router.search && router.search.p1) {
            isQuickMode = true;
            $('[name=InPatNo]').val(decodeURIComponent(router.search.p1));
            admin.req({
                url: '/rest/ThridCtr/queryOutAdms'
                ,type: 'post'
                ,async: false
                ,data: {queryString: $('input[name=InPatNo]').val()}
                ,done: function(res) {
                    if (res.data) {
                        if (res.data.length === 0 || (res.data.length > 0 && !res.data[0].hasOwnProperty('InciReportNum'))){
                            layer.alert('省网发病报告卡号获取失败,进行选择患者操作',function(i){
                                layer.close(i);
                                hdk.openWindow({
                                    content: $('#LAY-report-out-patinfo-window').html()
                                    ,area: ['1000px', '600px']
                                    ,success: function(layero, idx){
                                        var patInfoTable =table.render({
                                            elem: '#LAY-report-out-patinfo-table'
                                            ,url: '/rest/ReportCtr/queryPatCards'
                                            ,method: 'POST'
                                            ,contentType: 'application/json'
                                            ,where: lay.extend({},params,{reportStatus:'已审核',allQuery:'1'})
                                            ,response: {
                                                statusCode: 200
                                                ,msgName: 'message'
                                            }
                                            ,headers: headers
                                            ,page: true
                                            ,cols: [[
                                                {fixed: 'left',align:'center', toolbar: '#LAY-report-out-patinfo-toolbar'}
                                                ,{field: 'patName', title: '姓名'}
                                                ,{field: 'patSex', title: '性别'}
                                                ,{field: 'patDisease', title: '疾病名称'}
                                                ,{field: 'postStatus', title: '状态',templet:function(d){
                                                    return d['errorLog'] === 1 ? (d['postStatus'] + ' <span class="layui-badge" title="上传错误"><i class="layui-icon layui-icon-upload"></i></span>') : d['postStatus'];
                                                }}
                                            ]]
                                            ,height:400
                                        });
                                        
                                        $('.hyd-search-input',layero).on('keyup',function(e){
                                            patInfoTable.reload({
                                                where:lay.extend({},params,{reportStatus:'已审核',patName:$(e.currentTarget).val()})
                                            });
                                        });
                                        
                                        table.on('tool(LAY-report-out-patinfo-table)',function(o){
                                            if (o.data.postStatus === '待上传'){
                                                layer.msg('请选择已上传的患者');
                                                return;
                                            }
                                            formObject.relateLinkNum = o.data.linkNum;
                                            formObject.InciReportNum = o.data.linkNum;
                                            syncInfo();
                                            form.val(formID, formObject);
                                            form.render();
                                            $('[lay-filter=Add_IDCode]').trigger('blur');
                                            layer.close(idx);
                                        });
                                    }
                                });
                            });
                        }else{
                            formObject.relateLinkNum = res.data[0]['InciReportNum'];
                            formObject.InciReportNum = res.data[0]['InciReportNum'];
                            syncInfo();
                        }
                        
                        function syncInfo(){
                            admin.req({
                                url: '/rest/ReportCtr/getPatCard'
                                ,type: 'post'
                                ,async: false
                                ,data: {
                                    cd: formObject.relateLinkNum
                                }
                                ,done: function(res) {
                                    if (res.data.length) {
                                        var formData = res.data[0];
                                        formObject.relateCd = formData.cd;
                                        formObject.PatNam = formData.reportData.PatNam;
                                        formObject.GenderCd = formData.reportData.GenderCd;
                                        formObject.Gender = formData.reportData.Gender;
                                        formObject.IDTypeCd = formData.reportData.IDTypeCd;
                                        formObject.IDCode = formData.reportData.IDCode;
                                        formObject.BirthDate = formData.reportData.BirthDate;
                                        formObject.NationalityCd = formData.reportData.NationalityCd;
                                        formObject.InciReportCd = formData.linkCd;
                                        formObject.relateLinkCd = formData.linkCd;
                                    }
                                }
                            });
                            
                            formObject = $.extend({},formObject,res.data[0]);
                        }
                    }
                }
            });
        }

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

        if (router.search && router.search.relateLinkNum) {
            formObject.relateLinkNum = router.search.relateLinkNum;
            formObject.InciReportNum = router.search.relateLinkNum;
            admin.req({
                url: '/rest/ReportCtr/getPatCard'
                ,type: 'post'
                ,async: false
                ,data: {
                    cd: formObject.relateLinkNum
                }
                ,done: function(res) {
                    if (res.data.length) {
                        var formData = res.data[0];
                        formObject.relateCd = formData.cd;
                        formObject.PatNam = formData.reportData.PatNam;
                        formObject.GenderCd = formData.reportData.GenderCd;
                        formObject.Gender = formData.reportData.Gender;
                        formObject.IDTypeCd = formData.reportData.IDTypeCd;
                        formObject.IDCode = formData.reportData.IDCode;
                        formObject.BirthDate = formData.reportData.BirthDate;
                        formObject.NationalityCd = formData.reportData.NationalityCd;
                        formObject.InciReportCd = formData.linkCd;
                        formObject.relateLinkCd = formData.linkCd;
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
        if (formObject.IDTypeCd === sfzTpCd) {
            $('[lay-filter=Add_NationalityCd]').attr('disabled', true).addClass('layui-disabled');
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
                
                if (field == 'IfNomedication1') {
                    $('[name=IfNomedication1][value='+formObject.IfNomedication1+']').next().trigger('click');
                }
                
                if (field == 'IfNomedication2') {
                    $('[name=IfNomedication2][value='+formObject.IfNomedication2+']').next().trigger('click');
                }
                
            }
        });

        form.render();

        form.val(formID, formObject);

        // 初始化用药情况
        table.render({
            elem: '#' + drugTableID
            ,toolbar: '#LAY-report-patinfo-add-drug-header-toolbar'
            ,page: false
            ,minWidth: 600
            ,cellMinWidth: 40
            ,data: durgData
            ,defaultToolbar: []
            ,cols: [[
                {fixed: 'left',align:'center', toolbar: '#LAY-report-patinfo-add-drug-toolbar'}
                ,{field:'vDrug', minWidth:230, templet: '#LAY-report-patinfo-add-drug-column'}
                ,{field:'lbDrugSpecifications',align:'center', width:40}
                ,{field:'vDrugSpecifications',minWidth:280, templet: '#LAY-report-patinfo-add-drug-radio-column'}
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
            ,toolbar: '#LAY-report-patinfo-add-drug-guide-header-toolbar'
            ,page: false
            ,minWidth: 600
            ,cellMinWidth: 40
            ,data: drugGuideData
            ,defaultToolbar: []
            ,cols: [[
                {fixed: 'left',align:'center', toolbar: '#LAY-report-patinfo-add-drug-guide-toolbar'}
                ,{field:'vDrug', minWidth:230, templet: '#LAY-report-patinfo-add-drug-guide-column'}
                ,{field:'lbDrugSpecifications',align:'center', width:40}
                ,{field:'vDrugSpecifications',minWidth:280, templet: '#LAY-report-patinfo-add-drug-guide-radio-column'}
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

        // 提交验证
        form.verify({
            PatNam: function(value, item) {
                if (value && value.length > 10) {
                    return '该项最大只能10位长度';
                }
            }
            ,InPatNo: function(value, item) {
                if (value && value.length > 20) {
                    return '该项最大只能20位长度';
                }
            }
            ,IDCode: function(value, item) {
                if (!hdk.REGEX.identity.test(value)) {
                    return '请输入正确的身份证号';
                }
            }
            ,InMentalHos: function(value, item) {
                if (!/^\+?[1-9][0-9]{0,3}$/.test(value)) {
                    return '该项最大只能4位正整数';
                }
            }
            ,OtherMeasure: function(value, item) {
                if (value && value.length > 40) {
                    return '该项最大只能40位长度';
                }
            }
            ,Miscellaneous: function(value, item) {
                if (value && value.length > 40) {
                    return '该项最大只能40位长度';
                }
            }
            ,AdmissionDate: function(value, item) {
                return dateVerify('AdmissionDate');
            }
            ,DischargeDate: function(value, item) {
                return dateVerify('DischargeDate');
            }
            ,DiagnosisDate: function(value, item) {
                return dateVerify('DiagnosisDate');
            }
            ,FillDate: function(value, item) {
                return dateVerify('FillDate');
            }
            ,DocTel: function(value, item) {
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
                        layer.closeAll();
                        $('[lay-filter=Add_IDCode]').trigger('blur');
                    });


                    table.render({
                        elem: '#LAY-air-adm'
                        ,id: 'LAY-air-adm'
                        ,url: '/rest/ThridCtr/queryOutAdms'
                        ,method: 'POST'
                        ,contentType: 'application/json'
                        ,where: lay.extend({},params,{queryString: $('input[name=InPatNo]').val()})
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
                                    console.log(inputQuery);
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
            // 出生日期≤入院日期≤出院日期≤填表日期≤当前日期
            // 确诊日期≤出院日期≤当前日期
            // 确诊日期≤填表日期≤当前日期

            var now = moment().format('YYYY-MM-DD'),
                birth = $('[lay-filter=Add_BirthDate]').val(),
                inHos = $('[lay-filter=Add_AdmissionDate]').val(),
                outHos = $('[lay-filter=Add_DischargeDate]').val(),
                confirm = $('[lay-filter=Add_DiagnosisDate]').val(),
                fillCard = $('[lay-filter=Add_FillDate]').val();

            if (field === 'AdmissionDate') {
                if (moment(inHos).isBefore(birth)) {
                    return '【入院日期】不能早于【出生日期】';
                }

                if (moment(inHos).isAfter(now)) {
                    return '【入院日期】不能晚于【当前日期】';
                }
            } else if (field === 'DischargeDate') {
                if (moment(outHos).isBefore(inHos)) {
                    return '【出院日期】不能早于【入院日期】';
                }

                if (moment(outHos).isBefore(confirm)) {
                    return '【出院日期】不能早于【确诊日期】';
                }

                if (moment(outHos).isAfter(now)) {
                    return '【出院日期】不能晚于【当前日期】';
                }   
            } else if (field === 'DiagnosisDate') {
                if (moment(confirm).isBefore(birth)) {
                    return '【确诊日期】不能早于【出生日期】';
                }

                if (moment(confirm).isAfter(now)) {
                    return '【确诊日期】不能晚于【当前日期】';
                }  
            } else if (field === 'FillDate') {
                if (moment(fillCard).isBefore(outHos)) {
                    return '【填表日期】不能早于【出院日期】';
                }

                if (moment(fillCard).isBefore(confirm)) {
                    return '【填表日期】不能早于【确诊日期】';
                }

                if (moment(fillCard).isAfter(now)) {
                    return '【填表日期】不能晚于【当前日期】';
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

        $('[lay-filter=' + formID + ']').on('blur', '[lay-filter=Add_AdmissionDate]', function(e) {
            var vDate = e.target.value.replace(' ','');
            if (hdk.REGEX.date.test(vDate)) {
                form.val(formID, {
                    AdmissionDate: vDate
                });
            }
            return false;
        });

        $('[lay-filter=' + formID + ']').on('blur', '[lay-filter=Add_DischargeDate]', function(e) {
            var vDate = e.target.value.replace(' ','');
            if (hdk.REGEX.date.test(vDate)) {
                form.val(formID, {
                    DischargeDate: vDate
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

        $('[lay-filter=' + formID + ']').on('blur', '[lay-filter=Add_FillDate]', function(e) {
            var vDate = e.target.value.replace(' ','');
            if (hdk.REGEX.date.test(vDate)) {
                form.val(formID, {
                    FillDate: vDate
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

        // 初始化入院时间
        laydate.render({
            elem: '[lay-filter=Add_AdmissionDate]'
            ,max: 0
            ,btns: ['clear', 'confirm']
            ,done: function(value, o) {

            }
        });

        // 初始化出院时间
        laydate.render({
            elem: '[lay-filter=Add_DischargeDate]'
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

        // 初始化填卡日期
        laydate.render({
            elem: '[lay-filter=Add_FillDate]'
            ,max: 0
            ,btns: ['clear', 'confirm']
            ,done: function(value, o) {

            }
        });

        form.on('select(Add_GenderCd)', function(o) {

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

        // 康复措施
        form.on('checkbox(MeasuresCdBox)', function(o) {
            var checked = [],
                hasOther = false;

            $('[lay-filter=MeasuresCdBox]:checked').each(function(idx, cb) {
                checked.push($(cb).attr('hyd-key'));
                if ($(cb).attr('title').indexOf('其他') != -1) {
                    hasOther = true;
                }
            });

            if (hasOther) {
                $('[lay-filter=Add_OtherMeasure]').removeClass('layui-hide').attr('lay-verify', 'required|OtherMeasure');
            } else {
                $('[lay-filter=Add_OtherMeasure]').addClass('layui-hide').removeAttr('lay-verify').val(null);
            }

            $('[lay-filter=Add_MeasuresCd]').val(checked);
        });

        // 疾病名称
        form.on('select(Add_DischgDiagCd)', function(o) {
            if (o.value === $(o.elem).data('previous')) return;

            $('[lay-filter=Add_DiagICD]').val(hdk.ICD10[o.value].DictCode);
            $('[lay-filter=Add_Disease]').val(hdk.ICD10[o.value].Nam);
            $(o.elem).data('previous', o.value);
        });
        
        //勿需服药
        form.on('radio(IfNomedication1)', function(o){
            if ('Whether001' === o.value){
                //填
                $('#LAY-report-patinfo-drug').removeClass('layui-hide');
            } else {
                //不填
                $('#LAY-report-patinfo-drug').addClass('layui-hide');
            }
        });
        
        form.on('radio(IfNomedication2)', function(o){
            if ('Whether001' === o.value){
                //填
                $('#LAY-report-patinfo-drug-guide').removeClass('layui-hide');
            } else {
                //不填
                $('#LAY-report-patinfo-drug-guide').addClass('layui-hide');
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
                                form.render('radio');
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

        // 用药情况导规格
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

        // 用药指导
        table.on('toolbar(' + drugGuideTableID + ')', function(o) {
            if (o.event != 'add') return;
            var oData = table.cache[drugGuideTableID],
                    oCount = 0;
            layui.each(oData, function(idx, r) {
                if (!$.isArray(r)) {
                    oCount = oCount + 1;
                }
            });

            if (oCount === 6) {
                layer.msg('用药指导已经记录6条记录');
                return;
            }

            layer.open({
                title:'药品查询'
                ,type: 1
                ,shadeClose: true
                ,area: ['700px', '410px']
                ,content: '<div style="padding:0 20px;" id="LAY-air-window"><input type="text" name="airQuery" id="airQuery" placeholder="搜索" class="layui-input" style="width: 280px;margin-bottom: -10px;margin-top: 20px;"><table class="layui-table"lay-filter="LAY-air-drug-guide" id="LAY-air-drug-guide"></table></div>'
                ,success: function(layero, idx) {

                    table.on('tool(LAY-air-drug-guide)', function(o) {
                        var existed = false;
                        layui.each(table.cache[drugGuideTableID], function(dIdx, dItem) {
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
                        o.data.Type = 'FUMedTp002';
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
                        table.reload(drugGuideTableID,{
                            data: oData,
                            done: function(res) {
                                if (res.count === 0) return;
                                layui.each(res.data, function(i, d) {
                                    if (d.isLong) {
                                        $('[lay-id=' + drugGuideTableID + '] tr[data-index='+i+'] td[data-field=v3]').removeAttr('data-edit').remove();
                                        $('[lay-id=' + drugGuideTableID + '] tr[data-index='+i+'] td[data-field=lb3Unit]').remove();
                                        $('[lay-id=' + drugGuideTableID + '] tr[data-index='+i+'] td[data-field=lb3]').attr('colspan',3);
                                    }
                                });
                                form.render('radio');
                                layer.closeAll();
                            }
                        });
                    });

                    table.render({
                        elem: '#LAY-air-drug-guide'
                        ,id: 'LAY-air-drug-guide'
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
                                        table.reload('LAY-air-drug-guide', {
                                            data: target
                                        });
                                    } else {
                                        table.reload('LAY-air-drug-guide', {
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

        // 用药指导填写
        table.on('edit(' + drugGuideTableID + ')', function(o) {
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
        // 用药情况导规格
        form.on('radio(DrugSpecifications-G)', function(o) {
            var rowIndex = o.othis.parents('tr').eq(0).data('index'),
                    key = o.othis.parents('.layui-table-view').eq(0).attr('lay-id'),
                    rowData = table.cache[key][rowIndex];

                rowData.vDrugSpecifications = o.value;
        });
        // 用药指导删除
        table.on('tool(' + drugGuideTableID + ')', function(o) {
            switch(o.event) {
                case 'del':
                    layer.confirm('是否删除该条用药指导记录?<br><span style="color:#FF5722;">【注：需要提交保存才生效】</span>', {
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

        form.on('submit(report-patinfo-add-save)', function(o) {
            var report = {
                admCd: o.field.InPatNo
                ,linkCd: o.field.linkCd
                ,linkNum: o.field.linkNum
                ,relateCd: o.field.relateCd
                ,relateLinkCd: o.field.relateLinkCd
                ,relateLinkNum: o.field.relateLinkNum
                ,reporterCd: layui.data(setter.tableName)[setter.request.userInfo].owner
                ,reporter: layui.data(setter.tableName)[setter.request.userInfo].name
                ,patName: o.field.PatNam
                ,patIDCard: o.field.IDCode
                ,patSex: o.field.IDCode.substring(14, 17) % 2 ? hdk.gender['男'].Nam:hdk.gender['女'].Nam
                ,patDisease: o.field.Disease
                ,patDiseaseCd: o.field.DischgDiagCd
                ,patDiseaseICD: o.field.DiagICD
            }
            ,meds = []
            ,medList = []
            ,stop = false;


            
            if(o.field.IfNomedication1 === 'Whether001'){
                stop = true;
                layui.each(table.cache[drugTableID], function(idx, med) {
                    if (!$.isArray(med)) {
                        meds.push(med);
                        stop = false;
                    }
                });
                
                if (stop) {
                    layer.msg('用药情况至少需要录入1条');
                    return;
                }
            }
            

            if(o.field.IfNomedication2 === 'Whether001'){
                stop = true;
                layui.each(table.cache[drugGuideTableID], function(idx, med) {
                    if (!$.isArray(med)) {
                        meds.push(med);
                        stop = false;
                    }
                });
                
                if (stop) {
                    layer.msg('用药指导至少需要录入1条');
                    return;
                }
            }

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

            if (stop) return;

            o.field.MedList = medList;
            report.reportData = o.field;
            admin.req({
                url: '/rest/ReportCtr/saveOutPatInfo'
                ,type: 'post'
                ,data: report
                ,done: function(res){
                    if (res.data.length === 1) {
                        layer.msg('操作成功!');
                        if (isQuickMode) return;
                        setTimeout(function() {
                            location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo/relateLinkNum=' + o.field.relateLinkNum);
                        }, 1000);
                    }
                }
            })
        });

        $('[lay-filter=' + formID + ']').on('click', '[lay-filter=report-patinfo-add-back]', function(o) {
            var relateLinkNum = $('[lay-filter=Add_relateLinkNum]').val();
            if (relateLinkNum) {
                location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo/relateLinkNum=' + relateLinkNum);
            } else {
                location.hash = layui.admin.correctRouter('/mhdr_report/mhdr_report_out_patinfo');
            }
        });
        
        
        var reloadPatInfo = function (obj) {
            var elem = $('[lay-filter=' + formID + ']'),
            	dictElem = elem.find('*[hyd-dict]');
            dictElem.each(function(idx,item){
                var filter = $(item).attr('lay-filter'),
                    name = $(item).attr('hyd-dict-field') || $(item).attr('name'),
                    renderType = item.tagName.toLowerCase() === 'select' ? 'select' : $(item).attr('hyd-dict-render');
                    
                if (name === 'MeasuresCdBox' && obj['MeasuresCd']) {
                    layui.each(obj['MeasuresCd'].split(','), function(idx, key) {
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
                
                
                if (name === 'IfNomedication1' && obj[name]){
                    var el = $('[lay-filter=' + name + '][value=' + obj[name] + ']');
                    layui.event.call(el, 'form', renderType+'('+name+')', {
                        elem: el.get(0)
                        ,value: obj[name]
                        ,othis: null
                    });
                }
                
                if (name === 'IfNomedication2' && obj[name]){
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
        
            if (obj['MedicineList1']){
                var oData = [];
                $.each(obj['MedicineList1'].split(','),function(idx,val){
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
            
            if (obj['MedicineList2']){
                var oData = [];
                $.each(obj['MedicineList2'].split(','),function(idx,val){
                    var drgObj = val.split('|');
                    $.each(hdk.drug,function(i,o){
                        if (o.Cd == drgObj[0]){
                            o.vSpec = o.Spec.split(',');
                            o.vDrugSpecifications = $.inArray(drgObj[1],o.vSpec) != 0 ? drgObj[1] : o.vSpec[0];
                            o.Type = 'FUMedTp002';
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
                            table.reload(drugGuideTableID,{
                                data: oData,
                                done: function(res) {
                                    if (res.count === 0) return;
                                    layui.each(res.data, function(i, d) {
                                        if (d.isLong) {
                                            $('[lay-id=' + drugGuideTableID + '] tr[data-index='+i+'] td[data-field=v3]').removeAttr('data-edit').remove();
                                            $('[lay-id=' + drugGuideTableID + '] tr[data-index='+i+'] td[data-field=lb3Unit]').remove();
                                            $('[lay-id=' + drugGuideTableID + '] tr[data-index='+i+'] td[data-field=lb3]').attr('colspan',3);
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
    
    exports('mhdr_report_out_patinfo_add', {})
});
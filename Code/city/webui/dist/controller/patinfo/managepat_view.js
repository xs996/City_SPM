layui.define(function(exports){
    
    layui.use(['laydate','table','element','hdk','form'], function(){
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
            elem: '.date'
            ,max: 0
            ,range: true
            ,done: function(o) {
            }
        });
        table.render({
            elem: '#managepatpat'
            ,url: '/rest/ReportCtr/queryOutPatInfos' //模拟接口
            ,toolbar: true
            ,method: 'POST'
            ,contentType: 'application/json'
            ,response: {
                statusCode: 200
                ,msgName: 'message'
            }
            ,headers: headers
            ,defaultToolbar: []
            ,page: true
            ,cols: [[
                 {field: 'cd', title: '患者编号', minWidth: 120}
                ,{field: 'relateLinkNum', title: '患者姓名', minWidth: 80}
                ,{field: 'patName', title: '性别', minWidth: 80}
                ,{field: 'patSex', title: '出生日期', width: 60}
                ,{field: 'patDisease', title: '患者编号'}
                ,{field: 'createTime', title: '现住址详细地址'}
                ,{field: 'reportStatus', title: '目前诊断'}
                ,{field: 'reportStatus', title: '创建日期'}
                ,{fixed: 'right', minWidth:120, align:'center', toolbar: '#operation'}
            ]]
            ,skin: 'line'
        });
    });
    
    exports('managepat_view', {})
});
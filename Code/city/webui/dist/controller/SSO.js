layui.define(function(exports){
    
    layui.use(['admin','hdk'], function(){
        var $ = layui.$
        ,router = layui.router()
        ,setter = layui.setter
        ,hdk = layui.hdk
        ,admin = layui.admin
        ,search = router.search;
        
        if (!search.owner || !search.appid || !search.type || !search.p1) {
            layer.msg('无法进入Quick模式, 请检查URL');
            return;
        }

        //请求登入接口
        admin.req({
            url: '/rest/SysCtr/SSO'
            ,type: 'POST'
            ,data: {
                appid: search.appid
                ,owner: search.owner 
            }
            ,done: function(res, request, response){

                var statusCode = setter.response.statusCode;
                layui.data(setter.tableName, {
                    key: setter.request.tokenName
                    ,value: response.getResponseHeader(setter.request.tokenName)
                });
                layui.data(setter.tableName, {
                    key: setter.request.userInfo
                    ,value: {
                        owner: res.data[0].owner
                        ,name: res.data[0].name
                        ,gender: res.data[0].gender
                        ,cellphone: res.data[0].cellphone
                        ,levelCd: res.data[0].levelCd
                        ,levelName: res.data[0].levelName
                        ,workNo: res.data[0].workNo
                        ,org: res.data[0].org
                        ,OrganCd: res.data[0].OrganCd
                        ,OrgNam: res.data[0].OrgNam
                        ,ZoneCd: res.data[0].ZoneCd
                        ,ZoneNam: res.data[0].ZoneNam
                        ,City: res.data[0].City
                        ,Province: res.data[0].Province
                    }
                });

                layui.data(setter.tableName, {
                    key: setter.request.owner
                    ,value: res.data[0].owner
                });

                if (search.type === '1') {
                    layui.view('LAY_quick_app_body').render('mhdr_report/mhdr_report_patcard_add', function() {
                        admin.pageType = 'alone';
                    });
                } else if (search.type === '2') {
                    layui.view('LAY_quick_app_body').render('mhdr_report/mhdr_report_out_patinfo_add', function() {
                        admin.pageType = 'alone';
                    });
                }
            }
        });
    });
    
    exports('SSO', {})
});
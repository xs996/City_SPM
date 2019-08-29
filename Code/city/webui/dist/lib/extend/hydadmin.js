/**

 @Name：HydAdmin 核心模块
 @Author：徐豪
        
 */
 
layui.define(['view', '_admin'], function(exports){
    var $ = layui.jquery
    ,laytpl = layui.laytpl
    ,layer = layui.layer
    ,setter = layui.setter
    ,device = layui.device()
    ,hint = layui.hint()
    ,view = layui.view
    ,admin = layui._admin;

    admin.userinfo = function() {
    	var user={name:"模拟用户",levelCd:5,owner:"",workNo:"bj-sc",org:"成都第四人民医院"};
    	layui.data(setter.tableName, {
                                key: setter.request.userInfo
                                ,value: user
                            });
        return user;
    };
    
    

    //对外输出
    exports('admin', admin);
});

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
    	var item={name:"测试用户"}
    	return item;
        //return layui.data(setter.tableName)[setter.request.userInfo];
    };

    //对外输出
    exports('admin', admin);
});

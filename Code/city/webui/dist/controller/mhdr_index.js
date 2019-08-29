layui.define(['laytpl'],function(exports){
    var admin = layui.admin,
        laytpl = layui.laytpl;
        $.ajax({
        	url: ('/rest/SysCtr/getVersion')
        	,method: 'get'
        	,dataType:'json'
        	,success:function(res){
        		var versionTemplate = $('#versionTemplate').html();
        		versionTemplate
        		laytpl(versionTemplate).render(res,function(html){
        		    $('#versionTable').html(html);
        		});
        	}
        });
    
    
    exports('mhdr_index', {})
});
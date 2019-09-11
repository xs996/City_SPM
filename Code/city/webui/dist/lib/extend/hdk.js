/**

 @Name：Hdk 核心模块
 @Author：徐豪
		
 */
 
layui.define(['view','admin'], function(exports){
	var $ = layui.jquery
	,laytpl = layui.laytpl
	,layer = layui.layer
	,setter = layui.setter
	,device = layui.device()
	,hint = layui.hint()
	,view = layui.view
    ,admin = layui.admin
	hdk = {
		REGEX: {
			positiveInteger: /^\+?[1-9][0-9]{0,9}$/
			,postiveFloat: /^[0-9]{1,10}(\.[0-9]{0,2})?$/
			,identity: /(^\d{17}(x|X|\d)$)/
			,date: /^(\d{4})[-\/](\d{1}|0\d{1}|1[0-2])([-\/](\d{1}|0\d{1}|[1-2][0-9]|3[0-1]))*$/
			,phone: /^((\+?86)|(\+86))?(1[3-9][0-9]{9})$/
            ,mobilePhone: /^([0-9]{3,4}-)?[0-9]{7,8}$/
		},
		regis:{
		    pagesx:{},
            test:{
		        ke:k2,
                wa:w2
            },
        }
        ,openWindow: function(options) {
            layer.open($.extend({
                type: 1
            },options));
        }
        ,getReqParams:function(){
            var params = {};
            params[setter.request['owner']] = layui.data(setter.tableName)[setter.request['owner']];
            return params;
        }
        ,getReqHeaders:function(){
            var headers = {};
            headers[setter.request.tokenName] = layui.data(setter.tableName)[setter.request.tokenName];
            return headers;
        }
        ,tab:{
            open:function(options){
                if ((options.module && typeof options.module === 'string') && (options.params && typeof options.params === 'object')){
                    layui.data[options.module] = function(){
                        layui.use(options.module, function (module) {
                            var o = {data: options.params,container:$('#LAY_app_body').find('.layadmin-tabsbody-item.layui-show')};
                            module(o);
                        });
                    }
                }
                location.hash = admin.correctRouter(options.href);
            },
            close:function(){
                
            }
        }
        ,initSelectBox:function(options){
            var init = function(obj){
                var elem = $(obj.elem),
                    isEmpty = obj.isEmpty || true;
                
                var str = '';
                
                if (isEmpty){
                    $(obj.elem).empty();
                }
                
                $.each(obj.data, function(i,o){
                    if (obj.mapping){
                        str += '<li value='+o[obj.mapping.value]+' class="'+ (obj.defaultValue === o.value ? 'selected' : '') +'">'+o[obj.mapping.name]+'</li>';
                    } else {
                        str += '<li value='+o.value+' class="'+ (obj.defaultValue === o.value ? 'selected' : '') +'" >'+o.name+'</li>';
                    }
                });
                
                elem.append(str);
                
                elem.on('click',function(e){
                    $(e.currentTarget).find('li.selected').toggleClass('selected');
                    $(e.target).toggleClass('selected');
                });
                
                
                if (obj.callback) {
                    obj.callback();
                }
            }
            
            if ($.isArray(options)){
                $.each(options,function(i,o){
                    init(o);
                });
            } else {
                init(options);
            }
        }
        ,flow:{
            config: null
            ,render: function(options){
                this.config = options;
                var that = this
                    ,page = 1
                    ,ui = options.ui
                    ,LIMIT = options.limit
                    ,more = $('<div lay-filter="flow-more" class="hyd-flow-more"></div>')
                    ,start = $('<span style="cursor: pointer;">↓ 下滑加载更多</span>')
                    ,end = $('<span>已经到底啦</span>')
                    ,icon = $('<i class="layui-icon layui-icon-loading-1 layui-anim layui-anim-rotate" />')
                    ,noRes = $('<span>无数据</span>')
                    ,stop = false;
                    
                var init = function(fn){
                    view.req({
                        url: options.url
                        ,type: 'post'
                        ,data: $.extend({},{page:page,limit:LIMIT},(options.where || {}))
                        ,done: function(res){
                            if (fn && typeof fn === 'function') fn.call();
                            that.show(res.data);
                            if (options.done && typeof options.done === 'function'){
                                options.done(res.data,page);
                            }
                            if ($(options.elem).parent().find('[lay-filter=flow-more]').length === 0){
                                $(options.elem).parent().append(more);
                            }
                            if (0 === res.count){
                                 $(options.elem).parent().find('[lay-filter=flow-more]').html(noRes);
                                 return that;
                            }
                            if (page * LIMIT >= res.count){
                                $(options.elem).parent().find('[lay-filter=flow-more]').html(end);
                                stop = true;
                            } else if (page * LIMIT < res.count){
                                start.off('click').on('click', function(e){
                                    var tmp = $(options.elem).parent().find('[lay-filter=flow-more]').html();
                                    $(options.elem).parent().find('[lay-filter=flow-more]').html(icon);
                                    setTimeout(function(){
                                        init(function(){
                                            $(options.elem).parent().find('[lay-filter=flow-more]').html(tmp);
                                        });
                                    }, 500);
                                });
                                $(options.elem).parent().find('[lay-filter=flow-more]').html(start);
                            }
                            page++;
                            $(options.elem).parents('.layadmin-tabsbody-item').off('scroll').on('scroll', function(e){
                                if ($(e.target).find(options.elem).length === 0){
                                    $(e.target).off('scroll');
                                }
                                
                                var viewH = $(e.target).height()
                                    ,contentH = $(e.target).get(0).scrollHeight
                                    ,scrollTop = $(e.target).scrollTop();
                                
                                if ((contentH -viewH) - scrollTop <= 0) {
                                    if (stop) return;
                                    var tmp = $(options.elem).parent().find('[lay-filter=flow-more]').html();
                                    $(options.elem).parent().find('[lay-filter=flow-more]').html(icon);
                                    setTimeout(function(){
                                        init(function(){
                                            $(options.elem).parent().find('[lay-filter=flow-more]').html(tmp);
                                        });
                                    }, 500);
                                }
                            });
                        }
                    });
                };
                init();
                
                return that;
            }
            ,show: function(data){
                var that = this;
                $.each(data, function(i,o){
                    var keys = Object.keys(o),currUi = that.config.ui;
                    $.each(keys,function(idx,key){
                        currUi = currUi.replace('$'+key+'$',o[key]);
                    });
                    var uiElem = $(currUi);
                    if (that.config.dbClick && typeof that.config.dbClick === 'function'){
                        uiElem.on('dblclick',function(e){
                            that.config.dbClick({
                                that:e
                                ,data:o
                            })
                        });
                    }
                    $(that.config.elem).append(uiElem);
                });
            }
            ,reload: function(options){
                var that = this;
                $(that.config.elem).empty();
                that.render($.extend(that.config, options));
            }
        }
    };

	//对外输出
	exports('hdk', hdk);
});

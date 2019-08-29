/**

 @Name：Hdk 核心模块
 @Author：徐豪
		
 */
 
layui.define(['view'], function(exports){
	var $ = layui.jquery
	,laytpl = layui.laytpl
	,layer = layui.layer
	,setter = layui.setter
	,device = layui.device()
	,hint = layui.hint()
	,view = layui.view
	hdk = {
		REGEX: {
			positiveInteger: /^\+?[1-9][0-9]{0,9}$/
			,postiveFloat: /^[0-9]{1,10}(\.[0-9]{0,2})?$/
			,identity: /(^\d{17}(x|X|\d)$)/
			,date: /^(\d{4})[-\/](\d{1}|0\d{1}|1[0-2])([-\/](\d{1}|0\d{1}|[1-2][0-9]|3[0-1]))*$/
			,phone: /^((\+?86)|(\+86))?(1[3-9][0-9]{9})$/
            ,mobilePhone: /^([0-9]{3,4}-)?[0-9]{7,8}$/
            
		}
		,zone: {}
		,whether: {}
		,gender: {}
		,ICD10: {}
		,precision: {}
		,dict: {
			root: './json/mhdr'
		}
		,getDict: function(options) {
			$.ajax({
				url: (hdk.dict.root + '/' + options.dict + '.json')
				,method: 'get'
				,dataType:'json'
				,success:function(json){
					if (options.done) options.done(json);
				}
			});
		}
		,renderDict: function(options) {
			var elem = $('[lay-filter=' + options.elem + ']'),
				dictElem = elem.find('*[hyd-dict]');
			dictElem.each(function(index, item){
				var id = $(item).attr('hyd-dict'),
					renderType = item.tagName.toLowerCase() === 'select' ? 'select' : $(item).attr('hyd-dict-render'),
					field = $(item).attr('hyd-dict-field') || $(item).attr('name');

				if (renderType === 'select') {
					hdk.getDict({
						dict: id
						,done: function(result) {
							layui.each(result, function (i, d) {
								$(item).append('<option value="' + d.Cd + '" ' + (d.State != '1'?'disabled=""':'') + '>' + (d.State === '1' ? d.Nam:('【作废】 ' + d.Nam)) + '</option>');
							});
							layui.form.render('select', options.elem);
							options.done(field);
						}
					});
				} else if (renderType === 'radio') {
					$(item).empty();
					hdk.getDict({
						dict: id
						,done: function(result) {
							layui.each(result, function (i, d) {
								$(item).append('<input lay-filter="' + field + '" type="radio" name="' + field + '" value="' + d.Cd + '" title="' + d.Nam+ '"' + (i === 0 ? 'checked=""' : '') + '>');
							});
							layui.form.render('radio', options.elem);
							options.done(field);
						}
					});
				} else if (renderType === 'checkbox') {
					$(item).empty();
					hdk.getDict({
						dict: id
						,done: function(result) {
							layui.each(result, function (i, d) {
								$(item).append('<input lay-filter="' + field + '" type="checkbox" hyd-key="' + d.Cd + '" name="' + field + '[' + d.Cd + ']" title="' + d.Nam+ '">');
							});
							layui.form.render('checkbox', options.elem);
							options.done(field);
						}
					});
				}
			});
		}
		,initDrugData: function(done) {
			hdk.getDict({
				dict: 'CountryDrugDict'
				,done: function(result) {
					hdk.drug = result || [];
					if (typeof done === 'function') done();
				}
			});
		}
		,initPrecision: function(done) {
			hdk.getDict({
				dict: 'Timpre'
				,done: function(result) {
					hdk.precision = hdk.setKeyData({},result,'Nam');
					if (typeof done === 'function') done();
				}
			});
		}
		,initWhether: function(done) {
			hdk.getDict({
				dict: 'Whether'
				,done: function(result) {
					hdk.whether = hdk.setKeyData({},result,'Nam');
					if (typeof done === 'function') done();
				}
			});
		}
		,initGender: function(done) {
			hdk.getDict({
				dict: 'Sex'
				,done: function(result) {
					hdk.gender = hdk.setKeyData({},result,'Nam');
					if (typeof done === 'function') done();
				}
			});
		}
		,initICD10: function(done) {
			hdk.getDict({
				dict: 'ICD'
				,done: function(result) {
					hdk.ICD10 = hdk.setKeyData({},result,'Cd');
					if (typeof done === 'function') done();
				}
			});
		}
		,initAddressData: function(done) {
			hdk.getDict({
				dict: 'Zone'
				,done: function(result) {
					hdk.zone = hdk.setGroupData({},result,'LevCd');
					layui.each(hdk.zone, function(prop, o) {
						hdk.zone[prop] = layui.sort(o,'Cd');
					});
					if (typeof done === 'function') done();
				}
			});
		}
		,setGroupData: function(object, data, node) {
			var object = object || {};
			layui.each(data, function(idx, o) {
				if (!object[o[node]]) {
					object[o[node]] = [];
            }
				object[o[node]].push(o);
			});
			return object;
		}
		,setKeyData: function(object, data, node) {
			var object = object || {};
			layui.each(data, function(idx, o) {
				object[o[node]] = o;
			});
			return object;
		}
		,getZoneData: function(level, node) {
			var data = [];
			layui.each(hdk.zone[level], function(idx, o) {
				if (node === o.ParCd) {
					data.push(o);
				}
			});
			return data;
		}
		,renderOption: function(filter, data, text) {
			var defaultText = text || '请选择';
			$('[lay-filter=' + filter + ']').empty();
			$('[lay-filter=' + filter + ']').append('<option value="">' + defaultText + '</option>');
			layui.each(data, function (i, d) {
				$('[lay-filter=' + filter + ']').append('<option value="' + d.Cd + '">' + d.Nam + '</option>');
			});
		}
        ,getUserZone: function(zoneCd) {
            var obj = {},that = this;
            //市
            layui.each(hdk.zone['RegLevel003'], function(idx, o) {
            	if (zoneCd === o.Cd) {
            		obj.City = o.ParCd;
            	}
            });
            //省
            layui.each(hdk.zone['RegLevel002'], function(idx, o) {
            	if (obj.City === o.Cd) {
            		obj.Province = o.ParCd;
            	}
            });
            obj.County = zoneCd
            return  obj;
        }
        ,openWindow: function(options) {
            layer.open($.extend({
                type: 1
            },options));
        }
    };

	//对外输出
	exports('hdk', hdk);
});

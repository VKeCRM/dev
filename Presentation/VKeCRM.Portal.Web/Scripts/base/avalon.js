/*==================================================
 Copyright 20013-2014 司徒正美 and other contributors
 http://www.cnblogs.com/rubylouvre/
 https://github.com/RubyLouvre
 http://weibo.com/jslouvre/
 
 Released under the MIT license
 avalon 1.3.2 2014.7.25
 ==================================================*/
(function(DOC) {
    var prefix = "ms-"
    var expose = new Date - 0
    var subscribers = "$" + expose
    var window = this || (0, eval)("this") //http://addyosmani.com/blog/understanding-mvvm-a-guide-for-javascript-developers/
    var otherRequire = window.require
    var otherDefine = window.define
    var stopRepeatAssign = false
    var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
    var rnative = /\[native code\]/  //判定是否原生函数
    var rcomplexType = /^(?:object|array)$/
    var rwindow = /^\[object (Window|DOMWindow|global)\]$/
    var oproto = Object.prototype
    var ohasOwn = oproto.hasOwnProperty
    var serialize = oproto.toString
    var ap = Array.prototype
    var aslice = ap.slice
    var Registry = {} //将函数曝光到此对象上，方便访问器收集依赖
    var W3C = window.dispatchEvent
    var root = DOC.documentElement
    var head = DOC.getElementsByTagName("head")[0] //HEAD元素
    var hyperspace = DOC.createDocumentFragment()
    var cinerator = DOC.createElement("div")
    var class2type = {}
    "Boolean Number String Function Array Date RegExp Object Error".replace(rword, function(name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })

    function noop() {
    }

    function log(a) {
        if (window.console && avalon.config.debug) {
            console.log(W3C ? a : a + "")
        }
    }

    /*********************************************************************
     *                    命名空间与工具函数                               *
     **********************************************************************/
    avalon = function(el) { //创建jQuery式的无new 实例化结构
        return new avalon.init(el)
    }

    avalon.init = function(el) {
        this[0] = this.element = el
    }
    avalon.fn = avalon.prototype = avalon.init.prototype

    /*取得目标的类型*/
    function getType(obj) {
        if (obj == null) {
            return String(obj)
        }
        // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
        return typeof obj === "object" || typeof obj === "function" ?
                class2type[serialize.call(obj)] || "object" :
                typeof obj
    }
    avalon.type = getType

    avalon.isWindow = function(obj) {
        if (!obj)
            return false
        // 利用IE678 window == document为true,document == window竟然为false的神奇特性
        // 标准浏览器及IE9，IE10等使用 正则检测
        return obj == obj.document && obj.document != obj
    }

    function isWindow(obj) {
        return rwindow.test(serialize.call(obj))
    }
    if (isWindow(window)) {
        avalon.isWindow = isWindow
    }
    /*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/
    avalon.isPlainObject = function(obj) {
        if (getType(obj) !== "object" || obj.nodeType || this.isWindow(obj)) {
            return false
        }
        try {
            if (obj.constructor && !ohasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false
            }
        } catch (e) {
            return false
        }
        return true
    }
    if (rnative.test(Object.getPrototypeOf)) {
        avalon.isPlainObject = function(obj) {
            return !!obj && typeof obj === "object" && Object.getPrototypeOf(obj) === oproto
        }
    }
    //与jQuery.extend方法，可用于浅拷贝，深拷贝
    avalon.mix = avalon.fn.mix = function() {
        var options, name, src, copy, copyIsArray, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false

        // 如果第一个参数为布尔,判定是否深拷贝
        if (typeof target === "boolean") {
            deep = target
            target = arguments[1] || {}
            i++
        }

        //确保接受方为一个复杂的数据类型
        if (typeof target !== "object" && getType(target) !== "function") {
            target = {}
        }

        //如果只有一个参数，那么新成员添加于mix所在的对象上
        if (i === length) {
            target = this
            i--
        }

        for (; i < length; i++) {
            //只处理非空参数
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name]
                    copy = options[name]

                    // 防止环引用
                    if (target === copy) {
                        continue
                    }
                    if (deep && copy && (avalon.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {

                        if (copyIsArray) {
                            copyIsArray = false
                            clone = src && Array.isArray(src) ? src : []

                        } else {
                            clone = src && avalon.isPlainObject(src) ? src : {}
                        }

                        target[name] = avalon.mix(deep, clone, copy)
                    } else if (copy !== void 0) {
                        target[name] = copy
                    }
                }
            }
        }
        return target
    }

    function resetNumber(a, n, end) { //用于模拟slice, splice的效果
        if ((a === +a) && !(a % 1)) { //如果是整数
            if (a < 0) {
                a = a * -1 >= n ? 0 : a + n
            } else {
                a = a > n ? n : a
            }
        } else {
            a = end ? n : 0
        }
        return a
    }

    function oneObject(array, val) {
        if (typeof array === "string") {
            array = array.match(rword) || []
        }
        var result = {},
                value = val !== void 0 ? val : 1
        for (var i = 0, n = array.length; i < n; i++) {
            result[array[i]] = value
        }
        return result
    }
    avalon.mix({
        rword: rword,
        subscribers: subscribers,
        version: 1.3,
        ui: {},
        log: log,
        slice: W3C ? function(nodes, start, end) {
            return aslice.call(nodes, start, end)
        } : function(nodes, start, end) {
            var ret = [],
                    n = nodes.length
            start = resetNumber(start, n)
            end = resetNumber(end, n, 1)
            for (var i = start; i < end; ++i) {
                ret[i - start] = nodes[i]
            }
            return ret
        },
        noop: noop,
        /*如果不用Error对象封装一下，str在控制台下可能会乱码*/
        error: function(str, e) {
            throw new (e || Error)(str)
        },
        /*将一个以空格或逗号隔开的字符串或数组,转换成一个键值都为1的对象*/
        oneObject: oneObject,
        /* avalon.range(10)
         => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
         avalon.range(1, 11)
         => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
         avalon.range(0, 30, 5)
         => [0, 5, 10, 15, 20, 25]
         avalon.range(0, -10, -1)
         => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
         avalon.range(0)
         => []*/
        range: function(start, end, step) { // 用于生成整数数组
            step || (step = 1)
            if (end == null) {
                end = start || 0
                start = 0
            }
            var index = -1,
                    length = Math.max(0, Math.ceil((end - start) / step)),
                    result = Array(length)
            while (++index < length) {
                result[index] = start
                start += step
            }
            return result
        },
        eventHooks: {},
        /*绑定事件*/
        bind: function(el, type, fn, phase) {
            var hooks = avalon.eventHooks
            var hook = hooks[type]
            if (typeof hook === "object") {
                type = hook.type
                if (hook.deel) {
                    fn = hook.deel(el, fn)
                }
            }
            var callback = W3C ? fn : function(e) {
                fn.call(el, fixEvent(e));
            }
            if (W3C) {
                el.addEventListener(type, callback, !!phase)
            } else {
                el.attachEvent("on" + type, callback)
            }
            return callback
        },
        /*卸载事件*/
        unbind: function(el, type, fn, phase) {
            var hooks = avalon.eventHooks
            var hook = hooks[type]
            var callback = fn || noop
            if (typeof hook === "object") {
                type = hook.type
            }
            if (W3C) {
                el.removeEventListener(type, callback, !!phase)
            } else {
                el.detachEvent("on" + type, callback)
            }
        },
        /*读写删除元素节点的样式*/
        css: function(node, name, value) {
            if (node instanceof avalon) {
                node = node[0]
            }
            var prop = /[_-]/.test(name) ? camelize(name) : name
            name = avalon.cssName(prop) || prop
            if (value === void 0 || typeof value === "boolean") { //获取样式
                var fn = cssHooks[prop + ":get"] || cssHooks["@:get"]
                var val = fn(node, name)
                return value === true ? parseFloat(val) || 0 : val
            } else if (value === "") { //请除样式
                node.style[name] = ""
            } else { //设置样式
                if (value == null || value !== value) {
                    return
                }
                if (isFinite(value) && !avalon.cssNumber[prop]) {
                    value += "px"
                }
                fn = cssHooks[prop + ":set"] || cssHooks["@:set"]
                fn(node, name, value)
            }
        },
        /*遍历数组与对象,回调的第一个参数为索引或键名,第二个或元素或键值*/
        each: function(obj, fn) {
            if (obj) { //排除null, undefined
                var i = 0
                if (isArrayLike(obj)) {
                    for (var n = obj.length; i < n; i++) {
                        fn(i, obj[i])
                    }
                } else {
                    for (i in obj) {
                        if (obj.hasOwnProperty(i)) {
                            fn(i, obj[i])
                        }
                    }
                }
            }
        },
        //收集元素的data-{{prefix}}-*属性，并转换为对象
        getWidgetData: function(elem, prefix) {
            var raw = avalon(elem).data()
            var result = {}
            for (var i in raw) {
                if (i.indexOf(prefix) === 0) {
                    result[i.replace(prefix, "").replace(/\w/, function(a) {
                        return a.toLowerCase()
                    })] = raw[i]
                }
            }
            return result
        },
        Array: {
            /*只有当前数组不存在此元素时只添加它*/
            ensure: function(target, item) {
                if (target.indexOf(item) === -1) {
                    target.push(item)
                }
                return target
            },
            /*移除数组中指定位置的元素，返回布尔表示成功与否*/
            removeAt: function(target, index) {
                return !!target.splice(index, 1).length
            },
            /*移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否*/
            remove: function(target, item) {
                var index = target.indexOf(item)
                if (~index)
                    return avalon.Array.removeAt(target, index)
                return false
            }
        }
    })

    //生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    function generateID() {
        return "avalon" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    /*判定类数组,如节点集合，纯数组，arguments与拥有非负整数的length属性的纯JS对象*/

    function isArrayLike(obj) {
        if (obj && typeof obj === "object" && !avalon.isWindow(obj)) {
            var n = obj.length
            if (+n === n && !(n % 1) && n >= 0) { //检测length属性是否为非负整数
                try {
                    if ({}.propertyIsEnumerable.call(obj, "length") === false) { //如果是原生对象
                        return Array.isArray(obj) || /^\s?function/.test(obj.item || obj.callee)
                    }
                    return true
                } catch (e) { //IE的NodeList直接抛错
                    return true
                }
            }
        }
        return false
    }
    /*视浏览器情况采用最快的异步回调(在avalon.ready里，还有一个分支，用于处理IE6-9)*/
    avalon.nextTick = window.setImmediate ? setImmediate.bind(window) : function(callback) {
        setTimeout(callback, 0) //IE10-11 or W3C
    }

    /*********************************************************************
     *                           modelFactory                             *
     **********************************************************************/
    //avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
    var VMODELS = avalon.vmodels = {}//所有vmodel都储存在这里
    avalon.define = function(id, factory) {
        if (VMODELS[id]) {
            log("warning: " + id + " 已经存在于avalon.vmodels中")
        }
        var scope = {
            $watch: noop
        }
        factory(scope) //得到所有定义
        var model = modelFactory(scope) //偷天换日，将scope换为model
        stopRepeatAssign = true
        factory(model)
        stopRepeatAssign = false
        model.$id = id
        return VMODELS[id] = model
    }

    function modelFactory(scope, model) {
        if (Array.isArray(scope)) {
            var arr = scope.concat()
            scope.length = 0
            var collection = Collection(scope)
            collection.push.apply(collection, arr)
            return collection
        }
        if (typeof scope.nodeType === "number") {
            return scope
        }
        var vmodel = {} //要返回的对象
        model = model || {} //放置$model上的属性
        var accessingProperties = {} //监控属性
        var normalProperties = {} //普通属性
        var computedProperties = [] //计算属性
        var watchProperties = arguments[2] || {} //强制要监听的属性
        var skipArray = scope.$skipArray //要忽略监控的属性
        for (var i = 0, name; name = skipProperties[i++]; ) {
            if (typeof name !== "string") {
                log("warning:$skipArray[" + name + "] must be a string")
            }
            delete scope[name]
            normalProperties[name] = true
        }
        if (Array.isArray(skipArray)) {
            for (var i = 0, name; name = skipArray[i++]; ) {
                normalProperties[name] = true
            }
        }
        for (var i in scope) {
            accessorFactory(i, scope[i], model, normalProperties, accessingProperties, computedProperties, watchProperties)
        }
        vmodel = defineProperties(vmodel, descriptorFactory(accessingProperties), normalProperties) //生成一个空的ViewModel
        for (var name in normalProperties) {
            vmodel[name] = normalProperties[name]
        }
        watchProperties.vmodel = vmodel
        vmodel.$model = model
        vmodel.$events = {}
        vmodel.$id = generateID()
        vmodel.$accessors = accessingProperties
        vmodel[subscribers] = []
        for (var i in Observable) {
            var fn = Observable[i]
            if (!W3C) { //在IE6-8下，VB对象的方法里的this并不指向自身，需要用bind处理一下
                fn = fn.bind(vmodel)
            }
            vmodel[i] = fn
        }
        vmodel.hasOwnProperty = function(name) {
            return name in vmodel.$model
        }
        for (var i = 0, fn; fn = computedProperties[i++]; ) { //最后强逼计算属性 计算自己的值
            Registry[expose] = fn
            fn()
            collectSubscribers(fn)
            delete Registry[expose]
        }
        return vmodel
    }
    //一些不需要被监听的属性
    var skipProperties = String("$id,$watch,$unwatch,$fire,$events,$model,$skipArray,$accessors," + subscribers).match(rword)
    //比较两个值是否相等
    var isEqual = Object.is || function(v1, v2) {
        if (v1 === 0 && v2 === 0) {
            return 1 / v1 === 1 / v2
        } else if (v1 !== v1) {
            return v2 !== v2
        } else {
            return v1 === v2
        }
    }

    function safeFire(a, b, c, d) {
        if (a.$events) {
            Observable.$fire.call(a, b, c, d)
        }
    }
    var descriptorFactory = W3C ? function(obj) {
        var descriptors = {}
        for (var i in obj) {
            descriptors[i] = {
                get: obj[i],
                set: obj[i],
                enumerable: true,
                configurable: true
            }
        }
        return descriptors
    } : function(a) {
        return a
    }
//循环生成访问器属性需要的setter, getter函数（这里统称为accessor）
    function accessorFactory(name, val, model, normalProperties, accessingProperties, computedProperties, watchProperties) {
        model[name] = val
        // 如果是元素节点 或者 在全局的skipProperties里 或者在当前的$skipArray里
        // 或者是以$开头并又不在watchPropertie里，这些属性是不会产生accessor
        if (normalProperties[name] || (val && val.nodeType) || (name.charAt(0) === "$" && !watchProperties[name])) {
            return normalProperties[name] = val
        }
        // 此外， 函数也不会产生accessor
        var valueType = getType(val)
        if (valueType === "function") {
            return normalProperties[name] = val
        }
        //总共产生三种accessor
        var accessor, oldArgs
        if (valueType === "object" && typeof val.get === "function" && Object.keys(val).length <= 2) {
            var setter = val.set,
                    getter = val.get
            //第1种对应计算属性， 因变量，通过其他监控属性触发其改变
            accessor = function(newValue) {
                var vmodel = watchProperties.vmodel
                var value = model[name],
                        preValue = value
                if (arguments.length) {
                    if (stopRepeatAssign) {
                        return
                    }
                    if (typeof setter === "function") {
                        var backup = vmodel.$events[name]
                        vmodel.$events[name] = [] //清空回调，防止内部冒泡而触发多次$fire
                        setter.call(vmodel, newValue)
                        vmodel.$events[name] = backup
                    }
                    if (!isEqual(oldArgs, newValue)) {
                        oldArgs = newValue
                        newValue = model[name] = getter.call(vmodel) //同步$model
                        withProxyCount && updateWithProxy(vmodel.$id, name, newValue) //同步循环绑定中的代理VM
                        notifySubscribers(accessor) //通知顶层改变
                        safeFire(vmodel, name, newValue, preValue) //触发$watch回调
                    }
                } else {
                    if (avalon.openComputedCollect) { // 收集视图刷新函数
                        collectSubscribers(accessor)
                    }
                    newValue = model[name] = getter.call(vmodel)
                    if (!isEqual(value, newValue)) {
                        oldArgs = void 0
                        safeFire(vmodel, name, newValue, preValue)
                    }
                    return newValue
                }
            }
            computedProperties.push(accessor)
        } else if (rcomplexType.test(valueType)) {
            //第2种对应子ViewModel或监控数组 
            accessor = function(newValue) {
                var realAccessor = accessor.$vmodel,
                        preValue = realAccessor.$model
                if (arguments.length) {
                    if (stopRepeatAssign) {
                        return
                    }
                    if (!isEqual(preValue, newValue)) {
                        newValue = accessor.$vmodel = updateVModel(realAccessor, newValue, valueType)
                        var fn = rebindings[newValue.$id]
                        fn && fn() //更新视图
                        var parent = watchProperties.vmodel
                        model[name] = newValue.$model //同步$model
                        notifySubscribers(realAccessor) //通知顶层改变
                        safeFire(parent, name, model[name], preValue) //触发$watch回调
                    }
                } else {
                    collectSubscribers(realAccessor) //收集视图函数
                    return realAccessor
                }
            }
            accessor.$vmodel = val.$model ? val : modelFactory(val, val)
            model[name] = accessor.$vmodel.$model
        } else {
            //第3种对应简单的数据类型，自变量，监控属性
            accessor = function(newValue) {
                var preValue = model[name]
                if (arguments.length) {
                    if (!isEqual(preValue, newValue)) {
                        model[name] = newValue //同步$model
                        var vmodel = watchProperties.vmodel
                        withProxyCount && updateWithProxy(vmodel.$id, name, newValue) //同步循环绑定中的代理VM
                        notifySubscribers(accessor) //通知顶层改变
                        safeFire(vmodel, name, newValue, preValue) //触发$watch回调
                    }
                } else {
                    collectSubscribers(accessor) //收集视图函数
                    return preValue
                }
            }
            model[name] = val
        }
        accessor[subscribers] = [] //订阅者数组
        accessingProperties[name] = accessor
    }
    //ms-with, ms-repeat绑定生成的代理对象储存池
    var withProxyPool = {}
    var withProxyCount = 0
    var rebindings = {}

    function updateWithProxy($id, name, val) {
        var pool = withProxyPool[$id]
        if (pool && pool[name]) {
            pool[name].$val = val
        }
    }
    //应用于第2种accessor
    function updateVModel(a, b, valueType) {
        //a为原来的VM， b为新数组或新对象
        if (valueType === "array") {
            if (!Array.isArray(b)) {
                return a //fix https://github.com/RubyLouvre/avalon/issues/261
            }
            var bb = b.concat()
            a.clear()
            a.push.apply(a, bb)
            return a
        } else {
            var iterators = a[subscribers] || []
            if (withProxyPool[a.$id]) {
                withProxyCount--
                delete withProxyPool[a.$id]
            }
            var ret = modelFactory(b)
            rebindings[ret.$id] = function(data) {
                while (data = iterators.shift()) {
                    (function(el) {
                        if (el.type) { //重新绑定
                            avalon.nextTick(function() {
                                el.rollback && el.rollback() //还原 ms-with ms-on
                                bindingHandlers[el.type](el, el.vmodels)
                            })
                        }
                    })(data)
                }
                delete rebindings[ret.$id]
            }
            return ret
        }
    }

    //===================修复浏览器对Object.defineProperties的支持=================
    var defineProperty = Object.defineProperty
    //如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
    //标准浏览器使用__defineGetter__, __defineSetter__实现
    try {
        defineProperty({}, "_", {
            value: "x"
        })
        var defineProperties = Object.defineProperties
    } catch (e) {
        if ("__defineGetter__" in avalon) {
            defineProperty = function(obj, prop, desc) {
                if ('value' in desc) {
                    obj[prop] = desc.value
                }
                if ("get" in desc) {
                    obj.__defineGetter__(prop, desc.get)
                }
                if ('set' in desc) {
                    obj.__defineSetter__(prop, desc.set)
                }
                return obj
            }
            defineProperties = function(obj, descs) {
                for (var prop in descs) {
                    if (descs.hasOwnProperty(prop)) {
                        defineProperty(obj, prop, descs[prop])
                    }
                }
                return obj
            }
        }
    }
    //IE6-8使用VBScript类的set get语句实现
    if (!defineProperties && window.VBArray) {
        window.execScript([
            "Function parseVB(code)",
            "\tExecuteGlobal(code)",
            "End Function",
            "Dim VBClassBodies",
            "Set VBClassBodies=CreateObject(\"Scripting.Dictionary\")",
            "Function findOrDefineVBClass(name,body)",
            "\tDim found",
            "\tfound=\"\"",
            "\tFor Each key in VBClassBodies",
            "\t\tIf body=VBClassBodies.Item(key) Then",
            "\t\t\tfound=key",
            "\t\t\tExit For",
            "\t\tEnd If",
            "\tnext",
            "\tIf found=\"\" Then",
            "\t\tparseVB(\"Class \" + name + body)",
            "\t\tVBClassBodies.Add name, body",
            "\t\tfound=name",
            "\tEnd If",
            "\tfindOrDefineVBClass=found",
            "End Function"
        ].join("\n"), "VBScript")

        function VBMediator(accessingProperties, name, value) {
            var accessor = accessingProperties[name]
            if (typeof accessor == "function") {
                if (arguments.length === 3) {
                    accessor(value)
                } else {
                    return accessor()
                }
            }
        }
        defineProperties = function(name, accessingProperties, normalProperties) {
            var className = "VBClass" + setTimeout("1"),
                    buffer = []

            buffer.push(
                    "\r\n\tPrivate [__data__], [__proxy__]",
                    "\tPublic Default Function [__const__](d, p)",
                    "\t\tSet [__data__] = d: set [__proxy__] = p",
                    "\t\tSet [__const__] = Me", //链式调用
                    "\tEnd Function")
            //添加普通属性,因为VBScript对象不能像JS那样随意增删属性，必须在这里预先定义好
            for (name in normalProperties) {
                buffer.push("\tPublic [" + name + "]")
            }
            buffer.push("\tPublic [" + 'hasOwnProperty' + "]")
            //添加访问器属性 
            for (name in accessingProperties) {
                if (!(name in normalProperties)) { //防止重复定义
                    buffer.push(
                            //由于不知对方会传入什么,因此set, let都用上
                            "\tPublic Property Let [" + name + "](val" + expose + ")", //setter
                            "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
                            "\tEnd Property",
                            "\tPublic Property Set [" + name + "](val" + expose + ")", //setter
                            "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
                            "\tEnd Property",
                            "\tPublic Property Get [" + name + "]", //getter
                            "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
                            "\t\tSet[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                            "\tIf Err.Number <> 0 Then",
                            "\t\t[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                            "\tEnd If",
                            "\tOn Error Goto 0",
                            "\tEnd Property")
                }
            }
            buffer.push("End Class")
            var code = buffer.join("\r\n"),
                    realClassName = window['findOrDefineVBClass'](className, code) //如果该VB类已定义，返回类名。否则用className创建一个新类。
            if (realClassName == className) {
                window.parseVB([
                    "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
                    "\tDim o",
                    "\tSet o = (New " + className + ")(a, b)",
                    "\tSet " + className + "Factory = o",
                    "End Function"
                ].join("\r\n"))
            }
            var ret = window[realClassName + "Factory"](accessingProperties, VBMediator) //得到其产品
            return ret //得到其产品
        }
    }
    /*********************************************************************
     *                           ecma262 v5语法补丁                   *
     **********************************************************************/
    if (!"司徒正美".trim) {
        var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
        String.prototype.trim = function() {
            return this.replace(rtrim, "")
        }
    }
    function outerHTML() {
        return new XMLSerializer().serializeToString(this)
    }
    function enumerateNode(node, targetNode) {
        if (node && node.childNodes) {
            var nodes = node.childNodes
            for (var i = 0, el; el = nodes[i++]; ) {
                if (el.tagName) {
                    var svg = document.createElementNS(svgns,
                            el.tagName.toLowerCase())
                    // copy attrs
                    ap.forEach.call(el.attributes, function(attr) {
                        svg.setAttribute(attr.name, attr.value)
                    })
                    // 递归处理子节点
                    enumerateNode(el, svg)
                    targetNode.appendChild(svg)
                }
            }
        }
    }
    var svgns = "http://www.w3.org/2000/svg"
    if (window.SVGElement) {
        var svg = document.createElementNS(svgns, "svg")
        svg.innerHTML = '<Rect width="300" height="100"/>'
        if (!(svg.firstChild && svg.firstChild.tagName === "rect")) {
            Object.defineProperties(SVGElement.prototype, {
                "outerHTML": {//IE9-11,firefox不支持SVG元素的innerHTML,outerHTML属性
                    enumerable: true,
                    configurable: true,
                    get: outerHTML,
                    set: function(html) {
                        var tagName = this.tagName.toLowerCase(),
                                par = this.parentNode,
                                frag = avalon.parseHTML(html)
                        // 操作的svg，直接插入
                        if (tagName === "svg") {
                            par.insertBefore(frag, this)
                            // svg节点的子节点类似
                        } else {
                            var newFrag = document.createDocumentFragment()
                            enumerateNode(frag, newFrag)
                            par.insertBefore(newFrag, this)
                        }
                        par.removeChild(this)
                    }
                },
                "innerHTML": {
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        var s = this.outerHTML
                        var ropen = new RegExp("<" + this.nodeName + '\\b(?:(["\'])[^"]*?(\\1)|[^>])*>', "i")
                        var rclose = new RegExp("<\/" + this.nodeName + ">$", "i")
                        return  s.replace(ropen, "").replace(rclose, "")
                    },
                    set: function(html) {
                        avalon.clearHTML(this)
                        var frag = avalon.parseHTML(html)
                        enumerateNode(frag, this)
                    }
                }
            })
        }
    }
    if (!root.outerHTML && window.HTMLElement) { //firefox 到11时才有outerHTML
        HTMLElement.prototype.__defineGetter__("outerHTML", outerHTML);
    }
    var enumerables = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(",")

    for (var i in {
        toString: 1
    }) {
        enumerables = false
    }
    if (!Object.keys) {
        Object.keys = function(obj) { //ecma262v5 15.2.3.14
            var result = []
            for (var key in obj)
                if (obj.hasOwnProperty(key)) {
                    result.push(key)
                }
            if (enumerables && obj) {
                for (var i = 0; key = enumerables[i++]; ) {
                    if (obj.hasOwnProperty(key)) {
                        result.push(key)
                    }
                }
            }
            return result
        }
    }
    if (!Array.isArray) {
        Array.isArray = function(a) {
            return a && getType(a) === "array"
        }
    }

    if (!noop.bind) {
        Function.prototype.bind = function(scope) {
            if (arguments.length < 2 && scope === void 0)
                return this
            var fn = this,
                    argv = arguments
            return function() {
                var args = [],
                        i
                for (i = 1; i < argv.length; i++)
                    args.push(argv[i])
                for (i = 0; i < arguments.length; i++)
                    args.push(arguments[i])
                return fn.apply(scope, args)
            }
        }
    }

    function iterator(vars, body, ret) {
        var fun = 'for(var ' + vars + 'i=0,n = this.length; i < n; i++){' + body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))') + '}' + ret
        return Function("fn,scope", fun)
    }
    if (!rnative.test([].map)) {
        avalon.mix(ap, {
            //定位操作，返回数组中第一个等于给定参数的元素的索引值。
            indexOf: function(item, index) {
                var n = this.length,
                        i = ~~index
                if (i < 0)
                    i += n
                for (; i < n; i++)
                    if (this[i] === item)
                        return i
                return -1
            },
            //定位操作，同上，不过是从后遍历。
            lastIndexOf: function(item, index) {
                var n = this.length,
                        i = index == null ? n - 1 : index
                if (i < 0)
                    i = Math.max(0, n + i)
                for (; i >= 0; i--)
                    if (this[i] === item)
                        return i
                return -1
            },
            //迭代操作，将数组的元素挨个儿传入一个函数中执行。Prototype.js的对应名字为each。
            forEach: iterator("", '_', ""),
            //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
            filter: iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
            //收集操作，将数组的元素挨个儿传入一个函数中执行，然后把它们的返回值组成一个新数组返回。Prototype.js的对应名字为collect。
            map: iterator('r=[],', 'r[i]=_', 'return r'),
            //只要数组中有一个元素满足条件（放进给定函数返回true），那么它就返回true。Prototype.js的对应名字为any。
            some: iterator("", 'if(_)return true', 'return false'),
            //只有数组中的元素都满足条件（放进给定函数返回true），它才返回true。Prototype.js的对应名字为all。
            every: iterator("", 'if(!_)return false', 'return true')
        })
    }

    function fixContains(a, b) {
        if (b) {
            while ((b = b.parentNode)) {
                if (b === a) {
                    return true;
                }
            }
        }
        return false;
    }
    if (!root.contains) { //safari5+是把contains方法放在Element.prototype上而不是Node.prototype
        Node.prototype.contains = function(arg) {
            return !!(this.compareDocumentPosition(arg) & 16)
        }
    }
    if (!DOC.contains) { //IE6-11的文档对象没有contains
        DOC.contains = function(b) {
            return fixContains(this, b)
        }
    }

    /*********************************************************************
     *                           配置模块                                  *
     **********************************************************************/

    function kernel(settings) {
        for (var p in settings) {
            if (!ohasOwn.call(settings, p))
                continue
            var val = settings[p]
            if (typeof kernel.plugins[p] === "function") {
                kernel.plugins[p](val)
            } else if (typeof kernel[p] === "object") {
                avalon.mix(kernel[p], val)
            } else {
                kernel[p] = val
            }
        }
        return this
    }
    var openTag, closeTag, rexpr, rexprg, rbind, rregexp = /[-.*+?^${}()|[\]\/\\]/g

    function escapeRegExp(target) {
        //http://stevenlevithan.com/regex/xregexp/
        //将字符串安全格式化为正则表达式的源码
        return (target + "").replace(rregexp, "\\$&")
    }
    var plugins = {
        loader: function(builtin) {
            window.define = builtin ? innerRequire.define : otherDefine
            window.require = builtin ? innerRequire : otherRequire
        },
        interpolate: function(array) {
            openTag = array[0]
            closeTag = array[1]
            if (openTag === closeTag) {
                throw new SyntaxError("openTag!==closeTag")
            } else if (array + "" === "<!--,-->") {
                kernel.commentInterpolate = true
            } else {
                var test = openTag + "test" + closeTag
                cinerator.innerHTML = test
                if (cinerator.innerHTML !== test && cinerator.innerHTML.indexOf("&lt;") >= 0) {
                    throw new SyntaxError("此定界符不合法")
                }
                cinerator.innerHTML = ""
            }
            var o = escapeRegExp(openTag),
                    c = escapeRegExp(closeTag)
            rexpr = new RegExp(o + "(.*?)" + c)
            rexprg = new RegExp(o + "(.*?)" + c, "g")
            rbind = new RegExp(o + ".*?" + c + "|\\sms-")
        }
    }
    kernel.debug = true
    kernel.plugins = plugins
    kernel.plugins['interpolate'](["{{", "}}"])
    kernel.paths = {}
    kernel.shim = {}
    kernel.maxRepeatSize = 100
    avalon.config = kernel

    /*********************************************************************
     *                      DOM API的高级封装                           *
     **********************************************************************/

    function hyphen(target) {
        //转换为连字符线风格
        return target.replace(/([a-z\d])([A-Z]+)/g, "$1-$2").toLowerCase()
    }

    function camelize(target) {
        //转换为驼峰风格
        if (target.indexOf("-") < 0 && target.indexOf("_") < 0) {
            return target //提前判断，提高getStyle等的效率
        }
        return target.replace(/[-_][^-_]/g, function(match) {
            return match.charAt(1).toUpperCase()
        })
    }

    var rnospaces = /\S+/g

    avalon.fn.mix({
        hasClass: function(cls) {
            var node = this[0] || {}
            if (node.nodeType === 1 && node.className) {
                return (" " + node.className + " ").indexOf(" " + cls + " ") > -1
            }
            return false
        },
        addClass: function(cls) {
            var node = this[0] || {}
            if (cls && typeof cls === "string" && node.nodeType === 1) {
                if (!node.className) {
                    node.className = cls
                } else {
                    var arr = node.className.match(rnospaces)
                    cls.replace(rnospaces, function(a) {
                        if (arr.indexOf(a) === -1) {
                            arr.push(a)
                        }
                    })
                    node.className = arr.join(" ")
                }
            }
            return this
        },
        removeClass: function(cls) {
            var node = this[0] || {}
            if (cls && typeof cls > "o" && node.nodeType === 1 && node.className) {
                var classNames = (cls || "").match(rnospaces) || []
                var cl = classNames.length
                var set = " " + node.className.match(rnospaces).join(" ") + " "
                for (var c = 0; c < cl; c++) {
                    set = set.replace(" " + classNames[c] + " ", " ")
                }
                node.className = set.slice(1, set.length - 1)
            }
            return this
        },
        toggleClass: function(value, stateVal) {
            var state = stateVal,
                    className, i = 0
            var classNames = value.match(rnospaces) || []
            var isBool = typeof stateVal === "boolean"
            while ((className = classNames[i++])) {
                state = isBool ? state : !this.hasClass(className)
                this[state ? "addClass" : "removeClass"](className)
            }
            return this
        },
        attr: function(name, value) {
            if (arguments.length === 2) {
                this[0].setAttribute(name, value)
                return this
            } else {
                return this[0].getAttribute(name)
            }
        },
        data: function(name, value) {
            name = "data-" + hyphen(name || "")
            switch (arguments.length) {
                case 2:
                    this.attr(name, value)
                    return this
                case 1:
                    var val = this.attr(name)
                    return parseData(val)
                case 0:
                    var ret = {}
                    ap.forEach.call(this[0].attributes, function(attr) {
                        if (attr) {
                            name = attr.name
                            if (!name.indexOf("data-")) {
                                name = camelize(name.slice(5))
                                ret[name] = parseData(attr.value)
                            }
                        }
                    })
                    return ret
            }
        },
        removeData: function(name) {
            name = "data-" + hyphen(name)
            this[0].removeAttribute(name)
            return this
        },
        css: function(name, value) {
            if (avalon.isPlainObject(name)) {
                for (var i in name) {
                    avalon.css(this, i, name[i])
                }
            } else {
                var ret = avalon.css(this, name, value)
            }
            return ret !== void 0 ? ret : this
        },
        position: function() {
            var offsetParent, offset,
                    elem = this[0],
                    parentOffset = {
                        top: 0,
                        left: 0
                    }
            if (!elem) {
                return
            }
            if (this.css("position") === "fixed") {
                offset = elem.getBoundingClientRect()
            } else {
                offsetParent = this.offsetParent() //得到真正的offsetParent
                offset = this.offset() // 得到正确的offsetParent
                if (offsetParent[0].tagName !== "HTML") {
                    parentOffset = offsetParent.offset()
                }
                parentOffset.top += avalon.css(offsetParent[0], "borderTopWidth", true)
                parentOffset.left += avalon.css(offsetParent[0], "borderLeftWidth", true)
            }
            return {
                top: offset.top - parentOffset.top - avalon.css(elem, "marginTop", true),
                left: offset.left - parentOffset.left - avalon.css(elem, "marginLeft", true)
            }
        },
        offsetParent: function() {
            var offsetParent = this[0].offsetParent || root
            while (offsetParent && (offsetParent.tagName !== "HTML") && avalon.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.offsetParent
            }
            return avalon(offsetParent || root)
        },
        bind: function(type, fn, phase) {
            if (this[0]) { //此方法不会链
                return avalon.bind(this[0], type, fn, phase)
            }
        },
        unbind: function(type, fn, phase) {
            if (this[0]) {
                avalon.unbind(this[0], type, fn, phase)
            }
            return this
        },
        val: function(value) {
            var node = this[0]
            if (node && node.nodeType === 1) {
                var get = arguments.length === 0
                var access = get ? ":get" : ":set"
                var fn = valHooks[getValType(node) + access]
                if (fn) {
                    var val = fn(node, value)
                } else if (get) {
                    return (node.value || "").replace(/\r/g, "")
                } else {
                    node.value = value
                }
            }
            return get ? val : this
        }
    })

    function parseData(data) {
        try {
            data = data === "true" ? true :
                    data === "false" ? false :
                    data === "null" ? null : +data + "" === data ? +data : rbrace.test(data) ? avalon.parseJSON(data) : data
        } catch (e) {
        }
        return data
    }
    var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
            rvalidchars = /^[\],:{}\s]*$/,
            rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
            rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
            rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g
    avalon.parseJSON = window.JSON ? JSON.parse : function(data) {
        if (typeof data === "string") {
            data = data.trim();
            if (data) {
                if (rvalidchars.test(data.replace(rvalidescape, "@")
                        .replace(rvalidtokens, "]")
                        .replace(rvalidbraces, ""))) {
                    return (new Function("return " + data))();
                }
            }
            avalon.error("Invalid JSON: " + data);
        }
    }

    //生成avalon.fn.scrollLeft, avalon.fn.scrollTop方法
    avalon.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(method, prop) {
        avalon.fn[method] = function(val) {
            var node = this[0] || {}, win = getWindow(node),
                    top = method === "scrollTop"
            if (!arguments.length) {
                return win ? (prop in win) ? win[prop] : root[method] : node[method]
            } else {
                if (win) {
                    win.scrollTo(!top ? val : avalon(win).scrollLeft(), top ? val : avalon(win).scrollTop())
                } else {
                    node[method] = val
                }
            }
        }
    })

    function getWindow(node) {
        return node.window && node.document ? node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
    }
    //=============================css相关=======================
    var cssHooks = avalon.cssHooks = {}
    var prefixes = ["", "-webkit-", "-o-", "-moz-", "-ms-"]
    var cssMap = {
        "float": "cssFloat",
        background: "backgroundColor"
    }
    avalon.cssNumber = oneObject("columnCount,order,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom")

    avalon.cssName = function(name, host, camelCase) {
        if (cssMap[name]) {
            return cssMap[name]
        }
        host = host || root.style
        for (var i = 0, n = prefixes.length; i < n; i++) {
            camelCase = camelize(prefixes[i] + name)
            if (camelCase in host) {
                return (cssMap[name] = camelCase)
            }
        }
        return null
    }
    cssHooks["@:set"] = function(node, name, value) {
        try { //node.style.width = NaN;node.style.width = "xxxxxxx";node.style.width = undefine 在旧式IE下会抛异常
            node.style[name] = value
        } catch (e) {
        }
    }
    if (window.getComputedStyle) {
        cssHooks["@:get"] = function(node, name) {
            if (!node || !node.style) {
                throw new Error("getComputedStyle要求传入一个节点 " + node)
            }
            var ret, styles = getComputedStyle(node, null)
            if (styles) {
                ret = name === "filter" ? styles.getPropertyValue(name) : styles[name]
                if (ret === "") {
                    ret = node.style[name] //其他浏览器需要我们手动取内联样式
                }
            }
            return ret
        }
        cssHooks["opacity:get"] = function(node) {
            var ret = cssHooks["@:get"](node, "opacity")
            return ret === "" ? "1" : ret
        }
    } else {
        var rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
        var rposition = /^(top|right|bottom|left)$/
        var ie8 = !!window.XDomainRequest
        var salpha = "DXImageTransform.Microsoft.Alpha"
        var border = {
            thin: ie8 ? '1px' : '2px',
            medium: ie8 ? '3px' : '4px',
            thick: ie8 ? '5px' : '6px'
        }
        cssHooks["@:get"] = function(node, name) {
            //取得精确值，不过它有可能是带em,pc,mm,pt,%等单位
            var currentStyle = node.currentStyle
            var ret = currentStyle[name]
            if ((rnumnonpx.test(ret) && !rposition.test(ret))) {
                //①，保存原有的style.left, runtimeStyle.left,
                var style = node.style,
                        left = style.left,
                        rsLeft = node.runtimeStyle.left
                //②由于③处的style.left = xxx会影响到currentStyle.left，
                //因此把它currentStyle.left放到runtimeStyle.left，
                //runtimeStyle.left拥有最高优先级，不会style.left影响
                node.runtimeStyle.left = currentStyle.left
                //③将精确值赋给到style.left，然后通过IE的另一个私有属性 style.pixelLeft
                //得到单位为px的结果；fontSize的分支见http://bugs.jquery.com/ticket/760
                style.left = name === 'fontSize' ? '1em' : (ret || 0)
                ret = style.pixelLeft + "px"
                //④还原 style.left，runtimeStyle.left
                style.left = left
                node.runtimeStyle.left = rsLeft
            }
            if (ret === "medium") {
                name = name.replace("Width", "Style")
                //border width 默认值为medium，即使其为0"
                if (currentStyle[name] === "none") {
                    ret = "0px"
                }
            }
            return ret === "" ? "auto" : border[ret] || ret
        }
        cssHooks["opacity:set"] = function(node, name, value) {
            node.style.filter = 'alpha(opacity=' + value * 100 + ')'
            node.style.zoom = 1
        }
        cssHooks["opacity:get"] = function(node) {
            //这是最快的获取IE透明值的方式，不需要动用正则了！
            var alpha = node.filters.alpha || node.filters[salpha],
                    op = alpha ? alpha.opacity : 100
            return (op / 100) + "" //确保返回的是字符串
        }
    }

    "top,left".replace(rword, function(name) {
        cssHooks[name + ":get"] = function(node) {
            var computed = cssHooks["@:get"](node, name)
            return /px$/.test(computed) ? computed :
                    avalon(node).position()[name] + "px"
        }
    })

    var cssShow = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }

    var rdisplayswap = /^(none|table(?!-c[ea]).+)/

    function showHidden(node, array) {
        //http://www.cnblogs.com/rubylouvre/archive/2012/10/27/2742529.html
        if (node.offsetWidth <= 0) { //opera.offsetWidth可能小于0
            if (rdisplayswap.test(cssHooks["@:get"](node, "display"))) {
                var obj = {
                    node: node
                }
                for (var name in cssShow) {
                    obj[name] = node.style[name]
                    node.style[name] = cssShow[name]
                }
                array.push(obj)
            }
            var parent = node.parentNode
            if (parent && parent.nodeType == 1) {
                showHidden(parent, array)
            }
        }
    }
    "Width,Height".replace(rword, function(name) {
        var method = name.toLowerCase(),
                clientProp = "client" + name,
                scrollProp = "scroll" + name,
                offsetProp = "offset" + name
        cssHooks[method + ":get"] = function(node, which, override) {
            var boxSizing = "content-box"
            if (typeof override === "string") {
                boxSizing = override
            }
            which = name === "Width" ? ["Left", "Right"] : ["Top", "Bottom"]
            switch (boxSizing) {
                case "content-box":
                    return node["client" + name] - avalon.css(node, "padding" + which[0], true) -
                            avalon.css(node, "padding" + which[1], true)
                case "padding-box":
                    return node["client" + name]
                case "border-box":
                    return node["offset" + name]
                case "margin-box":
                    return node["offset" + name] + avalon.css(node, "margin" + which[0], true) +
                            avalon.css(node, "margin" + which[1], true)
            }
        }
        cssHooks[method + "&get"] = function(node) {
            var hidden = [];
            showHidden(node, hidden);
            var val = cssHooks[method + ":get"](node)
            for (var i = 0, obj; obj = hidden[i++]; ) {
                node = obj.node
                for (var n in obj) {
                    if (typeof obj[n] === "string") {
                        node.style[n] = obj[n]
                    }
                }
            }
            return val;
        }
        avalon.fn[method] = function(value) { //会忽视其display
            var node = this[0]
            if (arguments.length === 0) {
                if (node.setTimeout) { //取得窗口尺寸,IE9后可以用node.innerWidth /innerHeight代替
                    return node["inner" + name] || node.document.documentElement[clientProp]
                }
                if (node.nodeType === 9) { //取得页面尺寸
                    var doc = node.documentElement
                    //FF chrome    html.scrollHeight< body.scrollHeight
                    //IE 标准模式 : html.scrollHeight> body.scrollHeight
                    //IE 怪异模式 : html.scrollHeight 最大等于可视窗口多一点？
                    return Math.max(node.body[scrollProp], doc[scrollProp], node.body[offsetProp], doc[offsetProp], doc[clientProp])
                }
                return cssHooks[method + "&get"](node)
            } else {
                return this.css(method, value)
            }
        }
        avalon.fn["inner" + name] = function() {
            return cssHooks[method + ":get"](this[0], void 0, "padding-box")
        }
        avalon.fn["outer" + name] = function(includeMargin) {
            return cssHooks[method + ":get"](this[0], void 0, includeMargin === true ? "margin-box" : "border-box")
        }
    })
    avalon.fn.offset = function() { //取得距离页面左右角的坐标
        var node = this[0], box = {
            left: 0,
            top: 0
        }
        if (!node || !node.tagName || !node.ownerDocument) {
            return box
        }
        var doc = node.ownerDocument,
                body = doc.body,
                root = doc.documentElement,
                win = doc.defaultView || doc.parentWindow
        if (!avalon.contains(root, node)) {
            return box
        }
        //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
        //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
        //http://msdn.microsoft.com/en-us/library/ms536433.aspx
        if (typeof node.getBoundingClientRect !== "undefined") {
            box = node.getBoundingClientRect() // BlackBerry 5, iOS 3 (original iPhone)
        }
        //chrome/IE6: body.scrollTop, firefox/other: root.scrollTop
        var clientTop = root.clientTop || body.clientTop,
                clientLeft = root.clientLeft || body.clientLeft,
                scrollTop = Math.max(win.pageYOffset || 0, root.scrollTop, body.scrollTop),
                scrollLeft = Math.max(win.pageXOffset || 0, root.scrollLeft, body.scrollLeft)
        // 把滚动距离加到left,top中去。
        // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
        // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
        return {
            top: box.top + scrollTop - clientTop,
            left: box.left + scrollLeft - clientLeft
        }
    }

    //==================================val相关============================

    function getValType(el) {
        var ret = el.tagName.toLowerCase()
        return ret === "input" && /checkbox|radio/.test(el.type) ? "checked" : ret
    }
    var roption = /^<option(?:\s+\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s+value[\s=]/i
    var valHooks = {
        "option:get": function(node) {
            //在IE11及W3C，如果没有指定value，那么node.value默认为node.text（存在trim作），但IE9-10则是取innerHTML(没trim操作)
            if (node.hasAttribute) {
                return node.hasAttribute("value") ? node.value : node.text.trim()
            }
            //specified并不可靠，因此通过分析outerHTML判定用户有没有显示定义value
            return roption.test(node.outerHTML) ? node.value : node.text
        },
        "select:get": function(node, value) {
            var option, options = node.options,
                    index = node.selectedIndex,
                    getter = valHooks["option:get"],
                    one = node.type === "select-one" || index < 0,
                    values = one ? null : [],
                    max = one ? index + 1 : options.length,
                    i = index < 0 ? max : one ? index : 0
            for (; i < max; i++) {
                option = options[i]
                //旧式IE在reset后不会改变selected，需要改用i === index判定
                //我们过滤所有disabled的option元素，但在safari5下，如果设置select为disable，那么其所有孩子都disable
                //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
                if ((option.selected || i === index) && !option.disabled) {
                    value = getter(option)
                    if (one) {
                        return value
                    }
                    //收集所有selected值组成数组返回
                    values.push(value)
                }
            }
            return values
        },
        "select:set": function(node, values, optionSet) {
            values = [].concat(values) //强制转换为数组
            var getter = valHooks["option:get"]
            for (var i = 0, el; el = node.options[i++]; ) {
                if ((el.selected = values.indexOf(getter(el)) >= 0)) {
                    optionSet = true
                }
            }
            if (!optionSet) {
                node.selectedIndex = -1
            }
        }
    }

    /************************************************************************
     *                                parseHTML                              *
     ************************************************************************/
    var rtagName = /<([\w:]+)/,
            //取得其tagName
            rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
            rcreate = W3C ? /[^\d\D]/ : /(<(?:script|link|style|meta|noscript))/ig,
            scriptTypes = oneObject("text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript", "text/vbscript"),
            //需要处理套嵌关系的标签
            rnest = /<(?:tb|td|tf|th|tr|col|opt|leg|cap|area)/
    //parseHTML的辅助变量
    var tagHooks = {
        area: [1, "<map>"],
        param: [1, "<object>"],
        col: [2, "<table><tbody></tbody><colgroup>", "</table>"],
        legend: [1, "<fieldset>"],
        option: [1, "<select multiple='multiple'>"],
        thead: [1, "<table>", "</table>"],
        tr: [2, "<table><tbody>"],
        td: [3, "<table><tbody><tr>"],
        //IE6-8在用innerHTML生成节点时，不能直接创建no-scope元素与HTML5的新标签
        _default: W3C ? [0, ""] : [1, "X<div>"] //div可以不用闭合
    }
    tagHooks.optgroup = tagHooks.option
    tagHooks.tbody = tagHooks.tfoot = tagHooks.colgroup = tagHooks.caption = tagHooks.thead
    tagHooks.th = tagHooks.td

    var script = DOC.createElement("script")
    avalon.parseHTML = function(html) {
        if (typeof html !== "string") {
            html = html + ""
        }
        html = html.replace(rxhtml, "<$1></$2>").trim()
        var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase(),
                //取得其标签名
                wrap = tagHooks[tag] || tagHooks._default,
                fragment = hyperspace.cloneNode(false),
                wrapper = cinerator,
                firstChild, neo
        if (!W3C) { //fix IE
            html = html.replace(rcreate, "<br class=msNoScope>$1") //在link style script等标签之前添加一个补丁
        }
        wrapper.innerHTML = wrap[1] + html + (wrap[2] || "")
        var els = wrapper.getElementsByTagName("script")
        if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
            for (var i = 0, el; el = els[i++]; ) {
                if (!el.type || scriptTypes[el.type]) { //如果script节点的MIME能让其执行脚本
                    neo = script.cloneNode(false) //FF不能省略参数
                    ap.forEach.call(el.attributes, function(attr) {
                        if (attr && attr.specified) {
                            neo[attr.name] = attr.value //复制其属性
                        }
                    })
                    neo.text = el.text //必须指定,因为无法在attributes中遍历出来
                    el.parentNode.replaceChild(neo, el) //替换节点
                }
            }
        }
        //移除我们为了符合套嵌关系而添加的标签
        for (i = wrap[0]; i--; wrapper = wrapper.lastChild) {
        }
        if (!W3C) { //fix IE
            for (els = wrapper["getElementsByTagName"]("br"), i = 0; el = els[i++]; ) {
                if (el.className && el.className === "msNoScope") {
                    el.parentNode.removeChild(el)
                }
            }
        }
        while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
            fragment.appendChild(firstChild)
        }
        return fragment
    }
    avalon.innerHTML = function(node, html) {
        if (!W3C && (!rcreate.test(html) && !rnest.test(html))) {
            try {
                node.innerHTML = html
                return
            } catch (e) {
            }
        }
        var a = this.parseHTML(html)
        this.clearHTML(node).appendChild(a)
    }
    avalon.clearHTML = function(node) {
        expelFromSanctuary(node)
        return node
    }
    /*********************************************************************
     *                           Observable                              *
     **********************************************************************/
    var Observable = {
        $watch: function(type, callback) {
            if (typeof callback === "function") {
                var callbacks = this.$events[type]
                if (callbacks) {
                    callbacks.push(callback)
                } else {
                    this.$events[type] = [callback]
                }
            } else { //重新开始监听此VM的第一重简单属性的变动
                this.$events = this.$watch.backup
            }
            return this
        },
        $unwatch: function(type, callback) {
            var n = arguments.length
            if (n === 0) { //让此VM的所有$watch回调无效化
                this.$watch.backup = this.$events
                this.$events = {}
            } else if (n === 1) {
                this.$events[type] = []
            } else {
                var callbacks = this.$events[type] || []
                var i = callbacks.length
                while (~--i < 0) {
                    if (callbacks[i] === callback) {
                        return callbacks.splice(i, 1)
                    }
                }
            }
            return this
        },
        $fire: function(type) {
            var bubbling = false, broadcast = false
            if (type.match(/^bubble!(\w+)$/)) {
                bubbling = type = RegExp.$1
            } else if (type.match(/^capture!(\w+)$/)) {
                broadcast = type = RegExp.$1
            }
            var events = this.$events
            var callbacks = events[type] || []
            var all = events.$all || []
            var args = aslice.call(arguments, 1)
            for (var i = 0, callback; callback = callbacks[i++]; ) {
                callback.apply(this, args)
            }
            for (var i = 0, callback; callback = all[i++]; ) {
                callback.apply(this, arguments)
            }
            var element = events.element
            if (element) {
                var detail = [type].concat(args)
                if (bubbling) {
                    if (W3C) {
                        W3CFire(element, "dataavailable", detail)
                    } else {
                        var event = document.createEventObject()
                        event.detail = detail
                        element.fireEvent("ondataavailable", event)
                    }
                } else if (broadcast) {
                    var alls = []
                    for (var i in avalon.vmodels) {
                        var v = avalon.vmodels[i]
                        if (v && v.$events && v.$events.element) {
                            var node = v.$events.element;
                            if (avalon.contains(element, node) && element != node) {
                                alls.push(v)
                            }
                        }
                    }
                    alls.forEach(function(v) {
                        v.$fire.apply(v, detail)
                    })
                }
            }
        }
    }
    /*********************************************************************
     *                           依赖收集与触发                                *
     **********************************************************************/

    function registerSubscriber(data, val) {
        Registry[expose] = data //暴光此函数,方便collectSubscribers收集
        avalon.openComputedCollect = true
        var fn = data.evaluator
        if (fn) { //如果是求值函数
            if (data.type === "duplex") {
                data.handler()
            } else {
                try {
                    data.handler(fn.apply(0, data.args), data.element, data)
                } catch (e) {
                    delete data.evaluator
                    if (data.nodeType === 3) {
                        if (kernel.commentInterpolate) {
                            data.element.replaceChild(DOC.createComment(data.value), data.node)
                        } else {
                            data.node.data = openTag + data.value + closeTag
                        }
                    }
                    log("warning:evaluator of [" + data.value + "] throws error!")
                }
            }
        } else { //如果是计算属性的accessor
            data()
        }
        avalon.openComputedCollect = false
        delete Registry[expose]
    }

    function collectSubscribers(accessor) { //收集依赖于这个访问器的订阅者
        if (Registry[expose]) {
            var list = accessor[subscribers]
            list && avalon.Array.ensure(list, Registry[expose]) //只有数组不存在此元素才push进去
        }
    }

    function notifySubscribers(accessor) { //通知依赖于这个访问器的订阅者更新自身
        var list = accessor[subscribers]
        if (list && list.length) {
            var args = aslice.call(arguments, 1)
            for (var i = list.length, fn; fn = list[--i]; ) {
                var el = fn.element,
                        remove
                if (el && !avalon.contains(ifSanctuary, el)) {
                    if (typeof el.sourceIndex == "number") { //IE6-IE11
                        remove = el.sourceIndex === 0
                    } else {
                        remove = !avalon.contains(root, el)
                    }
                }
                if (remove) { //如果它没有在DOM树
                    list.splice(i, 1)
                    log("debug: remove " + fn.name)
                } else if (typeof fn === "function") {
                    fn.apply(0, args) //强制重新计算自身
                } else if (fn.getter) {
                    fn.handler.apply(fn, args) //处理监控数组的方法
                } else {
                    fn.handler(fn.evaluator.apply(0, fn.args || []), el, fn)
                }
            }
        }
    }

    /*********************************************************************
     *                           扫描系统                                 *
     **********************************************************************/
    avalon.scan = function(elem, vmodel) {
        elem = elem || root
        var vmodels = vmodel ? [].concat(vmodel) : []
        scanTag(elem, vmodels)
    }

    //http://www.w3.org/TR/html5/syntax.html#void-elements
    var stopScan = oneObject("area,base,basefont,br,col,command,embed,hr,img,input,link,meta,param,source,track,wbr,noscript,script,style,textarea".toUpperCase())

    //确保元素的内容被完全扫描渲染完毕才调用回调
    var interval = W3C ? 15 : 50

    function checkScan(elem, callback) {
        var innerHTML = NaN,
                id = setInterval(function() {
                    var currHTML = elem.innerHTML
                    if (currHTML === innerHTML) {
                        clearInterval(id)
                        callback()
                    } else {
                        innerHTML = currHTML
                    }
                }, interval)
    }


    function scanTag(elem, vmodels, node) {
        //扫描顺序  ms-skip(0) --> ms-important(1) --> ms-controller(2) --> ms-if(10) --> ms-repeat(100) 
        //--> ms-if-loop(110) --> ms-attr(970) ...--> ms-each(1400)-->ms-with(1500)--〉ms-duplex(2000)垫后
        var a = elem.getAttribute(prefix + "skip")
        //#360 在旧式IE中 Object标签在引入Flash等资源时,可能出现没有getAttributeNode,innerHTML的情形
        if (!elem.getAttributeNode) {
            return log("warning " + elem.tagName + " no getAttributeNode method")
        }
        var b = elem.getAttributeNode(prefix + "important")
        var c = elem.getAttributeNode(prefix + "controller")
        if (typeof a === "string") {
            return
        } else if (node = b || c) {
            var newVmodel = VMODELS[node.value]
            if (!newVmodel) {
                return
            }
            //ms-important不包含父VM，ms-controller相反
            vmodels = node === b ? [newVmodel] : [newVmodel].concat(vmodels)
            elem.removeAttribute(node.name) //removeAttributeNode不会刷新[ms-controller]样式规则
            newVmodel.$events.element = elem
            avalon.bind(elem, "dataavailable", function(e) {
                if (typeof e.detail === "object" && elem !== e.target) {
                    newVmodel.$fire.apply(newVmodel, e.detail)
                }
            })
            avalon(elem).removeClass(node.name)
        }
        scanAttr(elem, vmodels) //扫描特性节点
    }

    function scanNodes(parent, vmodels) {
        var node = parent.firstChild
        while (node) {
            var nextNode = node.nextSibling
            var nodeType = node.nodeType
            if (nodeType === 1) {
                scanTag(node, vmodels) //扫描元素节点
            } else if (nodeType === 3 && rexpr.test(node.data)) {
                scanText(node, vmodels) //扫描文本节点
            } else if (kernel.commentInterpolate && nodeType === 8 && !rexpr.test(node.nodeValue)) {
                scanText(node, vmodels) //扫描注释节点
            }
            node = nextNode
        }
    }

    function scanText(textNode, vmodels) {
        var bindings = []
        if (textNode.nodeType === 8) {
            var leach = []
            var value = trimFilter(textNode.nodeValue, leach)
            var token = {
                expr: true,
                value: value
            }
            if (leach.length) {
                token.filters = leach
            }
            var tokens = [token]
        } else {
            tokens = scanExpr(textNode.data)
        }
        if (tokens.length) {
            for (var i = 0, token; token = tokens[i++]; ) {
                var node = DOC.createTextNode(token.value) //将文本转换为文本节点，并替换原来的文本节点
                if (token.expr) {
                    var filters = token.filters
                    var binding = {
                        type: "text",
                        node: node,
                        nodeType: 3,
                        value: token.value,
                        filters: filters
                    }
                    if (filters && filters.indexOf("html") !== -1) {
                        avalon.Array.remove(filters, "html")
                        binding.type = "html"
                        binding.replaceNodes = [node]
                        if (!filters.length) {
                            delete bindings.filters
                        }
                    }
                    bindings.push(binding) //收集带有插值表达式的文本
                }
                hyperspace.appendChild(node)
            }
            textNode.parentNode.replaceChild(hyperspace, textNode)
            if (bindings.length)
                executeBindings(bindings, vmodels)
        }
    }

    var rmsAttr = /ms-(\w+)-?(.*)/
    var priorityMap = {
        "if": 10,
        "repeat": 90,
        "widget": 110,
        "each": 1400,
        "with": 1500,
        "duplex": 2000,
        "on": 3000
    }
    var ons = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scroll,submit")

    function scanAttr(elem, vmodels) {
        var attributes = getAttributes ? getAttributes(elem) : elem.attributes
        var bindings = [],
                msData = {},
                match
        for (var i = 0, attr; attr = attributes[i++]; ) {
            if (attr.specified) {
                if (match = attr.name.match(rmsAttr)) {
                    //如果是以指定前缀命名的
                    var type = match[1]
                    var param = match[2] || ""
                    msData[attr.name] = attr.value
                    if (ons[type]) {
                        param = type
                        type = "on"
                    }
                    if (typeof bindingHandlers[type] === "function") {
                        var binding = {
                            type: type,
                            param: param,
                            element: elem,
                            name: match[0],
                            value: attr.value,
                            priority: type in priorityMap ? priorityMap[type] : type.charCodeAt(0) * 10 + (Number(param) || 0)
                        }
                        if (type === "if" && param.indexOf("loop") > -1) {
                            binding.priority += 100
                        }
                        if (vmodels.length) {
                            bindings.push(binding)
                            if (type === "widget") {
                                elem.msData = elem.msData || msData
                            }
                        }
                    }
                }
            }
        }
        bindings.sort(function(a, b) {
            return a.priority - b.priority
        })
        if (msData["ms-checked"] && msData["ms-duplex"]) {
            log("warning!一个元素上不能同时定义ms-checked与ms-duplex")
        }
        var firstBinding = bindings[0] || {}
        switch (firstBinding.type) {
            case "if":
            case "repeat":
            case "widget":
                executeBindings([firstBinding], vmodels)
                break
            default:
                executeBindings(bindings, vmodels)
                if (!stopScan[elem.tagName] && rbind.test(elem.innerHTML.replace(rlt, "<").replace(rgt, ">"))) {
                    scanNodes(elem, vmodels) //扫描子孙元素
                }
                break;
        }

        if (elem.patchRepeat) {
            elem.patchRepeat()
            elem.patchRepeat = null
        }

    }
    //IE67下，在循环绑定中，一个节点如果是通过cloneNode得到，自定义属性的specified为false，无法进入里面的分支，
    //但如果我们去掉scanAttr中的attr.specified检测，一个元素会有80+个特性节点（因为它不区分固有属性与自定义属性），很容易卡死页面
    if (!"1" [0]) {
        var cacheAttrs = createCache(512)
        var rattrs = /\s+(ms-[^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g,
                rquote = /^['"]/,
                rtag = /<\w+\b(?:(["'])[^"]*?(\1)|[^>])*>/i,
                ramp = /&amp;/g
        //IE6-8解析HTML5新标签，会将它分解两个元素节点与一个文本节点
        //<body><section>ddd</section></body>
        //        window.onload = function() {
        //            var body = document.body
        //            for (var i = 0, el; el = body.children[i++]; ) {
        //                console.log(el.outerHTML)
        //            }
        //        }
        //依次输出<SECTION>, </SECTION>
        var getAttributes = function(elem) {
            var html = elem.outerHTML
            //处理IE6-8解析HTML5新标签的情况，及<br>等半闭合标签outerHTML为空的情况
            if (html.slice(0, 2) === "</" || !html.trim()) {
                return []
            }
            var str = html.match(rtag)[0]
            var attributes = [],
                    match,
                    k, v;
            if (cacheAttrs[str]) {
                return cacheAttrs[str]
            }
            while (k = rattrs.exec(str)) {
                v = k[2]
                if (v) {
                    v = (rquote.test(v) ? v.slice(1, -1) : v).replace(ramp, "&")
                }
                var name = k[1].toLowerCase()
                match = name.match(rmsAttr)
                var binding = {
                    name: name,
                    specified: true,
                    value: v || ""
                }
                attributes.push(binding)
            }
            return cacheAttrs(str, attributes)
        }
    }

    function executeBindings(bindings, vmodels) {
        for (var i = 0, data; data = bindings[i++]; ) {
            data.vmodels = vmodels
            bindingHandlers[data.type](data, vmodels)
            if (data.evaluator && data.name) { //移除数据绑定，防止被二次解析
                //chrome使用removeAttributeNode移除不存在的特性节点时会报错 https://github.com/RubyLouvre/avalon/issues/99
                data.element.removeAttribute(data.name)
            }
        }
        bindings.length = 0
    }


    var rfilters = /\|\s*(\w+)\s*(\([^)]*\))?/g,
            r11a = /\|\|/g,
            r11b = /U2hvcnRDaXJjdWl0/g,
            rlt = /&lt;/g,
            rgt = /&gt;/g
    function trimFilter(value, leach) {
        if (value.indexOf("|") > 0) { // 抽取过滤器 先替换掉所有短路与
            value = value.replace(r11a, "U2hvcnRDaXJjdWl0") //btoa("ShortCircuit")
            value = value.replace(rfilters, function(c, d, e) {
                leach.push(d + (e || ""))
                return ""
            })
            value = value.replace(r11b, "||") //还原短路与
        }
        return value
    }

    function scanExpr(str) {
        var tokens = [],
                value, start = 0,
                stop
        do {
            stop = str.indexOf(openTag, start)
            if (stop === -1) {
                break
            }
            value = str.slice(start, stop)
            if (value) { // {{ 左边的文本
                tokens.push({
                    value: value,
                    expr: false
                })
            }
            start = stop + openTag.length
            stop = str.indexOf(closeTag, start)
            if (stop === -1) {
                break
            }
            value = str.slice(start, stop)
            if (value) { //处理{{ }}插值表达式
                var leach = []
                value = trimFilter(value, leach)
                tokens.push({
                    value: value,
                    expr: true,
                    filters: leach.length ? leach : void 0
                })
            }
            start = stop + closeTag.length
        } while (1)
        value = str.slice(start)
        if (value) { //}} 右边的文本
            tokens.push({
                value: value,
                expr: false
            })
        }

        return tokens
    }
    /*********************************************************************
     *                          编译模块                                  *
     **********************************************************************/

    var keywords =
            // 关键字
            "break,case,catch,continue,debugger,default,delete,do,else,false" + ",finally,for,function,if,in,instanceof,new,null,return,switch,this" + ",throw,true,try,typeof,var,void,while,with"
            // 保留字
            + ",abstract,boolean,byte,char,class,const,double,enum,export,extends" + ",final,float,goto,implements,import,int,interface,long,native" + ",package,private,protected,public,short,static,super,synchronized" + ",throws,transient,volatile"

            // ECMA 5 - use strict
            + ",arguments,let,yield"

            + ",undefined"
    var rrexpstr = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g
    var rsplit = /[^\w$]+/g
    var rkeywords = new RegExp(["\\b" + keywords.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g')
    var rnumber = /\b\d[^,]*/g
    var rcomma = /^,+|,+$/g
    var cacheVars = createCache(512)
    var getVariables = function(code) {
        code = "," + code.trim()
        if (cacheVars[code]) {
            return cacheVars[code]
        }
        var match = code
                .replace(rrexpstr, "")
                .replace(rsplit, ",")
                .replace(rkeywords, "")
                .replace(rnumber, "")
                .replace(rcomma, "")
                .split(/^$|,+/)
        var vars = [],
                unique = {}
        for (var i = 0; i < match.length; ++i) {
            var variable = match[i]
            if (!unique[variable]) {
                unique[variable] = vars.push(variable)
            }
        }
        return cacheVars(code, vars)
    }

    //添加赋值语句

    function addAssign(vars, scope, name, duplex) {
        var ret = [],
                prefix = " = " + name + "."
        for (var i = vars.length, prop; prop = vars[--i]; ) {
            if (scope.hasOwnProperty && scope.hasOwnProperty(prop)) { //IE6下节点没有hasOwnProperty
                ret.push(prop + prefix + prop)
                if (duplex === "duplex") {
                    vars.get = name + "." + prop
                }
                vars.splice(i, 1)
            }
        }
        return ret
    }

    function uniqVmodels(arr) {
        var uniq = {}
        return arr.filter(function(el) {
            if (!uniq[el.$id]) {
                uniq[el.$id] = 1
                return true
            }
        })
    }
    //缓存求值函数，以便多次利用

    function createCache(maxLength) {
        var keys = []

        function cache(key, value) {
            if (keys.push(key) > maxLength) {
                delete cache[keys.shift()]
            }
            return cache[key] = value;
        }
        return cache;
    }
    var cacheExprs = createCache(256)
    //取得求值函数及其传参
    var rduplex = /\w\[.*\]|\w\.\w/
    var rproxy = /(\$proxy\$[a-z]+)\d+$/

    function parseExpr(code, scopes, data, four) {
        var dataType = data.type
        var filters = dataType == "html" || dataType === "text" ? data.filters : ""
        var exprId = scopes.map(function(el) {
            return el.$id.replace(rproxy, "$1")
        }) + code + dataType + filters
        var vars = getVariables(code).concat(),
                assigns = [],
                names = [],
                args = [],
                prefix = ""
        //args 是一个对象数组， names 是将要生成的求值函数的参数
        scopes = uniqVmodels(scopes)
        for (var i = 0, sn = scopes.length; i < sn; i++) {
            if (vars.length) {
                var name = "vm" + expose + "_" + i
                names.push(name)
                args.push(scopes[i])
                assigns.push.apply(assigns, addAssign(vars, scopes[i], name, four))
            }
        }
        if (!assigns.length && four === "duplex") {
            return
        }
        //---------------args----------------
        if (filters) {
            args.push(avalon.filters)
        }
        data.args = args
        //---------------cache----------------
        var fn = cacheExprs[exprId] //直接从缓存，免得重复生成
        if (fn) {
            data.evaluator = fn
            return
        }
        var prefix = assigns.join(", ")
        if (prefix) {
            prefix = "var " + prefix
        }
        if (filters) { //文本绑定，双工绑定才有过滤器
            code = "\nvar ret" + expose + " = " + code
            var textBuffer = [],
                    fargs
            textBuffer.push(code, "\r\n")
            for (var i = 0, fname; fname = data.filters[i++]; ) {
                var start = fname.indexOf("(")
                if (start !== -1) {
                    fargs = fname.slice(start + 1, fname.lastIndexOf(")")).trim()
                    fargs = "," + fargs
                    fname = fname.slice(0, start).trim()
                } else {
                    fargs = ""
                }
                textBuffer.push(" if(filters", expose, ".", fname, "){\n\ttry{\nret", expose,
                        " = filters", expose, ".", fname, "(ret", expose, fargs, ")\n\t}catch(e){} \n}\n")
            }
            code = textBuffer.join("")
            code += "\nreturn ret" + expose
            names.push("filters" + expose)
        } else if (dataType === "duplex") { //双工绑定
            var _body = "'use strict';\nreturn function(vvv){\n\t" +
                    prefix +
                    ";\n\tif(!arguments.length){\n\t\treturn " +
                    code +
                    "\n\t}\n\t" + (!rduplex.test(code) ? vars.get : code) +
                    "= vvv;\n} "
            try {
                fn = Function.apply(noop, names.concat(_body))
                data.evaluator = cacheExprs(exprId, fn)
            } catch (e) {
                log("debug: parse error," + e.message)
            }
            return
        } else if (dataType === "on") { //事件绑定
            code = code.replace("(", ".call(this,")
            if (four === "$event") {
                names.push(four)
            }
            code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
            var lastIndex = code.lastIndexOf("\nreturn")
            var header = code.slice(0, lastIndex)
            var footer = code.slice(lastIndex)
            code = header + "\nif(avalon.openComputedCollect) return ;" + footer
        } else { //其他绑定
            code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
        }
        try {
            fn = Function.apply(noop, names.concat("'use strict';\n" + prefix + code))
            data.evaluator = cacheExprs(exprId, fn)
        } catch (e) {
            log("debug: parse error," + e.message)
        } finally {
            vars = textBuffer = names = null //释放内存
        }
    }

    //parseExpr的智能引用代理

    function parseExprProxy(code, scopes, data, tokens) {
        if (Array.isArray(tokens)) {
            var array = tokens.map(function(token) {
                var tmpl = {}
                return token.expr ? parseExpr(token.value, scopes, tmpl) || tmpl : token.value
            })
            data.evaluator = function() {
                var ret = ""
                for (var i = 0, el; el = array[i++]; ) {
                    ret += typeof el === "string" ? el : el.evaluator.apply(0, el.args)
                }
                return ret
            }
            data.args = []
        } else {
            parseExpr(code, scopes, data, tokens)
        }
        if (data.evaluator) {
            data.handler = bindingExecutors[data.handlerName || data.type]
            data.evaluator.toString = function() {
                return data.type + " binding to eval(" + code + ")"
            }
            //方便调试
            //这里非常重要,我们通过判定视图刷新函数的element是否在DOM树决定
            //将它移出订阅者列表
            registerSubscriber(data)
        }
    }
    avalon.parseExprProxy = parseExprProxy
    /*********************************************************************
     *绑定模块（实现“操作数据即操作DOM”的关键，将DOM操作放逐出前端开发人员的视野，让它交由框架自行处理，开发人员专致于业务本身） *                                 *
     **********************************************************************/
    var cacheDisplay = oneObject("a,abbr,b,span,strong,em,font,i,kbd", "inline")
    avalon.mix(cacheDisplay, oneObject("div,h1,h2,h3,h4,h5,h6,section,p", "block"))

    function parseDisplay(nodeName, val) {
        //用于取得此类标签的默认display值
        nodeName = nodeName.toLowerCase()
        if (!cacheDisplay[nodeName]) {
            var node = DOC.createElement(nodeName)
            root.appendChild(node)
            if (W3C) {
                val = getComputedStyle(node, null).display
            } else {
                val = node.currentStyle.display
            }
            root.removeChild(node)
            cacheDisplay[nodeName] = val
        }
        return cacheDisplay[nodeName]
    }
    avalon.parseDisplay = parseDisplay
    var supportDisplay = (function(td) {
        return W3C ? getComputedStyle(td, null).display === "table-cell" : true
    })(DOC.createElement("td"))

    var propMap = {//属性名映射
        "accept-charset": "acceptCharset",
        "char": "ch",
        "charoff": "chOff",
        "class": "className",
        "for": "htmlFor",
        "http-equiv": "httpEquiv"
    }
    var anomaly = "accessKey,allowTransparency,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan,contentEditable,"
            + "dateTime,defaultChecked,defaultSelected,defaultValue,frameBorder,isMap,longDesc,maxLength,marginWidth,marginHeight,"
            + "noHref,noResize,noShade,readOnly,rowSpan,tabIndex,useMap,vSpace,valueType,vAlign"
    anomaly.replace(rword, function(name) {
        propMap[name.toLowerCase()] = name
    })
    var rdash = /\(([^)]*)\)/
    var cssText = "<style id='avalonStyle'>.avalonHide{ display: none!important }</style>"
    head.insertBefore(avalon.parseHTML(cssText), head.firstChild) //避免IE6 base标签BUG
    var rnoscripts = /<noscript.*?>(?:[\s\S]+?)<\/noscript>/img
    var rnoscriptText = /<noscript.*?>([\s\S]+?)<\/noscript>/im

    var getXHR = function() {
        return new (window.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP")
    }
    var getBindingCallback = function(elem, name, vmodels) {
        var callback = elem.getAttribute(name)
        if (callback) {
            for (var i = 0, vm; vm = vmodels[i++]; ) {
                if (vm.hasOwnProperty(callback) && typeof vm[callback] === "function") {
                    return vm[callback]
                }
            }
        }
    }
    var cacheTmpls = avalon.templateCache = {}
    var ifSanctuary = DOC.createElement("div")
    ifSanctuary.innerHTML = "a"
    try {
        ifSanctuary.contains(ifSanctuary.firstChild)
        avalon.contains = function(a, b) {
            return a.contains(b)
        }
    } catch (e) {
        avalon.contains = fixContains
    }
    //这里的函数每当VM发生改变后，都会被执行（操作方为notifySubscribers）
    var bindingExecutors = avalon.bindingExecutors = {
        "attr": function(val, elem, data) {
            var method = data.type,
                    attrName = data.param
            if (method === "css") {
                avalon(elem).css(attrName, val)
            } else if (method === "attr") {
                // ms-attr-class="xxx" vm.xxx="aaa bbb ccc"将元素的className设置为aaa bbb ccc
                // ms-attr-class="xxx" vm.xxx=false  清空元素的所有类名
                // ms-attr-name="yyy"  vm.yyy="ooo" 为元素设置name属性
                var toRemove = (val === false) || (val === null) || (val === void 0)
                if (toRemove) {
                    elem.removeAttribute(attrName)
                } else if (!W3C) {
                    attrName = propMap[attrName] || attrName
                    if (toRemove) {
                        elem.removeAttribute(attrName)
                    } else {
                        elem[attrName] = val
                    }
                } else if (!toRemove) {
                    elem.setAttribute(attrName, val)
                }
            } else if (method === "include" && val) {
                var vmodels = data.vmodels
                var rendered = getBindingCallback(elem, "data-include-rendered", vmodels)
                var loaded = getBindingCallback(elem, "data-include-loaded", vmodels)

                function scanTemplate(text) {
                    if (loaded) {
                        text = loaded.apply(elem, [text].concat(vmodels))
                    }
                    avalon.innerHTML(elem, text)
                    scanNodes(elem, vmodels)
                    rendered && checkScan(elem, function() {
                        rendered.call(elem)
                    })
                }
                if (data.param === "src") {
                    if (cacheTmpls[val]) {
                        scanTemplate(cacheTmpls[val])
                    } else {
                        var xhr = getXHR()
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                var s = xhr.status
                                if (s >= 200 && s < 300 || s === 304 || s === 1223) {
                                    scanTemplate(cacheTmpls[val] = xhr.responseText)
                                }
                            }
                        }
                        xhr.open("GET", val, true)
                        if ("withCredentials" in xhr) {
                            xhr.withCredentials = true
                        }
                        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                        xhr.send(null)
                    }
                } else {
                    //IE系列与够新的标准浏览器支持通过ID取得元素（firefox14+）
                    //http://tjvantoll.com/2012/07/19/dom-element-references-as-global-variables/
                    var el = val && val.nodeType == 1 ? val : DOC.getElementById(val)
                    if (el) {
                        if (el.tagName === "NOSCRIPT" && !(el.innerHTML || el.fixIE78)) { //IE7-8 innerText,innerHTML都无法取得其内容，IE6能取得其innerHTML
                            var xhr = getXHR() //IE9-11与chrome的innerHTML会得到转义的内容，它们的innerText可以
                            xhr.open("GET", location, false) //谢谢Nodejs 乱炖群 深圳-纯属虚构
                            xhr.send(null)
                            //http://bbs.csdn.net/topics/390349046?page=1#post-393492653
                            var noscripts = DOC.getElementsByTagName("noscript")
                            var array = (xhr.responseText || "").match(rnoscripts) || []
                            var n = array.length
                            for (var i = 0; i < n; i++) {
                                var tag = noscripts[i]
                                if (tag) { //IE6-8中noscript标签的innerHTML,innerText是只读的
                                    tag.style.display = "none" //http://haslayout.net/css/noscript-Ghost-Bug
                                    tag.fixIE78 = (array[i].match(rnoscriptText) || ["", "&nbsp;"])[1]
                                }
                            }
                        }
                        avalon.nextTick(function() {
                            scanTemplate(el.fixIE78 || el.innerText || el.innerHTML)
                        })
                    }
                }
            } else {
                if (!root.hasAttribute && typeof val === "string" && (method === "src" || method === "href")) {
                    val = val.replace(/&amp;/g, "&") //处理IE67自动转义的问题
                }
                elem[method] = val
            }
        },
        "class": function(val, elem, data) {
            var $elem = avalon(elem),
                    method = data.type
            if (method === "class" && data.param) { //如果是旧风格
                $elem.toggleClass(data.param, !!val)
            } else {
                var toggle = data._evaluator ? !!data._evaluator.apply(elem, data._args) : true
                var className = data._class || val
                switch (method) {
                    case "class":
                        if (toggle && data.oldClass) {
                            $elem.removeClass(data.oldClass)
                        }
                        $elem.toggleClass(className, toggle)
                        data.oldClass = className
                        break;
                    case "hover":
                    case "active":
                        if (!data.init) { //确保只绑定一次
                            if (method === "hover") { //在移出移入时切换类名
                                var event1 = "mouseenter",
                                        event2 = "mouseleave"
                            } else { //在聚焦失焦中切换类名
                                elem.tabIndex = elem.tabIndex || -1
                                event1 = "mousedown", event2 = "mouseup"
                                $elem.bind("mouseleave", function() {
                                    toggle && $elem.removeClass(className)
                                })
                            }
                            $elem.bind(event1, function() {
                                toggle && $elem.addClass(className)
                            })
                            $elem.bind(event2, function() {
                                toggle && $elem.removeClass(className)
                            })
                            data.init = 1
                        }
                        break;
                }
            }
        },
        "data": function(val, elem, data) {
            var key = "data-" + data.param
            if (val && typeof val === "object") {
                elem[key] = val
            } else {
                elem.setAttribute(key, String(val))
            }
        },
        "checked": function(val, elem, data) {
            var name = data.type;
            if (name === "enabled") {
                elem.disabled = !val
            } else {
                var propName = name === "readonly" ? "readOnly" : name
                elem[propName] = !!val
            }
        },
        "repeat": function(method, pos, el) {
            if (method) {
                var data = this
                var group = data.group
                var pp = data.startRepeat && data.startRepeat.parentNode
                if (pp) { //fix  #300 #307
                    data.parent = pp
                }
                var parent = data.parent
                var proxies = data.proxies
                var transation = hyperspace.cloneNode(false)
                if (method === "del" || method === "move") {
                    var locatedNode = getLocatedNode(parent, data, pos)
                }
                switch (method) {
                    case "add": //在pos位置后添加el数组（pos为数字，el为数组）
                        var arr = el
                        var last = data.getter().length - 1
                        var spans = []
                        var lastFn = {}
                        for (var i = 0, n = arr.length; i < n; i++) {
                            var ii = i + pos
                            var proxy = getEachProxy(ii, arr[i], data, last)
                            proxies.splice(ii, 0, proxy)
                            lastFn = shimController(data, transation, spans, proxy)
                        }
                        locatedNode = getLocatedNode(parent, data, pos)
                        lastFn.node = locatedNode
                        lastFn.parent = parent
                        parent.insertBefore(transation, locatedNode)
                        for (var i = 0, node; node = spans[i++]; ) {
                            scanTag(node, data.vmodels)
                        }
                        spans = null
                        break
                    case "del": //将pos后的el个元素删掉(pos, el都是数字)
                        var removed = proxies.splice(pos, el)
                        for (var i = 0, proxy; proxy = removed[i++]; ) {
                            recycleEachProxy(proxy)
                        }
                        expelFromSanctuary(removeView(locatedNode, group, el))
                        break
                    case "index": //将proxies中的第pos个起的所有元素重新索引（pos为数字，el用作循环变量）
                        var last = proxies.length - 1
                        for (; el = proxies[pos]; pos++) {
                            el.$index = pos
                            el.$first = pos === 0
                            el.$last = pos === last
                        }
                        break
                    case "clear":
                        if (data.startRepeat) {
                            while (true) {
                                var node = data.startRepeat.nextSibling
                                if (node && node !== data.endRepeat) {
                                    transation.appendChild(node)
                                } else {
                                    break
                                }
                            }
                        } else {
                            transation = parent
                        }
                        expelFromSanctuary(transation)
                        proxies.length = 0
                        break
                    case "move": //将proxies中的第pos个元素移动el位置上(pos, el都是数字)
                        var t = proxies.splice(pos, 1)[0]
                        if (t) {
                            proxies.splice(el, 0, t)
                            transation = removeView(locatedNode, group)
                            locatedNode = getLocatedNode(parent, data, el)
                            parent.insertBefore(transation, locatedNode)
                        }
                        break
                    case "set": //将proxies中的第pos个元素的VM设置为el（pos为数字，el任意）
                        var proxy = proxies[pos]
                        if (proxy) {
                            proxy[proxy.$itemName] = el
                        }
                        break
                    case "append": //将pos的键值对从el中取出（pos为一个普通对象，el为预先生成好的代理VM对象池）
                        var pool = el
                        var callback = getBindingCallback(data.callbackElement, "data-with-sorted", data.vmodels)
                        var keys = []
                        var spans = []
                        var lastFn = {}
                        for (var key in pos) { //得到所有键名
                            if (pos.hasOwnProperty(key) && key !== "hasOwnProperty") {
                                keys.push(key)
                            }
                        }
                        if (callback) { //如果有回调，则让它们排序
                            var keys2 = callback.call(parent, keys)
                            if (keys2 && Array.isArray(keys2) && keys2.length) {
                                keys = keys2
                            }
                        }
                        for (var i = 0, key; key = keys[i++]; ) {
                            if (key !== "hasOwnProperty") {
                                lastFn = shimController(data, transation, spans, pool[key])
                            }
                        }
                        lastFn.parent = parent
                        lastFn.node = data.endRepeat || null
                        parent.insertBefore(transation, lastFn.node)
                        for (var i = 0, el; el = spans[i++]; ) {
                            scanTag(el, data.vmodels)
                        }
                        spans = null
                        break
                }
                iteratorCallback.call(data, arguments)
            }
        },
        "html": function(val, elem, data) {
            val = val == null ? "" : val
            if (!elem) {
                elem = data.element = data.node.parentNode
            }
            if (data.replaceNodes) {
                var fragment, nodes
                if (val.nodeType === 11) {
                    fragment = val
                } else if (val.nodeType === 1 || val.item) {
                    nodes = val.nodeType === 1 ? val.childNodes : val.item ? val : []
                    fragment = hyperspace.cloneNode(true)
                    while (nodes[0]) {
                        fragment.appendChild(nodes[0])
                    }
                } else {
                    fragment = avalon.parseHTML(val)
                }
                var replaceNodes = avalon.slice(fragment.childNodes)
                elem.insertBefore(fragment, data.replaceNodes[0] || null) //fix IE6-8 insertBefore的第2个参数只能为节点或null
                for (var i = 0, node; node = data.replaceNodes[i++]; ) {
                    elem.removeChild(node)
                }
                data.replaceNodes = replaceNodes
            } else {
                avalon.innerHTML(elem, val)
            }
            avalon.nextTick(function() {
                scanNodes(elem, data.vmodels)
            })
        },
        "if": function(val, elem, data) {
            var placehoder = data.placehoder
            if (val) { //插回DOM树
                if (!data.msInDocument) {
                    data.msInDocument = true
                    try {
                        placehoder.parentNode.replaceChild(elem, placehoder)
                    } catch (e) {
                        log("debug: ms-if  " + e.message)
                    }
                }
                if (rbind.test(elem.outerHTML.replace(rlt, "<").replace(rgt, ">"))) {
                    scanAttr(elem, data.vmodels)
                }
            } else { //移出DOM树，放进ifSanctuary DIV中，并用注释节点占据原位置
                if (data.msInDocument) {
                    data.msInDocument = false
                    elem.parentNode.replaceChild(placehoder, elem)
                    placehoder.elem = elem
                    ifSanctuary.appendChild(elem)
                }
            }
        },
        "on": function(callback, elem, data) {
            var fn = data.evaluator
            var args = data.args
            var vmodels = data.vmodels
            if (!data.hasArgs) {
                callback = function(e) {
                    return fn.apply(0, args).call(this, e)
                }
            } else {
                callback = function(e) {
                    return fn.apply(this, args.concat(e))
                }
            }
            elem.$vmodel = vmodels[0]
            elem.$vmodels = vmodels
            data.param = data.param.replace(/-\d+$/, "") // ms-on-mousemove-10
            if (typeof data.specialBind === "function") {
                data.specialBind(elem, callback)
            } else {
                var removeFn = avalon.bind(elem, data.param, callback)
            }
            data.rollback = function() {
                if (typeof data.specialUnbind === "function") {
                    data.specialUnbind()
                } else {
                    avalon.unbind(elem, data.param, removeFn)
                }
            }
            data.evaluator = data.handler = noop
        },
        "text": function(val, elem, data) {
            val = val == null ? "" : val //不在页面上显示undefined null
            var node = data.node
            if (data.nodeType === 3) { //绑定在文本节点上
                try {//IE对游离于DOM树外的节点赋值会报错
                    node.data = val
                } catch (e) {
                }
            } else { //绑定在特性节点上
                if (!elem) {
                    elem = data.element = node.parentNode
                }
                if ("textContent" in elem) {
                    elem.textContent = val
                } else {
                    elem.innerText = val
                }
            }
        },
        "visible": function(val, elem, data) {
            elem.style.display = val ? data.display : "none"
        },
        "widget": noop
    }
    var rwhitespace = /^\s+$/
    //这里的函数只会在第一次被扫描后被执行一次，并放进行对应VM属性的subscribers数组内（操作方为registerSubscriber）
    var bindingHandlers = avalon.bindingHandlers = {
        //这是一个字符串属性绑定的范本, 方便你在title, alt,  src, href, include, css添加插值表达式
        //<a ms-href="{{url.hostname}}/{{url.pathname}}.html">
        "attr": function(data, vmodels) {
            var text = data.value.trim(),
                    simple = true
            if (text.indexOf(openTag) > -1 && text.indexOf(closeTag) > 2) {
                simple = false
                if (rexpr.test(text) && RegExp.rightContext === "" && RegExp.leftContext === "") {
                    simple = true
                    text = RegExp.$1
                }
            }
            data.handlerName = "attr" //handleName用于处理多种绑定共用同一种bindingExecutor的情况
            parseExprProxy(text, vmodels, data, (simple ? null : scanExpr(data.value)))
        },
        "checked": function(data, vmodels) {
            data.handlerName = "checked"
            parseExprProxy(data.value, vmodels, data)
        },
        //根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag" 
        //http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
        "class": function(data, vmodels) {
            var oldStyle = data.param,
                    text = data.value,
                    rightExpr
            data.handlerName = "class"
            if (!oldStyle || isFinite(oldStyle)) {
                data.param = "" //去掉数字
                var noExpr = text.replace(rexprg, function(a) {
                    return Math.pow(10, a.length - 1) //将插值表达式插入10的N-1次方来占位
                })
                var colonIndex = noExpr.indexOf(":") //取得第一个冒号的位置
                if (colonIndex === -1) { // 比如 ms-class="aaa bbb ccc" 的情况
                    var className = text
                } else { // 比如 ms-class-1="ui-state-active:checked" 的情况 
                    className = text.slice(0, colonIndex)
                    rightExpr = text.slice(colonIndex + 1)
                    parseExpr(rightExpr, vmodels, data) //决定是添加还是删除
                    if (!data.evaluator) {
                        log("debug: ms-class '" + (rightExpr || "").trim() + "' 不存在于VM中")
                        return false
                    } else {
                        data._evaluator = data.evaluator
                        data._args = data.args
                    }
                }
                var hasExpr = rexpr.test(className) //比如ms-class="width{{w}}"的情况
                if (!hasExpr) {
                    data._class = className
                }
                parseExprProxy("", vmodels, data, (hasExpr ? scanExpr(className) : null))
            } else if (data.type === "class") {
                parseExprProxy(text, vmodels, data)
            }
        },
        "duplex": function(data, vmodels) {
            var elem = data.element,
                    tagName = elem.tagName
            if (typeof duplexBinding[tagName] === "function") {
                data.changed = getBindingCallback(elem, "data-duplex-changed", vmodels) || noop
                //由于情况特殊，不再经过parseExprProxy
                parseExpr(data.value, vmodels, data, "duplex")
                if (data.evaluator && data.args) {
                    var form = elem.form
                    if (form && form.msValidate) {
                        form.msValidate(elem)
                    }
                    data.bound = function(type, callback) {
                        if (elem.addEventListener) {
                            elem.addEventListener(type, callback, false)
                        } else {
                            elem.attachEvent("on" + type, callback)
                        }
                        var old = data.rollback
                        data.rollback = function() {
                            avalon.unbind(elem, type, callback)
                            old && old()
                        }
                    }
                    duplexBinding[elem.tagName](elem, data.evaluator.apply(null, data.args), data)
                }
            }
        },
        "repeat": function(data, vmodels) {
            var type = data.type,
                    list
            parseExpr(data.value, vmodels, data)
            if (type !== "repeat") {
                log("warning:建议使用ms-repeat代替ms-each, ms-with, ms-repeat只占用一个标签并且性能更好")
            }
            var elem = data.callbackElement = data.parent = data.element //用于判定当前元素是否位于DOM树
            data.getter = function() {
                return this.evaluator.apply(0, this.args || [])
            }
            data.proxies = []
            var freturn = true
            try {
                list = data.getter()
                var xtype = getType(list)
                if (xtype == "object" || xtype == "array") {
                    freturn = false
                }
            } catch (e) {
            }
            var template = hyperspace.cloneNode(false)
            if (type === "repeat") {
                var startRepeat = DOC.createComment("ms-repeat-start")
                var endRepeat = DOC.createComment("ms-repeat-end")
                data.element = data.parent = elem.parentNode
                data.startRepeat = startRepeat
                data.endRepeat = endRepeat
                elem.removeAttribute(data.name)
                data.parent.replaceChild(endRepeat, elem)
                data.parent.insertBefore(startRepeat, endRepeat)
                template.appendChild(elem)
            } else {
                var node
                while (node = elem.firstChild) {
                    if (node.nodeType === 3 && rwhitespace.test(node.data)) {
                        elem.removeChild(node)
                    } else {
                        template.appendChild(node)
                    }
                }
            }
            data.template = template
            data.rollback = function() {
                bindingExecutors.repeat.call(data, "clear")
                var endRepeat = data.endRepeat
                var parent = data.parent
                parent.insertBefore(data.template, endRepeat || null)
                if (endRepeat) {
                    parent.removeChild(endRepeat)
                    parent.removeChild(data.startRepeat)
                    data.element = data.callbackElement
                }
            }
            var arr = data.value.split(".") || []
            if (arr.length > 1) {
                arr.pop()
                var n = arr[0]
                for (var i = 0, v; v = vmodels[i++]; ) {
                    if (v && v.hasOwnProperty(n) && v[n][subscribers]) {
                        v[n][subscribers].push(data)
                        break
                    }
                }
            }
            if (freturn) {
                return
            }
            data.callbackName = "data-" + type + "-rendered"
            data.handler = bindingExecutors.repeat
            data.$outer = {}
            var check0 = "$key",
                    check1 = "$val"
            if (Array.isArray(list)) {
                check0 = "$first"
                check1 = "$last"
            }
            for (var i = 0, p; p = vmodels[i++]; ) {
                if (p.hasOwnProperty(check0) && p.hasOwnProperty(check1)) {
                    data.$outer = p
                    break
                }
            }
            node = template.firstChild
            data.fastRepeat = !!node && node.nodeType === 1 && template.lastChild === node && !node.attributes["ms-controller"] && !node.attributes["ms-important"]
            list[subscribers] && list[subscribers].push(data)
            if (!Array.isArray(list) && type !== "each") {
                var pool = withProxyPool[list.$id]
                if (!pool) {
                    withProxyCount++
                    pool = withProxyPool[list.$id] = {}
                    for (var key in list) {
                        if (list.hasOwnProperty(key) && key !== "hasOwnProperty") {
                            (function(k, v) {
                                pool[k] = createWithProxy(k, v, {})
                                pool[k].$watch("$val", function(val) {
                                    list[k] = val //#303
                                })
                            })(key, list[key])
                        }
                    }
                }
                data.handler("append", list, pool)
            } else {
                data.handler("add", 0, list)
            }
        },
        "html": function(data, vmodels) {
            parseExprProxy(data.value, vmodels, data)
        },
        "if": function(data, vmodels) {
            var elem = data.element
            elem.removeAttribute(data.name)
            if (!data.placehoder) {
                data.msInDocument = data.placehoder = DOC.createComment("ms-if")
            }
            data.vmodels = vmodels
            parseExprProxy(data.value, vmodels, data)

        },
        "on": function(data, vmodels) {
            var value = data.value,
                    four = "$event"
            if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
                var matched = (value.match(rdash) || ["", ""])[1].trim()
                if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
                    four = void 0
                    value = value.replace(rdash, "")
                }
            } else {
                four = void 0
            }
            data.hasArgs = four
            parseExprProxy(value, vmodels, data, four)
        },
        "visible": function(data, vmodels) {
            var elem = data.element
            if (!supportDisplay && !root.contains(elem)) { //fuck firfox 全家！
                var display = parseDisplay(elem.tagName)
            }
            display = display || avalon(elem).css("display")
            data.display = display === "none" ? parseDisplay(elem.tagName) : display
            parseExprProxy(data.value, vmodels, data)
        },
        "widget": function(data, vmodels) {
            var args = data.value.match(rword)
            var elem = data.element
            var widget = args[0]
            if (args[1] === "$" || !args[1]) {
                args[1] = widget + setTimeout("1")
            }
            data.value = args.join(",")
            var constructor = avalon.ui[widget]
            if (typeof constructor === "function") { //ms-widget="tabs,tabsAAA,optname"
                vmodels = elem.vmodels || vmodels
                var optName = args[2] || widget //尝试获得配置项的名字，没有则取widget的名字
                for (var i = 0, v; v = vmodels[i++]; ) {
                    if (v.hasOwnProperty(optName) && typeof v[optName] === "object") {
                        var nearestVM = v
                        break
                    }
                }
                if (nearestVM) {
                    var vmOptions = nearestVM[optName]
                    vmOptions = vmOptions.$model || vmOptions
                    var id = vmOptions[widget + "Id"]
                    if (typeof id === "string") {
                        args[1] = id
                    }
                }
                var widgetData = avalon.getWidgetData(elem, args[0]) //抽取data-tooltip-text、data-tooltip-attr属性，组成一个配置对象
                data[widget + "Id"] = args[1]
                data[widget + "Options"] = avalon.mix({}, constructor.defaults, vmOptions || {}, widgetData)
                elem.removeAttribute("ms-widget")
                var vmodel = constructor(elem, data, vmodels) || {} //防止组件不返回VM
                data.evaluator = noop
                elem.msData["ms-widget-id"] = vmodel.$id || ""
                if (vmodel.hasOwnProperty("$init")) {
                    vmodel.$init()
                }
                if (vmodel.hasOwnProperty("$remove")) {
                    var offTree = function() {
                        vmodel.$remove()
                        elem.msData = {}
                        delete VMODELS[vmodel.$id]
                    }
                    if (supportMutationEvents) {
                        elem.addEventListener("DOMNodeRemoved", function(e) {
                            if (e.target === this && !this.msRetain &&
                                    //#441 chrome浏览器对文本域进行Ctrl+V操作，会触发DOMNodeRemoved事件
                                            (window.chrome ? this.tagName === "INPUT" && this.relatedNode.nodeType === 1 : 1)) {
                                offTree()
                            }
                        })
                    } else {
                        elem.offTree = offTree
                        launchImpl(elem)
                    }
                }
            } else if (vmodels.length) { //如果该组件还没有加载，那么保存当前的vmodels
                elem.vmodels = vmodels
            }
        }
    }

    var supportMutationEvents = W3C && DOC.implementation.hasFeature("MutationEvents", "2.0")

    //============================ class preperty binding  =======================
    "hover,active".replace(rword, function(method) {
        bindingHandlers[method] = bindingHandlers["class"]
    })
    "with,each".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.repeat
    })
    //============================= boolean preperty binding =======================
    "disabled,enabled,readonly,selected".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.checked
    })
    bindingHandlers.data = bindingHandlers.text = bindingHandlers.html
    //============================= string preperty binding =======================
    //与href绑定器 用法差不多的其他字符串属性的绑定器
    //建议不要直接在src属性上修改，这样会发出无效的请求，请使用ms-src
    "title,alt,src,value,css,include,href".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.attr
    })
    //============================= model binding =======================

    //将模型中的字段与input, textarea的value值关联在一起
    var duplexBinding = bindingHandlers.duplex
    //如果一个input标签添加了model绑定。那么它对应的字段将与元素的value连结在一起
    //字段变，value就变；value变，字段也跟着变。默认是绑定input事件，
    duplexBinding.INPUT = function(element, evaluator, data) {
        var fixType = data.param,
                type = element.type,
                bound = data.bound,
                $elem = avalon(element),
                firstTigger = false,
                composing = false,
                callback = function(value) {
                    firstTigger = true
                    data.changed.call(this, value)
                },
                compositionStart = function() {
                    composing = true
                },
                compositionEnd = function() {
                    composing = false
                },
                //当value变化时改变model的值
                updateVModel = function() {
                    if (composing)
                        return
                    var val = element.oldValue = element.value
                    if ($elem.data("duplex-observe") !== false) {
                        evaluator(val)
                        callback.call(element, val)
                    }
                }

        //当model变化时,它就会改变value的值
        data.handler = function() {
            var val = evaluator()
            if (val !== element.value) {
                element.value = val + ""
            }
        }

        if (type === "checkbox" && fixType === "radio") {
            type = "radio"
        }
        if (type === "radio") {
            data.handler = function() {
                //IE6是通过defaultChecked来实现打勾效果
                element.defaultChecked = (element.checked = /bool|text/.test(fixType) ? evaluator() + "" === element.value : !!evaluator())
            }
            updateVModel = function() {
                if ($elem.data("duplex-observe") !== false) {
                    var val = element.value
                    if (fixType === "text") {
                        evaluator(val)
                    } else if (fixType === "bool") {
                        val = val === "true"
                        evaluator(val)
                    } else {
                        val = !element.defaultChecked
                        evaluator(val)
                        element.checked = val
                    }
                    callback.call(element, val)
                }
            }
            bound(fixType ? "click" : "mousedown", updateVModel)
        } else if (type === "checkbox") {
            updateVModel = function() {
                if ($elem.data("duplex-observe") !== false) {
                    var method = element.checked ? "ensure" : "remove"
                    var array = evaluator()
                    if (Array.isArray(array)) {
                        avalon.Array[method](array, element.value)
                    } else {
                        avalon.error("ms-duplex位于checkbox时要求对应一个数组")
                    }
                    callback.call(element, array)
                }
            }
            data.handler = function() {
                var array = [].concat(evaluator()) //强制转换为数组
                element.checked = array.indexOf(element.value) >= 0
            }

            bound(W3C ? "change" : "click", updateVModel)

        } else {
            var event = element.attributes["data-duplex-event"] || element.attributes["data-event"] || {}
            event = event.value
            if (event === "change") {
                bound("change", updateVModel)
            } else {
                if (W3C && DOC.documentMode !== 9) { //IE10+, W3C
                    bound("input", updateVModel)
                    bound("compositionstart", compositionStart)
                    bound("compositionend", compositionEnd)
                } else {
                    var events = ["keyup", "paste", "cut", "change"]

                    function removeFn(e) {
                        var key = e.keyCode
                        //    command            modifiers                   arrows
                        if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40))
                            return
                        if (e.type === "cut") {
                            avalon.nextTick(updateVModel)
                        } else {
                            updateVModel()
                        }
                    }

                    events.forEach(function(type) {
                        element.attachEvent("on" + type, removeFn)
                    })

                    data.rollback = function() {
                        events.forEach(function(type) {
                            element.detachEvent("on" + type, removeFn)
                        })
                    }
                }

            }
        }
        element.onTree = onTree
        launch(element)
        element.oldValue = element.value
        registerSubscriber(data)
        var timer = setTimeout(function() {
            if (!firstTigger) {
                callback.call(element, element.value)
            }
            clearTimeout(timer)
        }, 31)
    }
    var TimerID, ribbon = [],
            launch = noop
    function W3CFire(el, name, detail) {
        var event = DOC.createEvent("Events")
        event.initEvent(name, true, true)
        if (detail) {
            event.detail = detail
        }
        el.dispatchEvent(event)
    }
    function onTree() { //disabled状态下改动不触发input事件
        if (!this.disabled && this.oldValue !== this.value) {
            if (W3C) {
                W3CFire(this, "input")
            } else {
                this.fireEvent("onchange")
            }
        }
    }

    function ticker() {
        for (var n = ribbon.length - 1; n >= 0; n--) {
            var el = ribbon[n]
            if (avalon.contains(root, el)) {
                el.onTree && el.onTree()
            } else if (!el.msRetain) {
                el.offTree && el.offTree()
                ribbon.splice(n, 1)
            }
        }
        if (!ribbon.length) {
            clearInterval(TimerID)
        }
    }
    function launchImpl(el) {
        if (ribbon.push(el) === 1) {
            TimerID = setInterval(ticker, 30)
        }
    }

    function newSetter(newValue) {
        oldSetter.call(this, newValue)
        if (newValue !== this.oldValue) {
            W3CFire(this, "input")
        }
    }
    try {
        var inputProto = HTMLInputElement.prototype
        Object.getOwnPropertyNames(inputProto)//故意引发IE6-8等浏览器报错
        var oldSetter = Object.getOwnPropertyDescriptor(inputProto, "value").set //屏蔽chrome, safari,opera
        Object.defineProperty(inputProto, "value", {
            set: newSetter
        })
    } catch (e) {
        launch = launchImpl
    }

    duplexBinding.SELECT = function(element, evaluator, data) {
        var $elem = avalon(element)

        function updateVModel() {
            if ($elem.data("duplex-observe") !== false) {
                var val = $elem.val() //字符串或字符串数组
                if (val + "" !== element.oldValue) {
                    evaluator(val)
                    element.oldValue = val + ""
                }
                data.changed.call(element, val)
            }
        }
        data.handler = function() {
            var curValue = evaluator()
            curValue = curValue && curValue.$model || curValue
            curValue = Array.isArray(curValue) ? curValue.map(String) : curValue + ""
            if (curValue + "" !== element.oldValue) {
                $elem.val(curValue)
                element.oldValue = curValue + ""
            }
        }
        data.bound("change", updateVModel)
        var innerHTML = NaN
        var id = setInterval(function() {
            var currHTML = element.innerHTML
            if (currHTML === innerHTML) {
                clearInterval(id)
                //先等到select里的option元素被扫描后，才根据model设置selected属性  
                registerSubscriber(data)
                data.changed.call(element, evaluator())
            } else {
                innerHTML = currHTML
            }
        }, 20)
    }
    duplexBinding.TEXTAREA = duplexBinding.INPUT
    //============================= event binding =======================

    function fixEvent(event) {
        var ret = {}
        for (var i in event) {
            ret[i] = event[i]
        }
        var target = ret.target = event.srcElement
        if (event.type.indexOf("key") === 0) {
            ret.which = event.charCode != null ? event.charCode : event.keyCode
        } else if (/mouse|click/.test(event.type)) {
            var doc = target.ownerDocument || DOC
            var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement
            ret.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
            ret.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        }
        ret.timeStamp = new Date - 0
        ret.originalEvent = event
        ret.preventDefault = function() { //阻止默认行为
            event.returnValue = false
        }
        ret.stopPropagation = function() { //阻止事件在DOM树中的传播
            event.cancelBubble = true
        }
        return ret
    }

    var eventHooks = avalon.eventHooks
    //针对firefox, chrome修正mouseenter, mouseleave
    if (!("onmouseenter" in root)) {
        avalon.each({
            mouseenter: "mouseover",
            mouseleave: "mouseout"
        }, function(origType, fixType) {
            eventHooks[origType] = {
                type: fixType,
                deel: function(elem, fn) {
                    return function(e) {
                        var t = e.relatedTarget
                        if (!t || (t !== elem && !(elem.compareDocumentPosition(t) & 16))) {
                            delete e.type
                            e.type = origType
                            return fn.call(elem, e)
                        }
                    }
                }
            }
        })
    }
    //针对IE9+, w3c修正animationend
    avalon.each({
        AnimationEvent: "animationend",
        WebKitAnimationEvent: "webkitAnimationEnd"
    }, function(construct, fixType) {
        if (window[construct] && !eventHooks.animationend) {
            eventHooks.animationend = {
                type: fixType
            }
        }
    })
    //针对IE6-8修正input
    if (!("oninput" in document.createElement("input"))) {
        eventHooks.input = {
            type: "propertychange",
            deel: function(elem, fn) {
                return function(e) {
                    if (e.propertyName === "value") {
                        e.type = "input"
                        return fn.call(elem, e)
                    }
                }
            }
        }
    }
    if (document.onmousewheel === void 0) {
        /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
         firefox DOMMouseScroll detail 下3 上-3
         firefox wheel detlaY 下3 上-3
         IE9-11 wheel deltaY 下40 上-40
         chrome wheel deltaY 下100 上-100 */
        eventHooks.mousewheel = {
            type: "DOMMouseScroll",
            deel: function(elem, fn) {
                return function(e) {
                    e.wheelDelta = e.detail > 0 ? -120 : 120
                    if (Object.defineProperty) {
                        Object.defineProperty(e, "type", {
                            value: "mousewheel"
                        })
                    }
                    fn.call(elem, e)
                }
            }
        }
    }

    /*********************************************************************
     *          监控数组（与ms-each, ms-repeat配合使用）                     *
     **********************************************************************/

    function Collection(model) {
        var array = []
        array.$id = generateID()
        array[subscribers] = []
        array.$model = model // model.concat()
        array.$events = {} //VB对象的方法里的this并不指向自身，需要使用bind处理一下
        array._ = modelFactory({
            length: model.length
        })
        array._.$watch("length", function(a, b) {
            array.$fire("length", a, b)
        })
        for (var i in Observable) {
            array[i] = Observable[i]
        }
        avalon.mix(array, CollectionPrototype)
        return array
    }

    var _splice = ap.splice
    var CollectionPrototype = {
        _splice: _splice,
        _add: function(arr, pos) { //在第pos个位置上，添加一组元素
            var oldLength = this.length
            pos = typeof pos === "number" ? pos : oldLength
            var added = []
            for (var i = 0, n = arr.length; i < n; i++) {
                added[i] = convert(arr[i])
            }
            _splice.apply(this, [pos, 0].concat(added))
            notifySubscribers(this, "add", pos, added)
            if (!this._stopFireLength) {
                return this._.length = this.length
            }
        },
        _del: function(pos, n) { //在第pos个位置上，删除N个元素
            var ret = this._splice(pos, n)
            if (ret.length) {
                notifySubscribers(this, "del", pos, n)
                if (!this._stopFireLength) {
                    this._.length = this.length
                }
            }
            return ret
        },
        push: function() {
            ap.push.apply(this.$model, arguments)
            var n = this._add(arguments)
            notifySubscribers(this, "index", n > 2 ? n - 2 : 0)
            return n
        },
        pushArray: function(array) {
            return this.push.apply(this, array)
        },
        unshift: function() {
            ap.unshift.apply(this.$model, arguments)
            this._add(arguments, 0)
            notifySubscribers(this, "index", arguments.length)
            return this.$model.length //IE67的unshift不会返回长度
        },
        shift: function() {
            var el = this.$model.shift()
            this._del(0, 1)
            notifySubscribers(this, "index", 0)
            return el //返回被移除的元素
        },
        pop: function() {
            var el = this.$model.pop()
            this._del(this.length - 1, 1)
            return el //返回被移除的元素
        },
        splice: function(a, b) {
            // 必须存在第一个参数，需要大于-1, 为添加或删除元素的基点
            a = resetNumber(a, this.length)
            var removed = _splice.apply(this.$model, arguments),
                    ret = [], change
            this._stopFireLength = true //确保在这个方法中 , $watch("length",fn)只触发一次
            if (removed.length) {
                ret = this._del(a, removed.length)
                change = true
            }
            if (arguments.length > 2) {
                this._add(aslice.call(arguments, 2), a)
                change = true
            }
            this._stopFireLength = false
            this._.length = this.length
            if (change) {
                notifySubscribers(this, "index", 0)
            }
            return ret //返回被移除的元素
        },
        contains: function(el) { //判定是否包含
            return this.indexOf(el) !== -1
        },
        size: function() { //取得数组长度，这个函数可以同步视图，length不能
            return this._.length
        },
        remove: function(el) { //移除第一个等于给定值的元素
            return this.removeAt(this.indexOf(el))
        },
        removeAt: function(index) { //移除指定索引上的元素
            return index >= 0 ? this.splice(index, 1) : []
        },
        clear: function() {
            this.$model.length = this.length = this._.length = 0 //清空数组
            notifySubscribers(this, "clear", 0)
            return this
        },
        removeAll: function(all) { //移除N个元素
            if (Array.isArray(all)) {
                all.forEach(function(el) {
                    this.remove(el)
                }, this)
            } else if (typeof all === "function") {
                for (var i = this.length - 1; i >= 0; i--) {
                    var el = this[i]
                    if (all(el, i)) {
                        this.splice(i, 1)
                    }
                }
            } else {
                this.clear()
            }
        },
        ensure: function(el) {
            if (!this.contains(el)) { //只有不存在才push
                this.push(el)
            }
            return this
        },
        set: function(index, val) {
            if (index >= 0) {
                var valueType = getType(val)
                if (val && val.$model) {
                    val = val.$model
                }
                var target = this[index]
                if (valueType === "object") {
                    for (var i in val) {
                        if (target.hasOwnProperty(i)) {
                            target[i] = val[i]
                        }
                    }
                } else if (valueType === "array") {
                    target.clear().push.apply(target, val)
                } else if (target !== val) {
                    this[index] = val
                    this.$model[index] = val
                    notifySubscribers(this, "set", index, val)
                }
            }
            return this
        }
    }
    "sort,reverse".replace(rword, function(method) {
        CollectionPrototype[method] = function() {
            var aaa = this.$model,
                    bbb = aaa.slice(0),
                    sorted = false
            ap[method].apply(aaa, arguments) //先移动model
            for (var i = 0, n = bbb.length; i < n; i++) {
                var a = aaa[i],
                        b = bbb[i]
                if (!isEqual(a, b)) {
                    sorted = true
                    var index = bbb.indexOf(a, i)
                    var remove = this._splice(index, 1)[0]
                    var remove2 = bbb.splice(index, 1)[0]
                    this._splice(i, 0, remove)
                    bbb.splice(i, 0, remove2)
                    notifySubscribers(this, "move", index, i)
                }
            }
            bbb = void 0
            if (sorted) {
                notifySubscribers(this, "index", 0)
            }
            return this
        }
    })

    function convert(val) {
        if (rcomplexType.test(avalon.type(val))) {
            val = val.$id ? val : modelFactory(val, val)
        }
        return val
    }

    //============ each/repeat/with binding 用到的辅助函数与对象 ======================
    //得到某一元素节点或文档碎片对象下的所有注释节点
    var queryComments = DOC.createTreeWalker ? function(parent) {
        var tw = DOC.createTreeWalker(parent, NodeFilter.SHOW_COMMENT, null, null),
                comment, ret = []
        while (comment = tw.nextNode()) {
            ret.push(comment)
        }
        return ret
    } : function(parent) {
        return parent.getElementsByTagName("!")
    }
    //将通过ms-if移出DOM树放进ifSanctuary的元素节点移出来，以便垃圾回收

    function expelFromSanctuary(parent) {
        var comments = queryComments(parent)
        for (var i = 0, comment; comment = comments[i++]; ) {
            if (comment.nodeValue == "ms-if") {
                cinerator.appendChild(comment.elem)
            }
        }
        while (comment = parent.firstChild) {
            cinerator.appendChild(comment)
        }
        cinerator.innerHTML = ""
    }

    function iteratorCallback(args) {
        var callback = getBindingCallback(this.callbackElement, this.callbackName, this.vmodels)
        if (callback) {
            var parent = this.parent
            checkScan(parent, function() {
                callback.apply(parent, args)
            })
        }
    }
    //为ms-each, ms-with, ms-repeat要循环的元素外包一个msloop临时节点，ms-controller的值为代理VM的$id

    function shimController(data, transation, spans, proxy) {
        var tview = data.template.cloneNode(true)
        var id = proxy.$id
        var span = tview.firstChild
        if (!data.fastRepeat) {
            span = DOC.createElement("msloop")
            span.style.display = "none"
            span.appendChild(tview)
        }
        span.setAttribute("ms-controller", id)
        spans.push(span)
        transation.appendChild(span)
        proxy.$outer = data.$outer
        VMODELS[id] = proxy

        function fn() {
            delete VMODELS[id]
            data.group = 1
            if (!data.fastRepeat) {
                data.group = span.childNodes.length
                span.parentNode.removeChild(span)
                while (span.firstChild) {
                    transation.appendChild(span.firstChild)
                }
                if (fn.node !== void 0) {
                    fn.parent.insertBefore(transation, fn.node)
                }
            }
        }
        return span.patchRepeat = fn
    }
    // 取得用于定位的节点。在绑定了ms-each, ms-with属性的元素里，它的整个innerHTML都会视为一个子模板先行移出DOM树，
    // 然后如果它的元素有多少个（ms-each）或键值对有多少双（ms-with），就将它复制多少份(多少为N)，再经过扫描后，重新插入该元素中。
    // 这时该元素的孩子将分为N等分，每等份的第一个节点就是这个用于定位的节点，
    // 方便我们根据它算出整个等分的节点们，然后整体移除或移动它们。

    function getLocatedNode(parent, data, pos) {
        if (data.startRepeat) {
            var ret = data.startRepeat,
                    end = data.endRepeat
            pos += 1
            for (var i = 0; i < pos; i++) {
                ret = ret.nextSibling
                if (ret == end)
                    return end
            }
            return ret
        } else {
            return parent.childNodes[data.group * pos] || null
        }
    }

    function removeView(node, group, n) {
        var length = group * (n || 1)
        var view = hyperspace//.cloneNode(false)//???
        while (--length >= 0) {
            var nextSibling = node.nextSibling
            view.appendChild(node)
            node = nextSibling
            if (!node) {
                break
            }
        }
        return view
    }
    // 为ms-each, ms-repeat创建一个代理对象，通过它们能使用一些额外的属性与功能（$index,$first,$last,$remove,$key,$val,$outer）
    var watchEachOne = oneObject("$index,$first,$last")

    function createWithProxy(key, val, $outer) {
        var proxy = modelFactory({
            $key: key,
            $outer: $outer,
            $val: val
        }, 0, {
            $val: 1,
            $key: 1
        })
        proxy.$id = "$proxy$with" + Math.random()
        return proxy
    }
    var eachProxyPool = []
    function getEachProxy(index, item, data, last) {
        var param = data.param || "el", proxy
        var source = {
            $remove: function() {
                return data.getter().removeAt(proxy.$index)
            },
            $itemName: param,
            $index: index,
            $outer: data.$outer,
            $first: index === 0,
            $last: index === last
        }
        source[param] = item
        for (var i = 0, n = eachProxyPool.length; i < n; i++) {
            var proxy = eachProxyPool[i]
            if (proxy.hasOwnProperty(param)) {
                for (var i in source) {
                    proxy[i] = source[i]
                }
                eachProxyPool.splice(i, 1)
                return proxy
            }
        }
        if (rcomplexType.test(avalon.type(item))) {
            source.$skipArray = [param]
        }
        proxy = modelFactory(source, 0, watchEachOne)
        proxy.$id = "$proxy$" + data.type + Math.random()
        return proxy
    }
    function recycleEachProxy(proxy) {
        var obj = proxy.$accessors, name = proxy.$itemName;
        ["$index", "$last", "$first"].forEach(function(prop) {
            obj[prop][subscribers].length = 0
        })
        if (proxy[name][subscribers]) {
            proxy[name][subscribers].length = 0;
        }
        if (eachProxyPool.unshift(proxy) > kernel.maxRepeatSize) {
            eachProxyPool.pop()
        }
    }
    /*********************************************************************
     *                  文本绑定里默认可用的过滤器                          *
     **********************************************************************/
    var rscripts = /<script[^>]*>([\S\s]*?)<\/script\s*>/gim
    var raimg = /^<(a|img)\s/i
    var ron = /\s+(on[^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
    var ropen = /<\w+\b(?:(["'])[^"]*?(\1)|[^>])*>/ig
    var rjavascripturl = /\s+(src|href)(?:=("javascript[^"]*"|'javascript[^']*'))?/ig
    var rsurrogate = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g
    var rnoalphanumeric = /([^\#-~| |!])/g;
    var filters = avalon.filters = {
        uppercase: function(str) {
            return str.toUpperCase()
        },
        lowercase: function(str) {
            return str.toLowerCase()
        },
        truncate: function(target, length, truncation) {
            //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
            length = length || 30
            truncation = truncation === void(0) ? "..." : truncation
            return target.length > length ? target.slice(0, length - truncation.length) + truncation : String(target)
        },
        camelize: camelize,
        //https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
        //    <a href="javasc&NewLine;ript&colon;alert('XSS')">chrome</a> 
        //    <a href="data:text/html;base64, PGltZyBzcmM9eCBvbmVycm9yPWFsZXJ0KDEpPg==">chrome</a>
        //    <a href="jav	ascript:alert('XSS');">IE67chrome</a>
        //    <a href="jav&#x09;ascript:alert('XSS');">IE67chrome</a>
        //    <a href="jav&#x0A;ascript:alert('XSS');">IE67chrome</a>
        sanitize: function(str) {
            return str.replace(rscripts, "").replace(ropen, function(a, b) {
                if (raimg.test(a)) {
                    a = a.replace(rjavascripturl, " $1=''")//移除javascript伪协议
                }
                return a.replace(ron, " ").replace(/\s+/g, " ")//移除onXXX事件
            })
        },
        escape: function(html) {
            //将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt 
            return String(html).
                    replace(/&/g, '&amp;').
                    replace(rsurrogate, function(value) {
                        var hi = value.charCodeAt(0)
                        var low = value.charCodeAt(1)
                        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';'
                    }).
                    replace(rnoalphanumeric, function(value) {
                        return '&#' + value.charCodeAt(0) + ';'
                    }).
                    replace(/</g, '&lt;').
                    replace(/>/g, '&gt;')
        },
        currency: function(number, symbol) {
            symbol = symbol || "\uFFE5"
            return symbol + avalon.filters.number(number)
        },
        number: function(number, decimals, dec_point, thousands_sep) {
            //与PHP的number_format完全兼容
            //number	必需，要格式化的数字
            //decimals	可选，规定多少个小数位。
            //dec_point	可选，规定用作小数点的字符串（默认为 . ）。
            //thousands_sep	可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
            // http://kevin.vanzonneveld.net
            number = (number + "").replace(/[^0-9+\-Ee.]/g, "")
            var n = !isFinite(+number) ? 0 : +number,
                    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                    sep = thousands_sep || ",",
                    dec = dec_point || ".",
                    s = "",
                    toFixedFix = function(n, prec) {
                        var k = Math.pow(10, prec)
                        return "" + Math.round(n * k) / k
                    }
            // Fix for IE parseFloat(0.55).toFixed(0) = 0 
            s = (prec ? toFixedFix(n, prec) : "" + Math.round(n)).split('.')
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
            }
            if ((s[1] || "").length < prec) {
                s[1] = s[1] || ""
                s[1] += new Array(prec - s[1].length + 1).join("0")
            }
            return s.join(dec)
        }
    }
    /*
     'yyyy': 4 digit representation of year (e.g. AD 1 => 0001, AD 2010 => 2010)
     'yy': 2 digit representation of year, padded (00-99). (e.g. AD 2001 => 01, AD 2010 => 10)
     'y': 1 digit representation of year, e.g. (AD 1 => 1, AD 199 => 199)
     'MMMM': Month in year (January-December)
     'MMM': Month in year (Jan-Dec)
     'MM': Month in year, padded (01-12)
     'M': Month in year (1-12)
     'dd': Day in month, padded (01-31)
     'd': Day in month (1-31)
     'EEEE': Day in Week,(Sunday-Saturday)
     'EEE': Day in Week, (Sun-Sat)
     'HH': Hour in day, padded (00-23)
     'H': Hour in day (0-23)
     'hh': Hour in am/pm, padded (01-12)
     'h': Hour in am/pm, (1-12)
     'mm': Minute in hour, padded (00-59)
     'm': Minute in hour (0-59)
     'ss': Second in minute, padded (00-59)
     's': Second in minute (0-59)
     'a': am/pm marker
     'Z': 4 digit (+sign) representation of the timezone offset (-1200-+1200)
     format string can also be one of the following predefined localizable formats:
     
     'medium': equivalent to 'MMM d, y h:mm:ss a' for en_US locale (e.g. Sep 3, 2010 12:05:08 pm)
     'short': equivalent to 'M/d/yy h:mm a' for en_US locale (e.g. 9/3/10 12:05 pm)
     'fullDate': equivalent to 'EEEE, MMMM d,y' for en_US locale (e.g. Friday, September 3, 2010)
     'longDate': equivalent to 'MMMM d, y' for en_US locale (e.g. September 3, 2010
     'mediumDate': equivalent to 'MMM d, y' for en_US locale (e.g. Sep 3, 2010)
     'shortDate': equivalent to 'M/d/yy' for en_US locale (e.g. 9/3/10)
     'mediumTime': equivalent to 'h:mm:ss a' for en_US locale (e.g. 12:05:08 pm)
     'shortTime': equivalent to 'h:mm a' for en_US locale (e.g. 12:05 pm)
     */
    new function() {
        function toInt(str) {
            return parseInt(str, 10)
        }

        function padNumber(num, digits, trim) {
            var neg = ""
            if (num < 0) {
                neg = '-'
                num = -num
            }
            num = "" + num
            while (num.length < digits)
                num = "0" + num
            if (trim)
                num = num.substr(num.length - digits)
            return neg + num
        }

        function dateGetter(name, size, offset, trim) {
            return function(date) {
                var value = date["get" + name]()
                if (offset > 0 || value > -offset)
                    value += offset
                if (value === 0 && offset === -12) {
                    value = 12
                }
                return padNumber(value, size, trim)
            }
        }

        function dateStrGetter(name, shortForm) {
            return function(date, formats) {
                var value = date["get" + name]()
                var get = (shortForm ? ("SHORT" + name) : name).toUpperCase()
                return formats[get][value]
            }
        }

        function timeZoneGetter(date) {
            var zone = -1 * date.getTimezoneOffset()
            var paddedZone = (zone >= 0) ? "+" : ""
            paddedZone += padNumber(Math[zone > 0 ? "floor" : "ceil"](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2)
            return paddedZone
        }
        //取得上午下午

        function ampmGetter(date, formats) {
            return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1]
        }
        var DATE_FORMATS = {
            yyyy: dateGetter("FullYear", 4),
            yy: dateGetter("FullYear", 2, 0, true),
            y: dateGetter("FullYear", 1),
            MMMM: dateStrGetter("Month"),
            MMM: dateStrGetter("Month", true),
            MM: dateGetter("Month", 2, 1),
            M: dateGetter("Month", 1, 1),
            dd: dateGetter("Date", 2),
            d: dateGetter("Date", 1),
            HH: dateGetter("Hours", 2),
            H: dateGetter("Hours", 1),
            hh: dateGetter("Hours", 2, -12),
            h: dateGetter("Hours", 1, -12),
            mm: dateGetter("Minutes", 2),
            m: dateGetter("Minutes", 1),
            ss: dateGetter("Seconds", 2),
            s: dateGetter("Seconds", 1),
            sss: dateGetter("Milliseconds", 3),
            EEEE: dateStrGetter("Day"),
            EEE: dateStrGetter("Day", true),
            a: ampmGetter,
            Z: timeZoneGetter
        }
        var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,
                NUMBER_STRING = /^\d+$/
        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/
        // 1        2       3         4          5          6          7          8  9     10      11

        function jsonStringToDate(string) {
            var match
            if (match = string.match(R_ISO8601_STR)) {
                var date = new Date(0),
                        tzHour = 0,
                        tzMin = 0,
                        dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
                        timeSetter = match[8] ? date.setUTCHours : date.setHours
                if (match[9]) {
                    tzHour = toInt(match[9] + match[10])
                    tzMin = toInt(match[9] + match[11])
                }
                dateSetter.call(date, toInt(match[1]), toInt(match[2]) - 1, toInt(match[3]))
                var h = toInt(match[4] || 0) - tzHour
                var m = toInt(match[5] || 0) - tzMin
                var s = toInt(match[6] || 0)
                var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000)
                timeSetter.call(date, h, m, s, ms)
                return date
            }
            return string
        }
        var rfixFFDate = /^(\d+)-(\d+)-(\d{4})$/
        var rfixIEDate = /^(\d+)\s+(\d+),(\d{4})$/
        filters.date = function(date, format) {
            var locate = filters.date.locate,
                    text = "",
                    parts = [],
                    fn, match
            format = format || "mediumDate"
            format = locate[format] || format
            if (typeof (date) === "string" && date.indexOf('Date') > -1) {
                date = new Date(parseInt(date.replace("/Date(", "").replace(")/", ""), 10))
            }
            else if (typeof date === "string") {
                if (NUMBER_STRING.test(date)) {
                    date = toInt(date)
                } else {
                    var trimDate = date.trim()
                    if (trimDate.match(rfixFFDate) || trimDate.match(rfixIEDate)) {
                        date = RegExp.$3 + "/" + RegExp.$1 + "/" + RegExp.$2
                    }
                    date = jsonStringToDate(date)
                }
                date = new Date(date)
            }
            if (typeof date === "number") {
                date = new Date(date)
            }
            if (getType(date) !== "date") {
                return
            }
            while (format) {
                match = DATE_FORMATS_SPLIT.exec(format)
                if (match) {
                    parts = parts.concat(match.slice(1))
                    format = parts.pop()
                } else {
                    parts.push(format)
                    format = null
                }
            }
            parts.forEach(function(value) {
                fn = DATE_FORMATS[value]
                text += fn ? fn(date, locate) : value.replace(/(^'|'$)/g, "").replace(/''/g, "'")
            })
            return text
        }
        var locate = {
            AMPMS: {
                0: "am",
                1: "pm"
            },
            DAY: {
                0: "Sunday",
                1: "Monday",
                2: "Tuesday",
                3: "Wednesday",
                4: "Thursday",
                5: "Friday",
                6: "Saturday"
            },
            MONTH: {
                0: "Jan",
                1: "Feb",
                2: "Mar",
                3: "Apr",
                4: "May",
                5: "Jun",
                6: "Jul",
                7: "Aug",
                8: "Sep",
                9: "Oct",
                10: "Nov",
                11: "Dec"
            },
            SHORTDAY: {
                "0": "Sun",
                "1": "Mon",
                "2": "Tues",
                "3": "Wed",
                "4": "Thur",
                "5": "Fri",
                "6": "Sat"
            },
            fullDate: "y M d EEEE",
            longDate: "y M d",
            medium: "yyyy-M-d ah:mm:ss",
            mediumDate: "yyyy-M-d",
            mediumTime: "ah:mm:ss",
            "short": "yy-M-d ah:mm",
            shortDate: "yy-M-d",
            shortTime: "ah:mm"
        }
        locate.SHORTMONTH = locate.MONTH
        filters.date.locate = locate
    }
})(document)
/**
 http://www.cnblogs.com/henryzhu/p/mvvm-1-why-mvvm.ht
 http://dev.oupeng.com/wp-content/uploads/20131109-kennyluck-optimizing-js-games.html#controls-slide
 */

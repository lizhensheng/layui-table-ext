(function (global) {
    function initTable() {
        //A的ASCII码
        this.Acode = 65
        //数字和excel列标识的转换
        this.getEndCode = function (num) {
            var multiple = (num - this.Acode) / 26
            var rest = (num - this.Acode) % 26
            if (multiple < 1) {
                return String.fromCharCode(num)
            }
            else {
                return String.fromCharCode(this.Acode + multiple - 1) + String.fromCharCode(this.Acode + rest)
            }
        };
        //计算最小高度的列索引
        this.getMinIndex = function (arr) {
            let index = 0
            let min = arr[index]
            for (let i = 0; i < arr.length; i++) {
                if (min > arr[i]) {
                    min = arr[i]
                    index = i
                }
            }
            return index
        }
        this.getParent = function (arr,key) {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].key == key) {
                    return arr[i]
                }
            }
        }
        this.getPrevSibling = function (arr, prevIndex, start, end) {
            let siblings = []
            for (let i = 0; i < prevIndex; i++) {
                if (arr[i].x >= start && arr[i].x <= end) {
                    siblings.push(arr[i])
                }
            }
            return siblings
        }
        //获取表头的所有列的位置信息
        this.getPosition = function (cols) {
            let points = [[]]
            let point = { x: 0, y: 0 }
            let nextX = 0
            let nextY = 0
            for (let i = 0; i < cols.length; i++) {
                let heights = []
                points[i] = []
                for (let j = 0; j < cols[i].length; j++) {
                    if (!heights[j]) heights[j] = 0
                    heights[j] += cols[i][j].rowspan ? cols[i][j].rowspan : 1
                   
                    if (j == cols[i].length - 1) {
                        let index = this.getMinIndex(heights)
                        if (points[i][index]) {
                            nextX = points[i][index].x
                            nextY = points[i][index].y + points[i][index].rowspan
                        } else {
                            nextY = nextY + 1
                        }
                    }
                    if (i == 0) {
                        if (j == 0) {
                            point.x=0
                            point.y=0
                        }
                        
                        let left = 0
                        if (j>0) {
                            let prev = cols[i][j - 1]
                            let deltaX = points[i][j - 1].x
                            let deltaY = points[i][j - 1].y
                            left = deltaX + (prev.colspan ? prev.colspan : 1)
                            point.x = left
                            point.y = deltaY
                        }
                        
                    } else {
                        if (j == 0) {
                            point.x = nextX
                            point.y = nextY
                        }
                        else {
                            let left = 0
                            if (j > 0) {
                                let prev = cols[i][j - 1]
                                let deltaX = points[i][j - 1].x
                                let deltaY = points[i][j - 1].y
                                left = deltaX + (prev.colspan ? prev.colspan : 1)
                                point.x = left
                                point.y = deltaY
                            }
                        }
                    }

                    let cfg = { x: 0, y: 0, colspan: 1, rowspan: 1, key: '', parentKey: '', title: '' }
                    if (cols[i][j].colspan) {
                        cfg.colspan = cols[i][j].colspan
                    }
                    if (cols[i][j].rowspan) {
                        cfg.rowspan = cols[i][j].rowspan
                    }
                    cfg.x = point.x
                    cfg.y = point.y
                    cfg.key = cols[i][j].key
                    cfg.title = cols[i][j].title
                    if (cols[i][j].parentKey) {
                        cfg.parentKey = cols[i][j].parentKey
                    }
                    points[i][j] = cfg

                }
            }
            return points
        }
        //复制数组
        this.copyArray = function (cols) {
            let re = [];
            for (let i = 0; i < cols.length; i++) {
                let arr1 = []
                for (let j = 0; j < cols[i].length; j++) {
                    arr1.push(cols[i][j]);
                }
                re.push(arr1);
            }
            return re
        }
        //排除不显示或类型不是普通列的列
        this.deleteHideCol = function (cols) {
            for (let i = cols.length - 1; i >= 0; i--) {
                for (let j = cols[i].length - 1; j >= 0; j--) {
                    if (cols[i][j].hide || cols[i][j].type!='normal') {
                        cols[i].splice(j, 1)
                    }
                }
            }
        }
        //拼接excel的表头
        this.getHeaders = function (positions) {
            let headers = [[]]
            for (let i = 0; i < positions.length; i++) {
                headers[i]=[]
            }
            for (let i = 0; i < positions.length; i++) {
                for (let j = 0; j < positions[i].length; j++) {
                    let item = positions[i][j]
                    for (let s = item.x; s < item.x + item.colspan; s++) {
                        for (let k = item.y; k < item.y + item.rowspan; k++) {
                            headers[k][s] = item.title
                        }
                    }
                }
            }
            return headers
        }
        //计算合并Excel表头列的信息
        this.getMergeExcelHeader = function (positions, y) {
            let merges = []
            for (let i = 0; i < positions.length; i++) {
                for (let j = 0; j < positions[i].length; j++) {
                    let item = positions[i][j]
                    if (item.colspan == 1 && item.rowspan == 1) continue
                    let x1 = this.getEndCode(this.Acode + item.x)
                    let y1 = y + item.y
                    let x2 = this.getEndCode(this.Acode + item.x + item.colspan - 1)
                    let y2 = y + item.y + item.rowspan - 1
                    merges.push([x1+y1,x2+y2])
                }
            }
            return merges
        }
        //计算合并数据列的信息
        this.getMergeDataProvider = function (el, providerNames, providerFixedArray) {
            var columsName = providerNames;//需要合并的列名称
            var columsFixed = providerFixedArray;//需要合并的列是否固定

            for (var k = 0; k < columsName.length; k++) { //这里循环所有要合并的列
                if (columsFixed[k]) {
                    this.tableRowSpanOfFixedCol(el, columsName[k], 'left')
                } else {
                    this.tableRowSpanNoFixedCol(el, columsName[k])
                }
            }
        }
        //layui合并tbody中单元格的方法 @param tableId  表格的id属性 @param fieldName 要合并的列field值 @desc 此方式适用于没有列冻结的单元格合并
        this.tableRowSpanNoFixedCol = function (tableId, fieldName){
                if (!tableId && !fieldName) {
                    console.log('tableId, fieldName为必填项');
                    return false;
                }
                // 获取页面中全部的表格元素
                var allTableNode = document.getElementsByClassName("layui-table-view");

                // 获取lay-id属性为tableId的表格元素的
                var targetTableNode = null;
                if (allTableNode.length > 0) {
                    for (var index = 0, length = allTableNode.length; index < length; index++) {
                        // 通过lay-id属性过滤表格元素
                        var tableLayId = allTableNode[index].getAttribute("lay-id");
                        if (tableLayId === tableId) {
                            targetTableNode = allTableNode[index];
                            break;
                        }
                    }
                }
                if (!targetTableNode) {
                    console.log('没有找到ID为：' + tableId + '的表格, 请升级您的layui版本');
                    return false;
                }

                // 开始合并单元格操作
                var tBodyNode = targetTableNode.getElementsByClassName("layui-table-body")[0];

                var tdNodes = tBodyNode.getElementsByTagName("td");
                var childFilterArr = [];
                // 获取data-field属性为fieldName的td
                for (var i = 0; i < tdNodes.length; i++) {
                    if (tdNodes[i].getAttribute("data-field") === fieldName) {
                        childFilterArr.push(tdNodes[i]);
                    }
                }

                // 获取td的个数和种类
                var childFilterTextObj = {};
                var childFilterArrLength = childFilterArr.length;
                for (var j = 0; j < childFilterArrLength; j++) {
                    var childText = childFilterArr[j].textContent;
                    if (childFilterTextObj[childText] === undefined) {
                        childFilterTextObj[childText] = 1;
                    } else {
                        var num = childFilterTextObj[childText];
                        childFilterTextObj[childText] = num * 1 + 1;
                    }
                }
                // 给获取到的td设置合并单元格属性
                for (var key in childFilterTextObj) {
                    var tdNum = childFilterTextObj[key];
                    var canRowSpan = true;
                    var needChangeBackGroundNodes = [];
                    var addEventNode = null;
                    for (var h = 0; h < childFilterArrLength; h++) {
                        if (childFilterArr[h].textContent === key) {
                            needChangeBackGroundNodes.push(childFilterArr[h]);
                            if (canRowSpan) {
                                childFilterArr[h].setAttribute("rowspan", tdNum);
                                addEventNode = childFilterArr[h];
                                canRowSpan = false;
                            } else {
                                childFilterArr[h].style.display = "none";
                            }
                        }
                    }

                    // 以下为单元格鼠标悬浮样式修改(使用闭包)
                    (function (addEventNode, needChangeBackGroundNodes) {
                        addEventNode.onmouseover = function () {
                            for (var index = 0, length = needChangeBackGroundNodes.length; index < length; index++) {
                                needChangeBackGroundNodes[index].parentNode.style.background = "#f2f2f2"; // 我这里的单元格鼠标滑过背景色为layui默认，你可以更改为你想要的颜色。
                            }
                        };
                        addEventNode.onmouseout = function () {
                            for (var index = 0, length = needChangeBackGroundNodes.length; index < length; index++) {
                                needChangeBackGroundNodes[index].parentNode.style.background = "";
                            }
                        };
                    })(addEventNode, needChangeBackGroundNodes);
                }
            }
        //layui合并tbody中单元格的方法 * @param tableId  表格的id属性 @param fieldName 要合并的列field值 @param leftOrRight 要合并的列fixed值,'left','right' @desc 此方式适用于列冻结的单元格合并
        this.tableRowSpanOfFixedCol = function (tableId, fieldName, leftOrRight) {
            if (!tableId && !fieldName) {
                console.log('tableId, fieldName为必填项');
                return false;
            }

            // 获取页面中全部的表格元素
            var allTableNode = document.getElementsByClassName("layui-table-view");

            // 获取lay-id属性为tableId的表格元素的
            var targetTableNode = null;
            if (allTableNode.length > 0) {
                for (var index = 0, length = allTableNode.length; index < length; index++) {
                    // 通过lay-id属性过滤表格元素
                    var tableLayId = allTableNode[index].getAttribute("lay-id");
                    if (tableLayId === tableId) {
                        targetTableNode = allTableNode[index];
                    }
                }
            }
            if (!targetTableNode) {
                console.log('没有找到ID为：' + tableId + '的表格,请升级您的layui版本');
                return false;
            }
            // 左侧列为冻结的情况
            var tBodyNode = targetTableNode.getElementsByClassName("layui-table-body")[0];
            var tBodyNodeFixed = null;
            if (leftOrRight === 'right') {
                tBodyNodeFixed = targetTableNode.getElementsByClassName("layui-table-fixed-r")[0];
            } else {
                tBodyNodeFixed = targetTableNode.getElementsByClassName("layui-table-fixed-l")[0];
            }

            var tdNodesFixed = tBodyNodeFixed.getElementsByTagName("td");
            var tdNodes = tBodyNode.getElementsByTagName("td");
            var childFilterArrFixed = [];
            var childFilterArr = [];
            // 获取data-field属性为fieldName的td
            for (var i = 0; i < tdNodesFixed.length; i++) {
                if (tdNodesFixed[i].getAttribute("data-field") === fieldName) {
                    childFilterArrFixed.push(tdNodesFixed[i]);
                }
            }
            for (var l = 0; l < tdNodes.length; l++) {
                if (tdNodes[l].getAttribute("data-field") === fieldName) {
                    childFilterArr.push(tdNodes[l]);
                }
            }
            // 获取td的个数和种类
            var childFilterArrLength = childFilterArrFixed.length;
            var childFilterTextObj = {};
            for (var j = 0; j < childFilterArrLength; j++) {
                var childText = childFilterArrFixed[j].textContent;
                if (childFilterTextObj[childText] === undefined) {
                    childFilterTextObj[childText] = 1;
                } else {
                    var num = childFilterTextObj[childText];
                    childFilterTextObj[childText] = num * 1 + 1;
                }
            }
            // 给获取到的td设置合并单元格属性
            for (var key in childFilterTextObj) {
                var tdNum = childFilterTextObj[key];
                if (tdNum == 1) return
                var canRowSpan = true;
                var centerTd, bottomTd;
                var needChangeBackGroundNodesFixed = [];
                var needChangeBackGroundNodes = [];
                var addEventNode = null;
                for (var h = 0; h < childFilterArrLength; h++) {
                    if (childFilterArrFixed[h].innerText === key) {
                        needChangeBackGroundNodesFixed.push(childFilterArrFixed[h]);
                        
                        if (canRowSpan) {
                            //childFilterArrFixed[h].setAttribute("rowspan", tdNum);
                            addEventNode = childFilterArrFixed[h];
                            //childFilterArrFixed[h].style.borderBottom = "none";
                            canRowSpan = false;
                            centerTd = childFilterArrFixed[h + parseInt((tdNum) / 2)]
                            bottomTd = childFilterArrFixed[h + tdNum]
                        }

                        //else {
                        //    childFilterArrFixed[h].style.display = "none";
                            
                        //}
                        childFilterArrFixed[h].style.borderBottomWidth = "0px";
                        childFilterArrFixed[h].childNodes[0].innerText = ''
                    }
                }
                centerTd.childNodes[0].innerText = key
                bottomTd.style.borderTop = "1px solid rgb(226, 226, 226)";
                for (var m = 0; m < childFilterArrLength; m++) {
                    if (childFilterArr[m].innerText === key) {
                        needChangeBackGroundNodes.push(childFilterArr[m]);
                    }
                }

                // 以下为单元格鼠标悬浮样式修改(使用闭包)
                (function (addEventNode, needChangeBackGroundNodes, needChangeBackGroundNodesFixed) {
                    addEventNode.onmouseover = function () {
                        for (var index = 0, length = needChangeBackGroundNodes.length; index < length; index++) {
                            needChangeBackGroundNodesFixed[index].parentNode.style.background = "#f2f2f2"; // 我这里的单元格鼠标滑过背景色为layui默认，你可以更改为你想要的颜色。
                            needChangeBackGroundNodes[index].parentNode.style.background = "#f2f2f2"; // 我这里的单元格鼠标滑过背景色为layui默认，你可以更改为你想要的颜色。
                        }
                    };
                    addEventNode.onmouseout = function () {
                        for (var index = 0, length = needChangeBackGroundNodes.length; index < length; index++) {
                            needChangeBackGroundNodesFixed[index].parentNode.style.background = "";
                            needChangeBackGroundNodes[index].parentNode.style.background = "";
                        }
                    };
                })(addEventNode, needChangeBackGroundNodes, needChangeBackGroundNodesFixed);
            }
        }
        //获取合并Excel数据列的信息
        this.getMergeExcelData = function (data, providerNames, providerIndexes, translateY ) {
            var merges = []
            var mergeIndex = 0;//定位需要添加合并属性的行数
            var mark = 1; //这里涉及到简单的运算，mark是计算每次需要合并的格子数
            var columsName = providerNames;//需要合并的列名称
            var columsIndex = providerIndexes;//需要合并的列索引值

            for (var k = 0; k < columsName.length; k++) { //这里循环所有要合并的列
                for (var i = 1; i < data.length; i++) { //这里循环表格当前的数据
                   
                    if (data[i][columsName[k]] === data[i - 1][columsName[k]]) { //后一行的值与前一行的值做比较，相同就需要合并
                        mark += 1;
                    } else {
                        var offsetX = this.getEndCode(this.Acode + providerIndexes[k])
                        var offsetStartY = translateY + mergeIndex + 1
                        var offsetEndY = translateY + mergeIndex + mark
                        merges.push([offsetX + offsetStartY, offsetX + offsetEndY])
                        mergeIndex = i;
                        mark = 1;//一旦前后两行的值不一样了，那么需要合并的格子数mark就需要重新计算
                    }
                }
                mergeIndex = 0;
                mark = 1;
            }
            return merges
        }
        //设置隐藏上边框的单元格
        this.hiddenBorderTop = function (data) {
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data[i].length; j++) {
                    let item = data[i][j]
                    if (item.hideTopBorder) {
                        $(`th[data-key=1-${item.key}]`).css({
                            'transform':'translateY(-1px)'
                        })
                    }
                }
            }
        }
        //渲染表格
        this.renderTable = function (config) {
            let _this = this
            let _url
            layui.use('table', function () {
                var table = layui.table;
                _url =  config.url
                $.ajax({
                    url: _url,
                    type: config.method,
                    data: Object.assign({}, config.params || {}, { pageIndex: 1, pageSize: 10 }),
                    success: function (res) {
                        if (res.status == 0) {
                            var data = res.data
                            var cols = []
                            if (!config.cols) {
                                if (data.length !== 0) {
                                    for (var key in data[0]) {
                                        let wordWidth = key.length * 12 + 50
                                        let canSort = true
                                        if (config.canSortFunc && !config.canSortFunc(key)) {
                                            canSort = false
                                        }
                                        cols.push({
                                            field: key, title: key, sort: canSort, width: wordWidth, unresize: true
                                        })
                                    }
                                }
                                cols = [cols]
                            } else {
                                cols = config.cols
                            }
                            let $tableData = table.render(Object.assign(config.userConfig ? config.userConfig : {}, {
                                elem: config.el
                                , url: _url
                                , toolbar: '#toolbarDemo' //开启头部工具栏，并为其绑定左侧模板
                                , defaultToolbar: [config.hideFilterBtn ? '' : 'filter', { //自定义头部工具栏右侧图标。如无需自定义，去除该参数即可
                                    title: '导出'
                                    , layEvent: 'LAYTABLE_TIPS'
                                    , icon: 'layui-icon-export'
                                }]
                                , title: config.title
                                , method: config.method || 'get'
                                , cols: cols
                                //, height: 'full-200' + config.heightDiff ? config.heightDiff:''
                                , page: config.page || true, autoSort: false
                                , where: config.params || {}, request: {
                                    pageName: 'pageIndex' //页码的参数名称，默认：page
                                    , limitName: 'pageSize' //每页数据量的参数名，默认：limit
                                }, response: {
                                    statusName: 'status' //规定数据状态的字段名称，默认：code
                                    , statusCode: 0 //规定成功的状态码，默认：0
                                    , msgName: 'msg' //规定状态信息的字段名称，默认：msg
                                    , countName: 'count' //规定数据总数的字段名称，默认：count
                                    , dataName: 'data' //规定数据列表的字段名称，默认：data
                                }, done: function (res, curr, count) {
                                    console.log($tableData)
                                    _this.hiddenBorderTop($tableData.config.cols)
                                    //如果是异步请求数据方式，res即为你接口返回的信息。
                                    //如果是直接赋值的方式，res即为：{data: [], count: 99} data为当前页数据、count为数据总长度
                                    $(".layui-laypage-limits").hide()
                                    $(".layui-laypage-btn").css({ "margin": "0 10px" })
                                    $("<style></style>").text(".layui-table-tool-panel{min-width:500px}.layui-table-tool-panel li{float:left}").appendTo($(".layui-table-tool"));
                                    //设置数据列合并
                                    if (config.mergeDataConfig) {
                                        _this.getMergeDataProvider(config.el.replace('#', ''),  config.mergeDataConfig.titles, config.mergeDataConfig.fixedArray)
                                    }
                                }
                            }));
                        }
                    }
                })


                var id = config.el.indexOf('#') > -1 ? config.el.substr(1) : config.el
                //头工具栏事件
                table.on('toolbar(' + id + ')', function (obj) {
                    var checkStatus = table.checkStatus(obj.config.id);
                    switch (obj.event) {
                        case 'getCheckData':
                            var data = checkStatus.data;
                            layer.alert(JSON.stringify(data));
                            break;
                        case 'getCheckLength':
                            var data = checkStatus.data;
                            layer.msg('选中了：' + data.length + ' 个');
                            break;
                        case 'isAll':
                            layer.msg(checkStatus.isAll ? '全选' : '未全选');
                            break;
                        case 'LAYTABLE_COLS':
                            //全选/全不选
                            var template = document.getElementById('switch').innerHTML
                            if ($('ul.layui-table-tool-panel').length > 0) {
                                setTimeout(() => {
                                    let tt = $(template)
                                    tt.click(function () {
                                        let checkes = $("ul.layui-table-tool-panel li .layui-form-checkbox");
                                        Array.from(checkes).forEach(item => {
                                            let switches = $("#settingFields .layui-form-checkbox")
                                            if ($(item).hasClass('layui-form-checked') && !switches.hasClass('layui-form-checked')) {
                                                $(item).click()
                                            } else if (!$(item).hasClass('layui-form-checked') && switches.hasClass('layui-form-checked')) {
                                                $(item).click()
                                            }
                                        })
                                    });
                                    tt.appendTo($('ul.layui-table-tool-panel'));
                                    setTimeout(() => {
                                        layui.use('form', function () {
                                            var form = layui.form;
                                            form.render()
                                            let _checkes = $("ul.layui-table-tool-panel li .layui-form-checkbox");
                                            let unAll = Array.from(_checkes).every(item => !($(item).hasClass('layui-form-checked')))
                                            if (unAll) {
                                                $("#settingFields .layui-form-checkbox").click()
                                            }
                                        })
                                    }, 20)
                                }, 20)
                            }
                            break;
                        //工具栏右侧图标 - 导出
                        case 'LAYTABLE_TIPS':
                            //如果是自定义的导出
                            if (config.customExport) {
                                config.customExport()
                                return
                            }
                            var _config = obj.config
                            var where = _config.where
                            var cols = _config.cols
                            let myCols = _this.copyArray(cols)
                            _this.deleteHideCol(myCols)
                            let pos = _this.getPosition(myCols)
                            let headers = _this.getHeaders(pos)
                            let _y = config.title ? 2 : 1
                            //合并单元格的信息
                            let _merges = _this.getMergeExcelHeader(pos, _y)
                            var colWidths = {}
                            var exports = []
                            var colsLength = 0
                            var rowsLength = 0
                            var showCols = []
                            for (let i = 0; i < cols.length; i++) {
                                for (let j = 0; j < cols[i].length; j++) {
                                    let item = cols[i][j]
                                    if (item.field && !item.hide && item.type === 'normal') {
                                        exports.push(item.field)
                                        showCols.push(item.field)
                                    }
                                }
                            }
                            if (exports.length > 20 && config.method === 'get') {
                                exports = []
                                console.error('当前请求为get,导出的列超长了')
                            }
                            where.exportfields = exports.join(',')
                            where.pageIndex = 1
                            where.pageSize = 10
                            $.ajax({
                                url: _url,
                                type: config.method,
                                data: where,
                                dataType: 'json',
                                success: function (res) {
                                    // 假如返回的 res.data 是需要导出的列表数据
                                    if (res.status == 0) {
                                        //最大行
                                        rowsLength = res.data.length + headers.length + (config.title ? 1 : 0)
                                        //最大列
                                        colsLength = headers[headers.length - 1].length
                                        let myArray = []
                                        let offsetHeader = headers.length + (config.title ? 1 : 0)
                                        //获取Excel的数据merge
                                        let dataMergeInfo 
                                        if (config.mergeDataConfig) {
                                            dataMergeInfo = _this.getMergeExcelData(res.data, config.mergeDataConfig.titles, config.mergeDataConfig.indexes, offsetHeader)
                                        }
                                            //统计数据整理
                                        for (let i = 0; i < res.data.length; i++) {
                                            let k = 0
                                            let _obj = {}
                                            for (let key in res.data[i]) {
                                                if (showCols.indexOf(key) > -1) {
                                                    _obj[k] = res.data[i][key]
                                                    k++
                                                }
                                            }
                                            myArray.push(_obj)
                                        }
                                        //表头数据整理
                                        for (let i = headers.length - 1; i >= 0; i--) {
                                            myArray.unshift(headers[i])
                                        }
                                        //是否设置标题
                                        let columnDefinition = ''
                                        if (config.title) {
                                            let title = {}
                                            let len = headers[headers.length - 1].length
                                            for (let i = 0; i < len; i++) {
                                                title[i] = config.title
                                            }
                                            myArray.unshift(title)
                                            let _x = _this.getEndCode(_this.Acode)
                                            let _y = _this.getEndCode(_this.Acode + len - 1)
                                            _merges.unshift([_x + 1, _y + 1])
                                            columnDefinition = `${_x}1:${_y}1`
                                        } else {
                                            let _firstrow = myArray.shift()
                                            if (_firstrow instanceof Array) {
                                                let _obj = {}
                                                for (let i = 0; i < _firstrow.length; i++) {
                                                    _obj[i] = _firstrow[i]
                                                }
                                                myArray.unshift(_obj)
                                            }
                                        }
                                        //最终要设置的数据集
                                        let lastArray = []
                                        for (let i = 0; i < myArray.length; i++) {
                                            let _firstrow = myArray[i]
                                            if (_firstrow instanceof Array) {
                                                let _obj = {}
                                                for (let i = 0; i < _firstrow.length; i++) {
                                                    _obj[i] = _firstrow[i]
                                                }
                                                lastArray.push(_obj)
                                            } else {
                                                lastArray.push(_firstrow)
                                            }
                                        }
                                        //行,列宽度设置
                                        let colConfig = {}
                                        let rowConfig = {}
                                        let _lastheader = headers[headers.length - 1]
                                        //设置列宽
                                        for (let i = 0; i < _lastheader.length; i++) {
                                            let code = _this.getEndCode(_this.Acode + i)
                                            colConfig[code] = 40 + _lastheader[i].length * 12
                                        }
                                        //设置行宽
                                        for (let i = 1; i <= lastArray.length; i++) {
                                            let headerLength = headers.length + config.title ? 1 : 0
                                            if (i <= headerLength) {
                                                rowConfig[i] = 20
                                            } else {
                                                rowConfig[i] = 15
                                            }
                                        }
                                        var colConf = LAY_EXCEL.makeColConfig(colConfig, 200);
                                        var rowConf = LAY_EXCEL.makeRowConfig(rowConfig, 15);
                                        //最后单元格右下角x坐标
                                        let _cellX = _this.getEndCode(_this.Acode + colsLength - 1)
                                        //最后单元格右下角y坐标
                                        let _cellY = rowsLength
                                        //设置对齐方式
                                        LAY_EXCEL.setExportCellStyle(lastArray, 'A1:' + (_cellX + _cellY), {
                                            s: {
                                                alignment: {
                                                    horizontal: 'center',
                                                    vertical: 'center'
                                                }
                                            }
                                        }, function (cell, newCell, row, config, currentRow, currentCol, fieldKey) {
                                            // 回调参数，cell:原有数据，newCell:根据批量设置规则自动生成的样式，row:所在行数据，config:传入的配置,currentRow:当前行索引,currentCol:当前列索引，fieldKey:当前字段索引
                                            return newCell;
                                            });
                                        //设置名称列向左对齐
                                        if (config.alignConfig) {
                                            cols = config.alignConfig.columnIndexes
                                            for (let i = 0; i < cols.length; i++) {
                                                let offsetX = _this.getEndCode(_this.Acode + cols[i])
                                                LAY_EXCEL.setExportCellStyle(lastArray, `${offsetX}${offsetHeader + 1}:${offsetX}${_cellY}`, {
                                                    s: {
                                                        alignment: {
                                                            horizontal: 'top',
                                                            vertical: 'center'
                                                        }
                                                    }
                                                }, function (cell, newCell, row, config, currentRow, currentCol, fieldKey) {
                                                    // 回调参数，cell:原有数据，newCell:根据批量设置规则自动生成的样式，row:所在行数据，config:传入的配置,currentRow:当前行索引,currentCol:当前列索引，fieldKey:当前字段索引
                                                    return newCell;
                                                });
                                            }
                                        }
                                        //设置标题字体加粗
                                        if (config.title) {
                                            LAY_EXCEL.setExportCellStyle(lastArray, columnDefinition, {
                                                s: {
                                                    font: {
                                                        bold: true
                                                    },
                                                    alignment: {
                                                        horizontal: 'top',
                                                        vertical: 'center'
                                                    }
                                                }
                                            }, function (cell, newCell, row, config, currentRow, currentCol, fieldKey) {
                                                // 回调参数，cell:原有数据，newCell:根据批量设置规则自动生成的样式，row:所在行数据，config:传入的配置,currentRow:当前行索引,currentCol:当前列索引，fieldKey:当前字段索引
                                                return newCell;
                                            });
                                        }
                                        //设置边框
                                        for (let i = 0; i < rowsLength+1; i++) {
                                            for (let j = 0; j < colsLength; j++) {
                                                let charCodeX = _this.getEndCode(_this.Acode + j)
                                                let charCodeY = i
                                                LAY_EXCEL.setRoundBorder(lastArray, `${charCodeX + charCodeY}:${charCodeX + charCodeY}`, {
                                                    top: { style: 'thin', color: { rgb: '00000000' } },
                                                    bottom: { style: 'thin', color: { rgb: '00000000' } },
                                                    left: { style: 'thin', color: { rgb: '00000000' } },
                                                    right: { style: 'thin', color: { rgb: '00000000' } }
                                                });
                                            }
                                        }
                                        if (config.mergeDataConfig) {
                                            _merges = [..._merges, ...dataMergeInfo]
                                        }
                                        let _mergeConf = LAY_EXCEL.makeMergeConfig(_merges);
                                        //设置导出
                                        LAY_EXCEL.exportExcel({
                                            sheet1: lastArray
                                        }, (config.exportName || 'excel') + '.xlsx', 'xlsx', {
                                                extend: {
                                                    '!cols': colConf,
                                                    '!rows': rowConf,
                                                    '!merges': _mergeConf
                                                }
                                            });
                                    }
                                }
                            });
                            break;
                    };
                });

                //以复选框事件为例
                table.on('checkbox(' + id + ')', function (obj) {
                    //console.log(obj)
                });

                //监听行工具事件
                table.on('tool(' + id + ')', function (obj) {
                    var data = obj.data;
                    //console.log(obj)
                    if (obj.event === 'del') {
                        layer.confirm('真的删除行么', function (index) {
                            obj.del();
                            layer.close(index);
                        });
                    } else if (obj.event === 'edit') {
                        layer.prompt({
                            formType: 2
                            , value: data.email
                        }, function (value, index) {
                            obj.update({
                                email: value
                            });
                            layer.close(index);
                        });
                    }
                });

                //监听排序事件 
                table.on('sort(' + id + ')', function (obj) { //注：sort 是工具条事件名，test 是 table 原始容器的属性 lay-filter="对应的值"
                    //console.log(obj.field); //当前排序的字段名
                    //console.log(obj.type); //当前排序类型：desc（降序）、asc（升序）、null（空对象，默认排序）
                    //console.log(this); //当前排序的 th 对象

                    //尽管我们的 table 自带排序功能，但并没有请求服务端。
                    //有些时候，你可能需要根据当前排序的字段，重新向服务端发送请求，从而实现服务端排序，如：
                    table.reload(id, {
                        initSort: obj //记录初始排序，如果不设的话，将无法标记表头的排序状态。
                        , where: { //请求参数（注意：这里面的参数可任意定义，并非下面固定的格式）
                            ordername: obj.field //排序字段
                            , ordertype: obj.type //排序方式
                        }
                    });

                });
            });
        }
    }
    global.$initTable = new initTable()
})(window)
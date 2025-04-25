module player {

    function getSeachInfo(search: string) {

        var params: any = {};
        if (!search) return params;
        var args = search.split('&');
        for (var k in args) {
            var p = args[k].split('=');
            params[p[0]] = p[1];
        }
        return params;
    }

    export function operationlog(root: webix.ui.layout, params: any) {
        function show(node, v) {
            v = JSON.parse(v);
            if ($$("detailpopup"))
                $$("detailpopup").close();
            var popup = webix.ui({
                view: "popup",
                id: "detailpopup",
                body: {
                    view: "textarea",
                    height: 400,
                    value: JSON.stringify(v, null, 4)
                }
            }).show(node);
        }
        var ClickEvents = {
            showArgs: function (e, id, trg) {
                var item = list.getItem(id);
                show(list.getItemNode(id), item.args);
            },
            showResult: function (e, id, trg) {
                var item = list.getItem(id);
                show(list.getItemNode(id), item.result);
            },
        };

        root.addView({
            type: "wide",
            padding: 2,
            id: "mainPage",
            rows: [
                {
                    view: "layout",
                    cols: [
                        {
                            view: "label",
                            label: "操作流水查询",
                            css: "title"
                        },
                        {
                            view: "label"
                        },
                        {
                            view: "button",
                            label: "导出",
                            width: 100,
                            click: exportCsv
                        },
                    ]
                },

                {
                    view: "layout",
                    cols: [
                        {
                            view: "combo",
                            id: "sid",
                            label: "服务器id",
                            value: params.sid,
                            options: serverids(),
                            width: 140
                        },
                        {
                            view: "text",
                            id: "pid",
                            label: "用户id",
                            labelWidth: 70,
                            labelAlign: "right",
                            width: 150,
                            value: params.pid
                        },
                        {
                            view: "datepicker",
                            format: "%Y-%m-%d %H:%i:%s",
                            id: "startTime",
                            align: "right",
                            label: '开始时间',
                            labelAlign: "right",
                            labelWidth: 70,
                            width: 250,
                            timepicker: true
                        },
                        {
                            view: "datepicker",
                            format: "%Y-%m-%d %H:%i:%s",
                            id: "endTime",
                            align: "right",
                            label: '结束时间',
                            labelAlign: "right",
                            labelWidth: 70,
                            width: 250,
                            timepicker: true
                        },
                        {
                            view: "label"
                        },
                        {
                            view: "button",
                            id: "refreshBtn",
                            label: "查询",
                            width: 100,
                            click: query
                        },
                    ]
                },
                {
                    view: "text",
                    id: "keyWord",
                    label: "操作(使用逗号隔开)",
                    labelWidth: 140
                },
                {
                    view: "datatable",
                    id: "list",
                    select: true,
                    resizeColumn: true,
                    scroll: "xy",
                    tooltip: true,
                    columns: [
                        {
                            id: "time",
                            header: "时间",
                            width: 160,
                            sort: "date",
                            template: formatDate
                        },
                        {
                            id: "operation",
                            header: "操作",
                            width: 120,
                            sort: "string"
                        },
                        {
                            id: "args",
                            header: "输入",
                            width: 400,
                            sort: "string",
                            template: format("showArgs")
                        },
                        {
                            id: "result",
                            header: "结果",
                            width: 400,
                            sort: "string",
                            template: format("showResult")
                        },
                    ],
                    onClick: ClickEvents,
                    data: [],
                },
                definePager(50)
            ]
        });

        let pager = $$('pager');
        let list = $$('list');

        function format(cls) {
            return function formatResult(t, c, v) {
                if (!v)
                    return "";

                if (v.length > 64 && (v[0] == '[' || v[0] == '{')) {
                    return `<button class='${cls}'>详细</button>`;
                } else
                    return v;
            }
        }
        var datas: any;
        var param: any;
        async function query() {
            param = {};
            param.sid = $$("sid").getValue();
            param.pid = $$("pid").getValue();
            param.startTime = $$("startTime").getValue();
            param.endTime = $$("endTime").getValue();
            param.operations = $$("keyWord").getValue();
            if (!param.sid || !param.pid) {
                alert("请指定玩家");
                return;
            }
            if (!param.startTime && !param.operations) {
                alert("请指定时间范围或玩家操作");
                return;
            }
            param.reverse = true;
            dataQuery("player_operation/get", param, list, pager);
        }

        function exportCsv() {
            param.fn = "操作列表.csv";
            service.downloadFile("player_operation/exportCSV", param);
        }
        query();

    }
    export function allPlayerInfo(root: webix.ui.layout, params: any) {

        var ClickEvents = {
            operationlog: function (e, id, trg) {
                var item = list.getItem(id);
                window.location.hash = `操作记录_sid=${item.sid}&pid=${item.pid}`;
            },
            playerDetial: function (e, id, trg) {
                var item = list.getItem(id);
                var params: FormDlgParams = {
                    width: 600,
                    position: "center",
                    title: "玩家详细信息",
                    elements: [
                        {
                            view: "textarea",
                            height: 600,
                            value: JSON.stringify(item, null, 4)
                        }
                    ]
                };
                return openFormDlg(params, function (vales: any, dlg: webix.ui.window) {
                    dlg.close();
                });
            },
        };

        var serverIDs: Array<number> = [];

        function getServerIDS(ids: Array<number>) {
            serverIDs = ids;
        }

        root.addView({
            type: "wide",
            padding: 2,
            id: "mainPage",
            rows: [
                {
                    view: "layout",
                    cols: [
                        {
                            view: "label",
                            label: "玩家信息",
                            css: "title"
                        },
                        {
                            view: "label"
                        },
                    ]
                },
                {
                    view: "layout",
                    cols: [
                        multiServerOptions(getServerIDS),
                        {
                            view: "label"
                        },
                    ]
                },
                {
                    view: "layout",
                    cols: [
                        {
                            view: "text",
                            id: "pid",
                            label: "用户id",
                            labelWidth: 70,
                            labelAlign: "left",
                            width: 150
                        },
                        {
                            view: "text",
                            id: "minLevel",
                            label: "等级范围",
                            labelWidth: 80,
                            labelAlign: "right",
                            width: 140
                        },
                        {
                            view: "text",
                            id: "maxLevel",
                            label: "-",
                            labelWidth: 14,
                            width: 80
                        },
                        {
                            view: "text",
                            id: "name",
                            label: "用户名",
                            labelWidth: 70,
                            labelAlign: "left",
                            width: 150
                        },
                        {
                            view: "label"
                        },
                        {
                            view: "button",
                            id: "refreshBtn",
                            label: "查询",
                            width: 100,
                            click: query
                        },
                        {
                            view: "button",
                            label: "导出",
                            width: 100,
                            click: exportCsv
                        },
                    ]
                },
                {
                    view: "datatable",
                    id: "list",
                    select: true,
                    resizeColumn: true,
                    scroll: "xy",
                    columns: [
                        {
                            id: "sid",
                            header: "区服",
                            width: 70,
                            sort: "int"
                        },
                        {
                            id: "pid",
                            header: "用户id",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "account",
                            header: "玩家账号",
                            width: 160,
                            sort: "string"
                        },
                        {
                            id: "platform",
                            header: "所属渠道",
                            width: 90,
                            sort: "string"
                        },
                        {
                            id: "name",
                            header: "玩家昵称",
                            width: 80,
                            sort: "string"
                        },
                        {
                            id: "registerTime",
                            header: "注册时间",
                            width: 160,
                            template: formatDate,
                            sort: 'date'
                        },
                        {
                            id: "lastActive",
                            header: "最近活跃",
                            width: 160,
                            template: formatDate,
                            sort: 'date'
                        },
                        {
                            id: "level",
                            header: "等级",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "n3",
                            header: "关卡",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "gem",
                            header: "钻石",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "fight",
                            header: "战斗力",
                            width: 90,
                            sort: "int"
                        },
                        {
                            id: "recharge",
                            header: "充值额度",
                            width: 90,
                            sort: "int"
                        },
                        {
                            id: "detail",
                            header: "详情",
                            width: 120,
                            template: "<button class='playerDetial'>详细信息</button>"
                        },
                        {
                            id: "operation",
                            header: "操作",
                            width: 200,
                            template: "<button class='operationlog'>操作记录</button>"
                        },
                    ],
                    onClick: ClickEvents,
                    data: []
                },
                definePager(30),
            ]
        });
        var datas: any;
        var list = $$("list");
        var param: any;
        var pager = $$("pager");

        function query() {
            param = {};
            param.sids = serverIDs.join(",");
            param.pid = $$("pid").getValue();
            param.minlevel = $$("minLevel").getValue();
            param.maxlevel = $$("maxLevel").getValue();
            param.name = $$("name").getValue();
            if (!param.pid && !param.minlevel && !param.maxlevel && !param.name || Number(param.minlevel) > Number(param.maxlevel)) {
                alert("输入信息有误，请检查");
                return
            }

            dataQuery("player/queryPlayerDetailAsync", param, list, pager);
        }

        function exportCsv() {
            param.fn = "玩家列表.csv";
            service.downloadFile("player/exportPlayerDetailAsync", param);
        }
    }
}

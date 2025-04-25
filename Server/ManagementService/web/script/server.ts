module server {
    export function serverManage(root: webix.ui.layout, parms: any) {
        var ClickEvents = {
            //detailButton: function (e, id, trg) {
            //    var item = list.getItem(id);
            //    show(list.getItemNode(id), item.content);
            //},
            modify: modifyServer,
            deleate: deleteServer,
        };
        root.addView({
            type: "wide", padding: 2,
            id: "mainPage",
            rows: [
                {
                    view: "layout", cols: [
                        { view: "label", label: "游戏服管理", css: "title" },
                        { view: "label" },
                    ]
                },
                {
                    view: "layout", cols: [
                        { view: "label" },
                        { view: "button", label: "查询", width: 100, click: getServerItems },
                        { view: "button", label: "添加", width: 100, click: addServer },
                        { view: "button", label: "导出", width: 100, click: exportServer },
                    ]
                },
                {
                    view: "datatable",
                    id: "list",
                    select: true,
                    resizeColumn: true,
                    scroll: "y",
                    columns: [
                        { id: "id", header: "id", width: 60, sort: "int" },
                        { id: "sid", header: "sid", width: 60, sort: "int" },
                        { id: "name", header: "name", width: 120, sort: "string" },
                        { id: "symbol", header: "symbol", width: 120, sort: "string", },
                        { id: "path", header: "path", width: 60, sort: "string" },
                        { id: "agentPrefix", header: "agentPrefix", width: 60, sort: "string" },
                        { id: "openTime", header: "openTime", width: 60, sort: "string" },
                        { id: "clientURL", header: "clientURL", width: 350, sort: "string" },
                        { id: "connectionString", header: "connection", width: 200, },
                        { id: "showSdk", header: "0:内部测试开放 1:完全开放", width: 200, },
                        { id: "modify", header: "修改", width: 60, template: "<button class='modify'>修改</button>" },
                        { id: "deleate", header: "删除", width: 60, template: "<button class='deleate'>删除</button>" },
                    ],
                    onClick: ClickEvents,
                },

                definePager(30),
            ]
        });

        let pager = $$('pager');
        let list = $$('list');
        let param: any
        async function getServerItems() {
            param = {};
            dataQuery("server/getServerItems", param, list, pager, function (r) {
                for (let i in r) {
                    r[i].deleate = "删除"
                    r[i].modify = "修改"
                };
            });
        }

        async function modifyServer(e, id, trg) {
            var item = list.getItem(id);

            var params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "游戏服修改" + "_id:" + item.id + "_sid:" + item.sid,
                elements: [
                    {
                        view: "layout", cols: [
                            { view: "text", id: "name", value: item.name, label: "name" },
                            { view: "text", id: "symbol", value: item.symbol, label: "symbol" },
                            //{ view: "text", id: "path", value: item.path, label: "path" },
                            //{ view: "label" },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "path", value: item.path, label: "path" },
                            { view: "text", id: "agentPrefix", value: item.agentPrefix, label: "agentPrefix" },
                            { view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "openTime", value: item.openTime, label: 'openTime', timepicker: true, stringResult: true },
                            //{ view: "label" },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "clientURL", value: item.clientURL, label: "clientURL" },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "connection", value: item.connectionString, label: "connection" },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "showSdk", value: item.showSdk, label: "内部测试开放(0:是 1:不是)" },
                        ]
                    }
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.id = item.id;
                param.sid = item.sid;
                param.name = $$("name").getValue();
                param.symbol = $$("symbol").getValue();
                param.path = $$("path").getValue();
                param.agentPrefix = $$("agentPrefix").getValue();
                param.openTime = $$("openTime").getValue();
                param.clientURL = $$("clientURL").getValue();
                param.connection = $$("connection").getValue();
                param.showSdk = $$("showSdk").getValue();
                try {
                    await service.call("server/modifyServer", param);
                    dlg.close()
                    getServerItems();
                }
                catch (e) {
                    alert(e.message);
                }
            });
        }

        async function addServer() {
            var params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "游戏服添加",
                elements: [
                    {
                        view: "layout", cols: [
                            { view: "text", id: "sid", label: "sid" },
                            { view: "text", id: "name", label: "name" },
                            { view: "text", id: "symbol", label: "symbol" },
                            //{ view: "label" },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "path", label: "path" },
                            { view: "text", id: "agentPrefix", label: "agentPrefix" },
                            { view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "openTime", label: 'openTime', timepicker: true, stringResult: true },
                            //{ view: "label" },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "clientURL", label: "clientURL" },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "connection", label: "connection" },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "showSdk", label: "0:内部测试开放 1:完全开放" },
                        ]
                    }
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.sid = $$("sid").getValue();
                param.name = $$("name").getValue();
                param.symbol = $$("symbol").getValue();
                param.path = $$("path").getValue();
                param.agentPrefix = $$("agentPrefix").getValue();
                param.openTime = $$("openTime").getValue();
                param.clientURL = $$("clientURL").getValue();
                param.connection = $$("connection").getValue();
                param.showSdk = $$("showSdk").getValue();
                try {
                    await service.call("/server/addServer", param);
                    dlg.close()
                    getServerItems();
                }
                catch (e) {
                    alert(e.message);
                }
            });
        }

        async function deleteServer(e, id, trg) {
            var item = list.getItem(id);
            var param = <any>{};
            param.id = item.id;
            try {
                await service.call("server/deleteServer", param);
                getServerItems();
            }
            catch (e) {
                alert(e.message);
            }
        }

        function exportServer() {
            param = {};
            param.fn = "游戏服列表.csv";
            service.downloadFile("/server/exportServer", param);
        }
    }

    export function serverOpen(root: webix.ui.layout, parms: any) {
        var ClickEvents = {
            //detailButton: function (e, id, trg) {
            //    var item = list.getItem(id);
            //    show(list.getItemNode(id), item.content);
            //},
            modify: modifyServerOpen,
        };
        root.addView({
            type: "wide", padding: 2,
            id: "mainPage",
            rows: [
                {
                    view: "layout", cols: [
                        { view: "label", label: "开服计划", css: "title" },
                        { view: "label" },
                    ]
                },
                {
                    view: "layout", cols: [
                        { view: "label" },
                        { view: "button", label: "查询", width: 100, click: getServerDatas },
                    ]
                },
                {
                    view: "datatable",
                    id: "list",
                    select: true,
                    resizeColumn: true,
                    scroll: "y",
                    columns: [
                        { id: "id", header: "id", width: 60, sort: "int" },
                        { id: "sid", header: "sid", width: 60, sort: "int" },
                        { id: "name", header: "name", width: 120, sort: "string" },
                        { id: "symbol", header: "symbol", width: 120, sort: "string", },
                        { id: "path", header: "path", width: 60, sort: "string" },
                        { id: "openTime", header: "openTime", width: 150, sort: "string" },
                        { id: "clientURL", header: "clientURL", width: 350, sort: "string" },
                        { id: "showSdk", header: "0:内部测试开放 1:完全开放", width: 350, sort: "string" },
                        { id: "modify", header: "修改", width: 60, template: "<button class='modify'>修改</button>" },
                    ],
                    onClick: ClickEvents,
                },

                definePager(30),
            ]
        });

        let pager = $$('pager');
        let list = $$('list');
        let param: any
        async function getServerDatas() {
            param = {};
            dataQuery("server/getServerDatas", param, list, pager, function (r) {
                for (let i in r) {
                    r[i].modify = "修改"
                };
            });
        }

        async function modifyServerOpen(e, id, trg) {
            var item = list.getItem(id);

            var params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "开服计划修改" + "_id:" + item.id + "_sid:" + item.sid,
                elements: [
                    {
                        view: "layout", cols: [
                            { view: "text", id: "name", value: item.name, label: "name" },
                            { view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "openTime", value: item.openTime, label: 'openTime', timepicker: true, stringResult: true },
                            //{ view: "label" },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "showSdk", label: "开放类型"},
                        ]
                    }
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.id = item.id;
                param.sid = item.sid;
                param.name = $$("name").getValue();
                param.openTime = $$("openTime").getValue();
                param.showSdk = $$("showSdk").getValue();
                try {
                    await service.call("server/modifyServerOpen", param);
                    dlg.close()
                    getServerDatas();
                }
                catch (e) {
                    alert(e.message);
                }
            });
        }
    }
}

module activity {
    export function activityConfig(root: webix.ui.layout, params: any) {

        var ClickEvents = {
            modify: modifyActivityConfig,
            deleate: deleteActivityConfig,
            loadfile: loadActivityConfig,
            apply: applyActivityConfigTo
        };

        let serverIDs: Array<number> = [];
        function getServerIDS(ids: Array<number>) {
            serverIDs = ids;
        }

        root.addView({
            type: "wide", padding: 2,
            id: "mainPage",
            rows: [
                {
                    view: "layout", cols: [
                        { view: "label", label: "活动配置", css: "title", width: 100, },
                        { view: "label" },
                    ]
                },
                {
                    view: "layout", cols: [
                        { view: "checkbox", id: "throwConflictException", labelRight: "冲突中断", value: 1 },
                    ]
                },
                {
                    view: "layout", cols: [
                        multiServerOptions(getServerIDS, "", "应用区服:"),
                        { view: "label" },
                        { view: "button", label: "应用勾选", width: 100, click: applyActivityConfigsTo },
                    ]
                },
                {
                    view: "layout", cols: [
                        {
                            view: "combo", id: "type", label: "活动类型", width: 250, labelAlign: "left", suggest: {
                                filter: service.filterItem,
                                data: datas._activities,
                            }
                        },
                        { view: "text", id: "name", label: "活动名称", width: 200, labelAlign: "right", },
                        { view: "text", id: "tag", label: "活动标记", width: 200, labelAlign: "right", },
                        { view: "label" },
                        { view: "button", id: "queryBtn", label: "查询", width: 100, click: getActivityConfig },
                        { view: "button", id: "createBtn", label: "创建", width: 100, click: addActivityConfig },
                        { view: "button", label: "导出", width: 100, click: loadActivityConfigs },
                    ]
                },

                {
                    view: "datatable",
                    id: "list",
                    select: true,
                    resizeColumn: true,
                    scroll: "y",
                    columns: [
                        { id: "id", header: "ID", width: 80, sort: "int" },
                        { id: "tag", header: "活动标记", width: 150, sort: "string" },
                        { id: "type", header: "活动类型", width: 80, sort: "int" },
                        { id: "name", header: "活动名称", width: 150, sort: "string" },
                        { id: "p0", header: "p0", width: 80, sort: "int" },
                        { id: "sort", header: "排序值", width: 80, sort: "int" },
                        { id: "time", header: "预开时间", width: 150, sort: "string" },
                        { id: "delay", header: "延迟天数", width: 150, sort: "int" },
                        { id: "days", header: "持续天数", width: 150, sort: "int" },
                        { id: "modify", header: "修改", width: 60, template: "<button class='modify'>修改</button>" },
                        { id: "deleate", header: "删除", width: 60, template: "<button class='deleate'>删除</button>" },
                        { id: "loadfile", header: "下载", width: 60, template: "<button class='loadfile'>下载</button>" },
                        { id: "apply", header: "应用", width: 60, template: "<button class='apply'>应用</button>" },
                        { id: "check", header: "勾选", width: 60, template: "{common.checkbox()}" },
                    ],
                    onClick: ClickEvents,
                },
                definePager(30)
            ]
        });

        let pager = $$('pager');
        let list = $$('list');
        let param: any

        async function addActivityConfig() {
            let params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "配置创建",
                elements: [
                    {
                        view: "layout", cols: [
                            { view: "text", id: "createTag", label: "活动标记", labelWidth: 100, width: 250, labelAlign: "left", },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            {
                                view: "combo", id: "createType", label: "类型(必填)", labelWidth: 100, width: 300, labelAlign: "left", options: {
                                    body: {
                                        filter: service.filterItem,
                                        data: datas._activities,
                                        on: {
                                            'onItemClick': function (id) {
                                                var item = this.getItem(id);
                                                if (item) {
                                                    console.log("Clicked: " + this.getItem(id).value);
                                                    $$("createName").setValue(item.name);
                                                }
                                                else {
                                                    webix.message("select nothing");
                                                }
                                            }
                                        },
                                    }
                                }
                            },
                            { view: "text", id: "createName", label: "活动名(必填)", labelWidth: 100, width: 300, labelAlign: "right", },
                            { view: "text", id: "createP0", label: "p0", width: 150, labelAlign: "right", },
                            { view: "text", id: "createSort", label: "sort", width: 150, labelAlign: "right", },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "createStart", align: "right", label: '预开时间', labelWidth: 100, width: 300, timepicker: true, stringResult: true },
                            { view: "counter", id: "createDelay", label: "延迟天数", min: 0, value: 0, labelWidth: 100, width: 400, labelAlign: "right", },
                            { view: "counter", id: "createDays", label: "持续天数", min: 1, value: 1, labelWidth: 100, width: 400, labelAlign: "right", },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "label", id: "createFileName", align: "right", width: 500 },
                            { view: "label" },
                            { view: "button", label: "上传文件", align: "right", width: 100, click: upload },
                        ]
                    }
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.sort = $$("createSort").getValue() || 1;
                param.p0 = $$("createP0").getValue() || 0;
                param.name = $$("createName").getValue();
                param.time = $$("createStart").getValue();
                param.delay = $$("createDelay").getValue();
                param.days = $$("createDays").getValue();
                param.type = $$("createType").getValue();
                param.tag = $$("createTag").getValue();

                if (!param.name || !param.days || !param.type) {
                    alert("信息不完整，请检查");
                    return
                }
                if (!file) {
                    alert("no file");
                    return
                }

                try {
                    await service.uploadFileWithParamsAsync("activity/addActivityConfig", file, param);
                    dlg.close();
                    getActivityConfig();
                }
                catch (e) {
                    alert(e.message);
                }
            });

            var file;
            function upload() {
                getFile(f => {
                    file = f;
                    $$("createFileName").setValue(file.name);
                });
            }
        }
        async function deleteActivityConfig(e, id, trg) {
            param = {};
            var item = list.getItem(id);
            param.id = item.id;
            try {
                await service.call("activity/deleteActivityConfig", param);
                await getActivityConfig();
            }
            catch (e) {
                alert(e.message);
            }
        }
        async function modifyActivityConfig(e, id, trg) {
            param = {};
            var item = list.getItem(id);
            let params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "配置修改_" + item.name,
                elements: [
                    {
                        view: "layout", cols: [
                            { view: "text", id: "createTag", label: "活动标记", value: item.tag, labelWidth: 100, width: 300, labelAlign: "right", },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "text", id: "createName", label: "活动名(必填)", value: item.name, labelWidth: 100, width: 300, labelAlign: "right", },
                            { view: "text", id: "createP0", label: "p0", value: item.p0, labelWidth: 100, width: 200, labelAlign: "right", },
                            { view: "text", id: "createSort", label: "sort", labelWidth: 50, width: 150, labelAlign: "left", },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "createStart", align: "right", label: '预开时间', labelAlign: "right", labelWidth: 100, width: 300, timepicker: true, stringResult: true },
                            { view: "counter", id: "createDelay", label: "持续天数", min: 0, value: item.delay, labelWidth: 100, width: 350, labelAlign: "right", },
                            { view: "counter", id: "createDays", label: "持续天数", min: 1, value: item.days, labelWidth: 100, width: 350, labelAlign: "right", },
                        ]
                    },
                    {
                        view: "layout", cols: [
                            { view: "label", id: "createFileName", align: "right", width: 400 },
                            { view: "label" },
                            { view: "button", label: "上传文件", align: "right", width: 100, click: upload },
                        ]
                    }
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.id = item.id;
                param.type = item.type;
                param.name = $$("createName").getValue();
                param.sort = $$("createSort").getValue();
                param.p0 = $$("createP0").getValue();
                param.time = $$("createStart").getValue();
                param.delay = $$("createDelay").getValue();
                param.days = $$("createDays").getValue();
                param.tag = $$("createTag").getValue();

                if (!param.name || !param.days || !param.type) {
                    alert("信息不完整，请检查");
                    return
                }

                try {

                    if (!file) {
                        await service.call("activity/modifyActivityConfig", param);
                    } else {
                        await service.uploadFileWithParamsAsync("activity/modifyActivityConfig", file, param);
                    }
                    dlg.close();
                    await getActivityConfig();
                }
                catch (e) {
                    alert(e.message);
                }
            });

            var file;
            function upload() {
                getFile(f => {
                    file = f;
                    $$("createFileName").setValue(file.name);
                });
            }
        }
        async function getActivityConfig() {
            param = {};
            param.id = "";
            param.type = $$("type").getValue();
            param.name = $$("name").getValue();
            param.tag = $$("tag").getValue();
            dataQuery("activity/getActivityConfig", param, list, pager, function (r) {
                for (let i in r) {
                    r[i].deleate = "删除"
                    r[i].modify = "修改"
                    r[i].loadfile = "下载"
                    r[i].apply = "应用"
                };
            });
        }
        async function loadActivityConfig(e, id, trg) {
            param = {};
            var item = list.getItem(id);
            param.id = item.id;
            param.tag = "";
            param.type = "";
            param.name = "";
            param.fn = item.name + "配置.csv";
            service.downloadFile("activity/loadActivityConfig", param);
        }
        async function loadActivityConfigs() {
            param = {};
            param.id = "";
            param.type = $$("type").getValue();
            param.name = $$("name").getValue();
            param.tag = $$("tag").getValue();
            param.fn = "活动配置.csv";
            service.downloadFile("activity/loadActivityConfig", param);
        }
        async function applyActivityConfigTo(e, id, trg) {
            if (serverIDs.length == 0) {
                alert("未选择任何要应用到的服");
                return;
            }
            param = {};
            var item = list.getItem(id);
            param.id = item.id;
            param.sids = serverIDs.join(",");
            param.throwConflictException = $$("throwConflictException").getValue();
            if (param.throwConflictException)
                param.throwConflictException = true;
            else
                param.throwConflictException = false;
            try {
                await service.call("activity/applyActivityConfigTo", param);
                webix.message("执行成功");
            }
            catch (e) {
                alert(e.message);
            }
        }
        async function applyActivityConfigsTo() {
            let ids: Array<number> = [];
            let length = list.count();
            for (var i = 0; i < length; i++) {
                var id = list.getIdByIndex(i);
                var item = list.getItem(id);
                if (item.check)
                    ids.push(item.id);
            }
            if (ids.length == 0 || serverIDs.length == 0) {
                alert("请选择要应用的项和应用到的服");
                return;
            }
            param = {};
            param.ids = ids.join(",");
            param.sids = serverIDs.join(",");
            param.throwConflictException = $$("throwConflictException").getValue();
            if (param.throwConflictException)
                param.throwConflictException = true;
            else
                param.throwConflictException = false;
            try {
                await service.call("activity/applyActivityConfigs", param);
                webix.message("执行成功");
            }
            catch (e) {
                alert(e.message);
            }
        }
    }
}
module cdkey {
    export function cdkeyGift(root: webix.ui.layout, params: any) {

        var ClickEvents = {
            modify: modifyCDKeyGift,
            deleate: deleteCDKeyGift,
            loadfile: exportCDKeyGift,
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
                            label: "礼包配置",
                            css: "title",
                            width: 100,
                        },
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
                            id: "serial",
                            label: "礼包ID",
                            width: 300,
                            labelAlign: "right",
                        },
                        {
                            view: "text",
                            id: "name",
                            label: "礼包名称",
                            width: 300,
                            labelAlign: "right",
                        },
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
                            id: "desc",
                            label: "礼包描述",
                            width: 300,
                            labelAlign: "right",
                        },
                        {
                            view: "text",
                            id: "content",
                            label: "礼包内容",
                            width: 300,
                            labelAlign: "right",
                        },
                        {
                            view: "text",
                            id: "tag",
                            label: "礼包标记",
                            width: 200,
                            labelAlign: "right",
                        },
                        {
                            view: "label"
                        },
                    ]
                },
                {
                    view: "layout",
                    cols: [
                        {
                            view: "datepicker",
                            format: "%Y-%m-%d %H:%i:%s",
                            id: "start",
                            align: "right",
                            label: '开始时间',
                            labelAlign: "right",
                            width: 300,
                            timepicker: true,
                            stringResult: true
                        },
                        {
                            view: "datepicker",
                            format: "%Y-%m-%d %H:%i:%s",
                            id: "end",
                            align: "right",
                            label: '结束时间',
                            labelAlign: "right",
                            width: 300,
                            timepicker: true,
                            stringResult: true
                        },
                        {
                            view: "label"
                        },
                        {
                            view: "button",
                            id: "queryBtn",
                            label: "查询",
                            width: 100,
                            click: queryCDKeyGift
                        },
                        {
                            view: "button",
                            id: "createBtn",
                            label: "创建",
                            width: 100,
                            click: addCDKeyGift
                        },
                        {
                            view: "button",
                            label: "导出",
                            width: 100,
                            click: exportCDKeyGifts
                        },
                    ]
                },
                {
                    view: "datatable",
                    id: "list",
                    select: true,
                    resizeColumn: true,
                    scroll: "y",
                    columns: [
                        {
                            id: "serial",
                            header: "礼包ID",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "name",
                            header: "礼包名称",
                            width: 150,
                            sort: "string"
                        },
                        {
                            id: "desc",
                            header: "礼包描述",
                            width: 150,
                            sort: "string"
                        },
                        {
                            id: "content",
                            header: "礼包内容",
                            width: 150,
                            sort: "string"
                        },
                        {
                            id: "tag",
                            label: "礼包标记",
                            width: 200,
                            sort: "int"
                        },
                        {
                            id: "time",
                            header: "添加时间",
                            width: 150,
                            sort: "string"
                        },
                        {
                            id: "modify",
                            header: "修改",
                            width: 60,
                            template: "<button class='modify'>修改</button>"
                        },
                        {
                            id: "deleate",
                            header: "删除",
                            width: 60,
                            template: "<button class='deleate'>删除</button>"
                        },
                        {
                            id: "loadfile",
                            header: "下载",
                            width: 60,
                            template: "<button class='loadfile'>下载</button>"
                        },
                        {
                            id: "check",
                            header: "勾选",
                            width: 60,
                            template: "{common.checkbox()}"
                        },
                    ],
                    onClick: ClickEvents,
                },
                definePager(50)
            ]
        });

        let pager = $$('pager');
        let list = $$('list');
        let param: any

        async function addCDKeyGift() {
            let params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "礼包添加",
                elements: [
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "text",
                                id: "cserial",
                                label: "礼包ID",
                                width: 300,
                                labelAlign: "right",
                            },
                            {
                                view: "text",
                                id: "cname",
                                label: "礼包名称",
                                width: 300,
                                labelAlign: "right",
                            },
                            {
                                view: "text",
                                id: "ctag",
                                label: "礼包标记",
                                width: 200,
                                labelAlign: "right",
                            },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "text",
                                id: "cdesc",
                                label: "礼包描述",
                                labelAlign: "right",
                            },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "text",
                                id: "ccontent",
                                label: "礼包内容",
                                labelAlign: "right",
                            },
                        ]
                    },
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.serial = $$("cserial").getValue();
                param.name = $$("cname").getValue();
                param.desc = $$("cdesc").getValue();
                param.content = $$("ccontent").getValue();
                param.tag = $$("ctag").getValue();

                if (!param.serial ||
                    !param.name ||
                    !param.desc ||
                    !param.content) {
                    alert("信息不完整，请检查");
                    return
                }

                try {
                    await service.call("cdkey/addCDKeyGift", param);
                    dlg.close();
                    queryCDKeyGift();
                } catch (e) {
                    alert(e.message);
                }
            });
        }
        async function deleteCDKeyGift(e, id, trg) {
            param = {};
            var item = list.getItem(id);
            param.serial = item.serial;
            try {
                await service.call("cdkey/deleteCDKeyGift", param);
                await queryCDKeyGift();
            } catch (e) {
                alert(e.message);
            }
        }
        async function modifyCDKeyGift(e, id, trg) {
            param = {};
            var item = list.getItem(id);
            let params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "礼包修改_" + item.name,
                elements: [
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "text",
                                id: "cname",
                                label: "礼包名称",
                                value: item.name,
                                width: 300,
                                labelAlign: "right",
                            },
                            {
                                view: "text",
                                id: "ctag",
                                label: "礼包标记",
                                value: item.tag,
                                width: 200,
                                labelAlign: "right",
                            },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "text",
                                id: "cdesc",
                                label: "礼包描述",
                                value: item.desc,
                                labelAlign: "right",
                            },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "text",
                                id: "ccontent",
                                label: "礼包内容",
                                value: item.content,
                                labelAlign: "right",
                            },
                        ]
                    },
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.serial = item.serial;
                param.name = $$("cname").getValue();
                param.tag = $$("ctag").getValue();
                param.desc = $$("cdesc").getValue();
                param.content = $$("ccontent").getValue();

                if (!param.name &&
                    !param.tag &&
                    !param.desc &&
                    !param.content) {
                    alert("信息不完整，请检查");
                    return
                }

                try {
                    await service.call("cdkey/modifyCDKeyGift", param);
                    dlg.close();
                    await queryCDKeyGift();
                } catch (e) {
                    alert(e.message);
                }
            });
        }
        async function queryCDKeyGift() {
            param = {};
            param.serial = $$("serial").getValue();
            param.name = $$("name").getValue();
            param.desc = $$("desc").getValue();
            param.content = $$("content").getValue();
            param.tag = $$("tag").getValue();
            param.start = $$("start").getValue();
            param.end = $$("end").getValue();
            dataQuery("cdkey/queryCDKeyGift", param, list, pager, function (r) {
                for (let i in r) {
                    r[i].deleate = "删除"
                    r[i].modify = "修改"
                    r[i].loadfile = "下载"
                };
            });
        }
        async function exportCDKeyGift(e, id, trg) {
            param = {};
            var item = list.getItem(id);
            param.serial = item.serial;
            param.name = "";
            param.desc = "";
            param.content = "";
            param.tag = "";
            param.start = "";
            param.end = "";
            param.fn = item.name + ".csv";
            service.downloadFile("cdkey/exportCDKeyGift", param);
        }
        async function exportCDKeyGifts() {
            param = {};
            param.serial = $$("serial").getValue();
            param.name = $$("name").getValue();
            param.desc = $$("desc").getValue();
            param.content = $$("content").getValue();
            param.tag = $$("tag").getValue();
            param.start = $$("start").getValue();
            param.end = $$("end").getValue();
            param.fn = "礼包配置.csv";
            service.downloadFile("cdkey/exportCDKeyGift", param);
        }
    }

    export function cdkey(root: webix.ui.layout, params: any) {

        var ClickEvents = {
            deleate: deleteActivityConfig,
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
                            label: "礼包码管理",
                            css: "title",
                            width: 100,
                        },
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
                            id: "serial",
                            label: "礼包ID",
                            width: 300,
                            labelAlign: "right",
                        },
                        {
                            view: "text",
                            id: "type",
                            label: "CDKey类型",
                            width: 300,
                            labelAlign: "right",
                        },
                        {
                            view: "text",
                            id: "code",
                            label: "CDKey",
                            width: 300,
                            labelAlign: "right",
                        },
                        {
                            view: "label"
                        },
                        {
                            view: "button",
                            id: "queryBtn",
                            label: "查询",
                            width: 100,
                            click: queryCDKey
                        },
                        {
                            view: "button",
                            id: "createBtn",
                            label: "创建",
                            width: 100,
                            click: uploadCDKey
                        },
                        {
                            view: "button",
                            id: "uploadBtn",
                            label: "导入",
                            width: 100,
                            click: uploadCDKey
                        },
                        {
                            view: "button",
                            label: "导出",
                            width: 100,
                            click: exportCDKey
                        },
                    ]
                },
                {
                    view: "datatable",
                    id: "list",
                    select: true,
                    resizeColumn: true,
                    scroll: "y",
                    columns: [
                        {
                            id: "code",
                            header: "CDKey",
                            width: 150,
                            sort: "string"
                        },
                        {
                            id: "serial",
                            header: "礼包ID",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "type",
                            label: "CDKey类型",
                            width: 200,
                            sort: "int"
                        },
                        {
                            id: "count",
                            label: "剩余个数",
                            width: 200,
                            sort: "int"
                        },
                        {
                            id: "deleate",
                            header: "删除",
                            width: 60,
                            template: "<button class='deleate'>删除</button>"
                        },
                        {
                            id: "check",
                            header: "勾选",
                            width: 60,
                            template: "{common.checkbox()}"
                        },
                    ],
                    onClick: ClickEvents,
                },
                definePager(50)
            ]
        });

        let pager = $$('pager');
        let list = $$('list');
        let param: any

        async function uploadCDKey() {
            let params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "CDKey添加",
                elements: [
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "label",
                                id: "createFileName",
                                align: "right",
                                width: 500
                            },
                            {
                                view: "label"
                            },
                            {
                                view: "button",
                                label: "上传文件",
                                align: "right",
                                width: 100,
                                click: upload
                            },
                        ]
                    }
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                if (!file) {
                    alert("请选择文件");
                    return
                }

                try {
                    await service.uploadFile("cdkey/uploadCDKey", file, param);
                    dlg.close();
                    queryCDKey();
                } catch (e) {
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
            param.serial = item.serial;
            param.type = item.type;
            param.code = item.code;
            try {
                await service.call("cdkey/deleteCDKey", param);
                await queryCDKey();
            } catch (e) {
                alert(e.message);
            }
        }
        async function queryCDKey() {
            param = {};
            param.serial = $$("serial").getValue();
            param.type = $$("type").getValue();
            param.code = $$("code").getValue();
            dataQuery("cdkey/queryCDKey", param, list, pager, function (r) {
                for (let i in r) {
                    r[i].deleate = "删除"
                };
            });
        }
        async function exportCDKey() {
            param = {};
            param.serial = $$("serial").getValue();
            param.type = $$("type").getValue();
            param.code = $$("code").getValue();
            param.fn = "cdkey" + param.serial + "_" + param.type + "_" + ".csv";
            service.downloadFile("cdkey/exportCDKey", param);
        }
    }
}

module mute {
    export function muteQuery(root: webix.ui.layout, params: any) {

        var ClickEvents = {
            modify: modifyMuteWord,
            deleate: deleteMuteWord,
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
                            label: "禁言词管理",
                            css: "title",
                            width: 150,
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
                            id: "channels",
                            label: "频道",
                            width: 200,
                            labelAlign: "right",
                        },
                        {
                            view: "text",
                            id: "keyword",
                            label: "关键词",
                            width: 200,
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
                            click: queryMuteWord
                        },
                        {
                            view: "button",
                            id: "deleteBtn",
                            label: "删除",
                            width: 100,
                            click: deleteMuteWords
                        },
                        {
                            view: "button",
                            id: "createBtn",
                            label: "创建",
                            width: 100,
                            click: addMuteWord
                        },
                    ]
                },
                {
                    view: "layout",
                    cols: [
                        {
                            view: "label"
                        },
                        {
                            view: "button",
                            id: "deleteSelectedBtn",
                            label: "删除勾选",
                            width: 300,
                            click: deleteSelectedMuteWords
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
                            id: "id",
                            header: "ID",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "channels",
                            header: "频道",
                            width: 80,
                            sort: "string"
                        },
                        {
                            id: "keyword",
                            header: "关键词",
                            width: 150,
                            sort: "string"
                        },
                        {
                            id: "time",
                            header: "禁言时长",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "state",
                            header: "状态",
                            width: 80,
                            sort: "int"
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
                            id: "check",
                            header: "勾选",
                            width: 60,
                            template: "{common.checkbox()}"
                        },
                    ],
                    onClick: ClickEvents,
                },
                definePager(30)
            ]
        });

        let pager = $$('pager');
        let list = $$('list');
        let param: any

        async function addMuteWord() {
            let params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "禁言词创建",
                elements: [
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "text",
                                id: "cchannels",
                                label: "频道",
                                labelWidth: 100,
                                width: 250,
                                labelAlign: "right",
                            },
                            {
                                view: "text",
                                id: "ckeyword",
                                label: "关键词(必填)",
                                labelWidth: 100,
                                width: 250,
                                labelAlign: "right",
                            },
                            {
                                view: "counter",
                                id: "ctime",
                                label: "禁言时长(小时)",
                                min: 1,
                                value: 24,
                                labelWidth: 100,
                                width: 250,
                                labelAlign: "right",
                            },
                        ]
                    },
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.channels = $$("cchannels").getValue() || 1;
                param.keyword = $$("ckeyword").getValue();
                param.time = $$("ctime").getValue();

                if (!param.keyword || !param.time) {
                    alert("信息不完整，请检查");
                    return
                }

                try {
                    await service.call("ban/addMuteWorld", param);
                    dlg.close();
                    queryMuteWord();
                } catch (e) {
                    alert(e.message);
                }
            });
        }
        async function deleteMuteWord(e, id, trg) {
            param = {};
            var item = list.getItem(id);
            param.id = item.id;
            try {
                await service.call("ban/deleteMuteWord", param);
                await queryMuteWord();
            } catch (e) {
                alert(e.message);
            }
        }
        async function deleteMuteWords() {
            param = {};
            param.channels = $$("channels").getValue();
            param.keyword = $$("keyword").getValue();
            param.ids = "";
            try {
                if (!param.channels && !param.keyword) {
                    confirmDialog("确认", "确认全部删除？", {}, async function () {
                        await service.call("ban/deleteMuteWords", param);
                        await queryMuteWord();
                    });
                } else {
                    await service.call("ban/deleteMuteWords", param);
                    await queryMuteWord();
                }
            } catch (e) {
                alert(e.message);
            }
        }
        async function deleteSelectedMuteWords() {
            let ids: Array<number> = [];
            let length = list.count();
            for (var i = 0; i < length; i++) {
                var id = list.getIdByIndex(i);
                var item = list.getItem(id);
                if (item.check)
                    ids.push(item.id);
            }
            if (ids.length == 0) {
                alert("请选择要删除的项");
                return;
            }
            param = {};
            param.channels = "";
            param.keyword = "";
            param.ids = ids.join(",");
            try {
                await service.call("ban/deleteMuteWords", param);
                await queryMuteWord();
            } catch (e) {
                alert(e.message);
            }
        }
        async function modifyMuteWord(e, id, trg) {
            param = {};
            var item = list.getItem(id);
            let params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "禁言词修改_" + item.keyword,
                elements: [
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "text",
                                id: "mchannels",
                                label: "频道",
                                value: item.channel,
                                labelWidth: 100,
                                width: 250,
                                labelAlign: "right",
                            },
                            {
                                view: "text",
                                id: "mkeyword",
                                label: "关键词",
                                value: item.keyword,
                                width: 150,
                                labelAlign: "right",
                            },
                            {
                                view: "counter",
                                id: "mtime",
                                label: "禁言时长(小时)",
                                min: 1,
                                value: item.time,
                                labelWidth: 100,
                                width: 250,
                                labelAlign: "right",
                            },
                        ]
                    },
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.id = item.id;
                param.channels = $$("mchannels").getValue();
                param.keyword = $$("mkeyword").getValue();
                param.time = $$("mtime").getValue();

                if (!param.channels && !param.keyword && !param.time) {
                    alert("信息不完整，请检查");
                    return
                }

                try {
                    await service.call("ban/modifyMuteWord", param);
                    dlg.close();
                    await queryMuteWord();
                } catch (e) {
                    alert(e.message);
                }
            });
        }
        async function queryMuteWord() {
            param = {};
            param.channels = $$("channels").getValue();
            param.keyword = $$("keyword").getValue();
            dataQuery("ban/queryMuteWord", param, list, pager, function (r) {
                for (let i in r) {
                    r[i].deleate = "删除"
                    r[i].modify = "修改"
                };
            });
        }
    }
}

module ban {
    export function banQuery(root: webix.ui.layout, params: any) {

        var ClickEvents = {
            banBtn: function (e, id, trg) {
                let btnName: string = e.target.innerHTML;
                if (list.getItem(id).banType) {
                    release(e, id, trg);
                } else {
                    ban(e, id, trg);
                }
            },

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

        let serverIDs: Array<number> = [];

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
                            label: "封禁管理",
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
                            label: "玩家昵称",
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
                    ]
                },
                {
                    view: "datatable",
                    id: "list",
                    select: false,
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
                            width: 120,
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
                            sort: "int"
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
                            id: "banType",
                            header: "封禁状态",
                            width: 90,
                            sort: "int"
                        },
                        {
                            id: "banReason",
                            header: "封禁原因",
                            width: 90,
                            sort: "int"
                        },
                        {
                            id: "releaseTime",
                            header: "封禁时间",
                            width: 90,
                            sort: "date"
                        },
                        {
                            id: "manage",
                            header: "封禁/解封",
                            width: 90,
                            sort: "int",
                            template: function (obj) {
                                if (obj.banType)
                                    return "<button class='banBtn'>解封</button>"
                                else
                                    return "<button class='banBtn'>封禁</button>"
                            }
                        },
                    ],
                    onClick: ClickEvents,
                    data: []
                },
                definePager(30),
            ]
        });

        var list = $$("list");
        var param: any;
        var pager = $$("pager");
        async function query() {
            param = {};
            param.sids = serverIDs.join(",");
            param.pid = $$("pid").getValue();
            param.minLv = $$("minLevel").getValue();
            param.maxLv = $$("maxLevel").getValue();
            param.name = $$("name").getValue();

            param.reverse = true;
            dataQuery("ban/queryPlayerBansAsync", param, list, pager);
        }

        async function ban(e, id, trg) {
            let item = list.getItem(id);
            let params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "封禁创建",
                elements: [
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "combo",
                                id: "sid_ban",
                                label: "服务器范围:",
                                value: item.sid,
                                options: serverids(),
                                width: 140
                            },
                            {
                                view: "text",
                                id: "pid_ban",
                                label: "用户id",
                                value: item.pid,
                                width: 150,
                                labelAlign: "right",
                            },
                            {
                                view: "text",
                                id: "name_ban",
                                label: "name",
                                value: item.name,
                                width: 150,
                                labelAlign: "right",
                            },
                            {
                                view: "text",
                                id: "level_ban",
                                label: "level",
                                value: item.level,
                                width: 150,
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
                                id: "endTime_ban",
                                align: "right",
                                label: '封禁结束时间',
                                labelWidth: 100,
                                width: 300,
                                timepicker: true,
                                stringResult: true
                            },
                            {
                                view: "label"
                            },
                        ]
                    },
                    {
                        view: "textarea",
                        id: "reason_ban",
                        label: "封禁原因",
                        labelAlign: "left",
                        height: 200
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "label",
                                label: "封禁方式: ",
                                width: 80
                            },
                            {
                                view: "checkbox",
                                id: "peopleBtn_ban",
                                label: "",
                                labelRight: "账号",
                                labelAlign: "right",
                                labelWidth: 0,
                                value: 1,
                                width: 80,
                                click: banHandle,
                                autoheight: true
                            },
                            {
                                view: "checkbox",
                                id: "msgBtn_ban",
                                label: "",
                                labelRight: "发言",
                                labelAlign: "right",
                                labelWidth: 0,
                                value: 0,
                                width: 80,
                                click: banHandle,
                                autoheight: true
                            },
                            {
                                view: "label"
                            },
                        ]
                    }
                ]
            };


            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.sid = $$("sid_ban").getValue();
                param.pid = $$("pid_ban").getValue();
                param.time = $$("endTime_ban").getValue();
                param.reason = $$("reason_ban").getValue() || '';
                param.type = banType;
                let now = new Date().getTime();
                let banTime = new Date(param.time).getTime();
                if (now >= banTime) {
                    alert("封禁时间异常，请检查~");
                    return
                }
                try {
                    await service.call("ban/banPlayer", param);
                    e.target.innerHTM = "封禁";
                    query();
                    dlg.close();
                } catch (e) {
                    alert(e.message);
                }
            });
            var banType: number = 2;

            function banHandle(e) {
                let pan = (e == 'peopleBtn_ban');
                $$(pan ? 'msgBtn_ban' : 'peopleBtn_ban').setValue(0);
                $$(e).setValue(1);
                if (pan) {
                    banType = 2;
                } else {
                    banType = 1;
                }
            }
        }

        async function release(e, id, trg) {
            var item = list.getItem(id);
            let param: any = {};
            param.sid = item.sid;
            param.pid = item.pid;
            try {
                await service.call("ban/releasePlayer", param);
                e.target.innerHTM = "封禁";
                query();
            } catch (e) {
                alert(e.message);
            }
        }
    }
}

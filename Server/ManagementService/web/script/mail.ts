module mail {
    export function mailQuery(root: webix.ui.layout, params: any) {
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
                            label: "邮件查询",
                            css: "title"
                        },
                        {
                            view: "label"
                        },
                        {
                            view: "button",
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
                            label: "玩家ID",
                            labelAlign: "right",
                            width: 150
                        },
                        {
                            view: "text",
                            id: "title",
                            label: "标题",
                            labelAlign: "right",
                            width: 250
                        },
                        {
                            view: "label"
                        },
                        {
                            view: "button",
                            label: "单发",
                            width: 100,
                            click: create
                        },
                        {
                            view: "button",
                            label: "单服群发",
                            width: 100,
                            click: sendMails
                        },
                        {
                            view: "button",
                            label: "群发",
                            width: 100,
                            click: massCreation
                        },
                    ]
                },
                {
                    view: "datatable",
                    id: "list",
                    select: false,
                    resizeColumn: true,
                    scroll: "y",
                    columns: [
                        {
                            id: "sid",
                            header: "服务器ID",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "pid",
                            header: "用户ID",
                            width: 80,
                            sort: "int"
                        },
                        {
                            id: "sender",
                            header: "发送人",
                            width: 80,
                            sort: "string"
                        },
                        {
                            id: "title",
                            header: "标题",
                            width: 150,
                            sort: "string"
                        },
                        {
                            id: "detail",
                            header: "详情",
                            width: 300,
                            sort: "string"
                        },
                        {
                            id: "items",
                            header: "附件道具",
                            width: 300,
                            sort: "string"
                        },
                        {
                            id: "time",
                            header: "发送时间",
                            format: "%Y-%m-%d %H:%i:%s",
                            width: 180,
                            sort: "date"
                        },
                    ],
                    data: [],
                },
                definePager(30)
            ]
        });

        let pager = $$('pager');
        let list = $$('list');
        var param: any;
        async function query() {
            param = {};
            param.sid = $$("sid").getValue();
            param.pid = $$("pid").getValue();
            param.title = $$("title").getValue();
            param.reverse = false;
            if (!param.sid) {
                alert("lack of sid");
                return;
            }
            if (!param.pid && !param.title) {
                alert("lack of pid or title");
                return;
            }
            dataQuery("mail/get", param, list, pager);
        }

        function exportCsv() {
            param.fn = "邮件列表.csv";
            service.downloadFile("mail/exportCSV", param);
        }

        function create() {
            var params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "单发邮件",
                elements: [
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "combo",
                                id: "createSid",
                                label: "服务器id",
                                options: serverids(),
                                width: 200
                            },
                            {
                                view: "text",
                                id: "createPid",
                                label: "玩家ID",
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
                                view: "text",
                                id: "createTitle",
                                label: "标题",
                                width: 400
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
                                view: "textarea",
                                id: "createDetail",
                                label: "详情",
                                labelAlign: "left",
                                height: 150
                            },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "combo",
                                id: "item1",
                                label: "道具1:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count1",
                                label: "数量1:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item2",
                                label: "道具2:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count2",
                                label: "数量2:",
                                min: "1",
                                value: 1
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
                                view: "combo",
                                id: "item3",
                                label: "道具3:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count3",
                                label: "数量3:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item4",
                                label: "道具4:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count4",
                                label: "数量4:",
                                min: "1",
                                value: 1
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
                                view: "combo",
                                id: "item5",
                                label: "道具5:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count5",
                                label: "数量5:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item6",
                                label: "道具6:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count6",
                                label: "数量6:",
                                min: "1",
                                value: 1
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
                                view: "combo",
                                id: "item7",
                                label: "道具7:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count7",
                                label: "数量7:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item8",
                                label: "道具8:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count8",
                                label: "数量8:",
                                min: "1",
                                value: 1
                            },
                            {
                                view: "label"
                            },
                        ]
                    },
                    {
                        view: "text",
                        id: "createItems",
                        label: "附件道具",
                        labelAlign: "left"
                    },
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.sid = $$("createSid").getValue();
                param.pid = $$("createPid").getValue();
                param.title = $$("createTitle").getValue();
                param.detail = $$("createDetail").getValue();
                param.items = $$("createItems").getValue();

                var mailItems: string = "";
                mailItems = makeMailItem($$('item1').getValue(), $$('count1').getValue(), mailItems);
                mailItems = makeMailItem($$('item2').getValue(), $$('count2').getValue(), mailItems);
                mailItems = makeMailItem($$('item3').getValue(), $$('count3').getValue(), mailItems);
                mailItems = makeMailItem($$('item4').getValue(), $$('count4').getValue(), mailItems);
                mailItems = makeMailItem($$('item5').getValue(), $$('count5').getValue(), mailItems);
                mailItems = makeMailItem($$('item6').getValue(), $$('count6').getValue(), mailItems);
                mailItems = makeMailItem($$('item7').getValue(), $$('count7').getValue(), mailItems);
                mailItems = makeMailItem($$('item8').getValue(), $$('count8').getValue(), mailItems);
                if (mailItems) {
                    if (param.items)
                        param.items = mailItems + "|" + param.items;
                    else
                        param.items = mailItems;
                }

                if (!param.sid || !param.pid || !param.title || !param.detail || !param.items) {
                    alert("信息不完整，请检查");
                    return;
                }

                if (!checkItemCount(param.items)) return;

                if (CheckItems(param.items)) {
                    try {
                        let r = await service.call("mail/add", param);
                        if (r) {
                            dlg.close()
                            //query();
                        } else {
                            alert("发送失败");
                        }
                    } catch (e) {
                        alert(e.message);
                    }
                }

            });

        }

        function splitToArr(items: string, arg: string) {
            let r = [];
            var _items = items.split(arg);
            for (let i = 0, length = _items.length; i < length; i++) {
                let _item = _items[i];
                r.push(_item);
            }
            return r;
        }

        function CheckItems(items: string) {
            var _items = splitToArr(items, "|");
            for (let i = 0, length = _items.length; i < length; i++) {
                let _item = _items[i];
                var args = splitToArr(_item, ';');
                if (isNaN(args[0]) || isNaN(args[1])) {
                    alert("附件格式不正确");
                    return false;
                }
            }
            return true;
        }

        function sendMails() {
            var params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "单服群发",
                elements: [
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "combo",
                                id: "createSid",
                                label: "服务器id",
                                options: serverids(),
                                width: 200
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
                                id: "createPid",
                                label: "玩家IDs",
                                width: 1100,
                                labelAlign: "left",
                            },
                            {
                                view: "label",
                                label: "(,分隔)"
                            },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "text",
                                id: "createTitle",
                                label: "标题",
                                width: 400
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
                                view: "textarea",
                                id: "createDetail",
                                label: "详情",
                                labelAlign: "left",
                                height: 150
                            },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "combo",
                                id: "item1",
                                label: "道具1:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count1",
                                label: "数量1:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item2",
                                label: "道具2:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count2",
                                label: "数量2:",
                                min: "1",
                                value: 1
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
                                view: "combo",
                                id: "item3",
                                label: "道具3:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count3",
                                label: "数量3:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item4",
                                label: "道具4:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count4",
                                label: "数量4:",
                                min: "1",
                                value: 1
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
                                view: "combo",
                                id: "item5",
                                label: "道具5:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count5",
                                label: "数量5:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item6",
                                label: "道具6:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count6",
                                label: "数量6:",
                                min: "1",
                                value: 1
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
                                view: "combo",
                                id: "item7",
                                label: "道具7:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count7",
                                label: "数量7:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item8",
                                label: "道具8:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count8",
                                label: "数量8:",
                                min: "1",
                                value: 1
                            },
                            {
                                view: "label"
                            },
                        ]
                    },
                    {
                        view: "text",
                        id: "createItems",
                        label: "附件道具",
                        labelAlign: "left"
                    },
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.sid = $$("createSid").getValue();
                param.pids = $$("createPid").getValue();
                param.title = $$("createTitle").getValue();
                param.detail = $$("createDetail").getValue();
                param.items = $$("createItems").getValue();

                var mailItems: string = "";
                mailItems = makeMailItem($$('item1').getValue(), $$('count1').getValue(), mailItems);
                mailItems = makeMailItem($$('item2').getValue(), $$('count2').getValue(), mailItems);
                mailItems = makeMailItem($$('item3').getValue(), $$('count3').getValue(), mailItems);
                mailItems = makeMailItem($$('item4').getValue(), $$('count4').getValue(), mailItems);
                mailItems = makeMailItem($$('item5').getValue(), $$('count5').getValue(), mailItems);
                mailItems = makeMailItem($$('item6').getValue(), $$('count6').getValue(), mailItems);
                mailItems = makeMailItem($$('item7').getValue(), $$('count7').getValue(), mailItems);
                mailItems = makeMailItem($$('item8').getValue(), $$('count8').getValue(), mailItems);
                if (mailItems) {
                    if (param.items)
                        param.items = mailItems + "|" + param.items;
                    else
                        param.items = mailItems;
                }

                if (!param.sid || !param.pids || !param.title || !param.detail || !param.items) {
                    alert("信息不完整，请检查");
                    return;
                }

                if (!checkItemCount(param.items)) return;

                if (CheckItems(param.items)) {
                    try {
                        let r = await service.call("/mail/sendMails", param);
                        if (r) {
                            dlg.close()
                            //query();
                        } else {
                            alert("发送失败");
                        }
                    } catch (e) {
                        alert(e.message);
                    }
                }

            });
        }

        function massCreation() {
            let serverIDs: Array<number> = [];

            function getServerIDS(ids: Array<number>) {
                serverIDs = ids;
            }
            var params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "群发邮件",
                elements: [
                    {
                        view: "layout",
                        cols: [
                            multiServerOptions(getServerIDS, "massCreation"),
                            {
                                view: "label"
                            },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            //{ view: "combo", id: "massSid", label: "服务器id", options: serverids(), width: 200 },
                            {
                                view: "text",
                                id: "playerLv",
                                label: "玩家等级",
                                labelAlign: "right",
                            },
                            {
                                view: "text",
                                id: "battleLv",
                                label: "关卡等级",
                                labelAlign: "right",
                            },
                            {
                                view: "text",
                                id: "days",
                                label: "多少天内",
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
                                id: "massTitle",
                                label: "标题",
                            },
                            //{ view: "text", id: "massDetail", label: "详情", labelAlign: "right", },
                            {
                                view: "label"
                            },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "textarea",
                                id: "massDetail",
                                label: "详情",
                                labelAlign: "left",
                                height: 150
                            },
                            //{ view: "text", id: "massDetail", label: "详情", labelAlign: "right", },
                            //{ view: "label" },
                        ]
                    },
                    {
                        view: "layout",
                        cols: [
                            {
                                view: "combo",
                                id: "item1",
                                label: "道具1:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count1",
                                label: "数量1:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item2",
                                label: "道具2:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count2",
                                label: "数量2:",
                                min: "1",
                                value: 1
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
                                view: "combo",
                                id: "item3",
                                label: "道具3:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count3",
                                label: "数量3:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item4",
                                label: "道具4:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count4",
                                label: "数量4:",
                                min: "1",
                                value: 1
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
                                view: "combo",
                                id: "item5",
                                label: "道具5:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count5",
                                label: "数量5:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item6",
                                label: "道具6:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count6",
                                label: "数量6:",
                                min: "1",
                                value: 1
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
                                view: "combo",
                                id: "item7",
                                label: "道具7:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count7",
                                label: "数量7:",
                                min: "1",
                                value: 1
                            },
                            //{ view: "label" },
                            {
                                view: "combo",
                                id: "item8",
                                label: "道具8:",
                                width: 300,
                                suggest: {
                                    filter: service.filterItem,
                                    data: datas._items,
                                }
                            },
                            {
                                view: "counter",
                                id: "count8",
                                label: "数量8:",
                                min: "1",
                                value: 1
                            },
                            {
                                view: "label"
                            },
                        ]
                    },
                    {
                        view: "text",
                        id: "massItems",
                        label: "附件道具",
                        labelAlign: "left"
                    },
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.playerLv = $$("playerLv").getValue();
                param.battleLv = $$("battleLv").getValue();
                param.days = $$("days").getValue();
                param.title = $$("massTitle").getValue();
                param.detail = $$("massDetail").getValue();
                param.items = $$("massItems").getValue();
                param.sids = serverIDs.join(",");

                var mailItems: string = "";
                mailItems = makeMailItem($$('item1').getValue(), $$('count1').getValue(), mailItems);
                mailItems = makeMailItem($$('item2').getValue(), $$('count2').getValue(), mailItems);
                mailItems = makeMailItem($$('item3').getValue(), $$('count3').getValue(), mailItems);
                mailItems = makeMailItem($$('item4').getValue(), $$('count4').getValue(), mailItems);
                mailItems = makeMailItem($$('item5').getValue(), $$('count5').getValue(), mailItems);
                mailItems = makeMailItem($$('item6').getValue(), $$('count6').getValue(), mailItems);
                mailItems = makeMailItem($$('item7').getValue(), $$('count7').getValue(), mailItems);
                mailItems = makeMailItem($$('item8').getValue(), $$('count8').getValue(), mailItems);
                if (mailItems) {
                    if (param.items)
                        param.items = mailItems + "|" + param.items;
                    else
                        param.items = mailItems;
                }

                if (!param.title || !param.detail || !param.items) {
                    alert("信息不完整，请检查");
                    return
                }

                if (!checkItemCount(param.items)) return;

                if (CheckItems(param.items)) {
                    try {
                        //let r = await service.call("mail/sendMails", param);
                        let r = await service.call("mail/sendServerMails", param);
                        console.log(r);
                        if (r) {
                            dlg.close()
                            //query();
                        } else {
                            alert("发送失败");
                        }
                    } catch (e) {
                        alert(e.message);
                    }
                }
            });
        }

        function makeMailItem(id: number, count: number, pre: string): string {
            if (!id || !count)
                return pre;
            if (pre)
                return pre + "|" + id + ";" + count;
            else
                return id + ";" + count;
        }

        function checkItemCount(itemStr: string): boolean {
            let out = [];
            let itemData = [
                {
                    id: 1,
                    name: "金币",
                    count: 5000000
                },
                {
                    id: 2,
                    name: "钻石",
                    count: 10000
                },
                {
                    id: 3,
                    name: "经验池经验",
                    count: 5000000
                },
                {
                    id: 4,
                    name: "友情点数",
                    count: 10000
                },
                {
                    id: 5,
                    name: "对战积分",
                    count: 10000
                },
                {
                    id: 6,
                    name: "蓝水晶",
                    count: 100000
                },
                {
                    id: 7,
                    name: "公会贡献值",
                    count: 100000
                },
                {
                    id: 8,
                    name: "人物经验",
                    count: 100000
                },
                {
                    id: 9,
                    name: "探索力",
                    count: 1000
                },
                {
                    id: 10,
                    name: "VIP经验",
                    count: 100
                },
                {
                    id: 11,
                    name: "道馆经验",
                    count: 100000
                },
            ];

            function pushText(id: number, count: number) {
                if (id > itemData[itemData.length - 1].id) return;
                for (let j = 0; j < itemData.length; j++) {
                    let data = itemData[j];
                    if (data.id == id) {
                        if (count >= data.count) {
                            out.push("(" + id + ")" + data.name + ":  " + count + "/" + data.count);
                        }
                        return;
                    }
                }
            }

            let items = itemStr.split("|");
            for (let i = 0; i < items.length; i++) {
                let item = items[i].split(";");
                let id = Number(item[0]);
                let count = Number(item[1]);
                if (id && count) {
                    pushText(id, count);
                } else {
                    alert("道具格式不正确!(tip: id1;count|id2;count  ...)");
                    return false;
                }
            }

            if (out.length == 0) {
                return true
            } else {
                let text = "以下道具超过发送数量：\n";
                for (let i = 0; i < out.length; i++) {
                    text += "\n" + out[i];
                }
                text += "\n\n确定继续？";
                let pan = window.confirm(text);
                return pan;
            }
        }
    }
}

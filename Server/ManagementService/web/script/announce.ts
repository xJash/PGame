module announce {
    export function announceQuery(root: webix.ui.layout, params: any) {
        var ClickEvents = {
            modify: function (e, id, trg) {
                var item = list.getItem(id);
                var params: FormDlgParams = {
                    width: 1200,
                    position: "center",
                    title: "公告修改",
                    elements: [
                        {
                            view: "layout", cols: [
                                { view: "textarea", id: "content", value: item.content, label: "公告内容", labelAlign: "left", height: 300 },
                            ]
                        }
                    ]
                };

                openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                    var param = <any>{};
                    param.sid = item.sid;
                    param.content = $$("content").getValue();
                    try {
                        await service.call("announce/modify", param);
                        dlg.close()
                        query();
                    }
                    catch (e) {
                        alert(e.message);
                    }
                });
            },
        };

        root.addView({
            type: "wide", padding: 2,
            id: "mainPage",
            rows: [
                {
                    view: "layout", cols: [
                        { view: "label", label: "公告查询", css: "title" },
                        { view: "label" },
                    ]
                },
                {
                    view: "layout", cols: [
						{ view: "label" },
						{ view: "button", label: "查询", width: 100, click: query },
						{ view: "button", label: "创建", width: 100, click: create },
						{ view: "button", label: "导出", width: 100, click: exportCsv },
                    ]
                },
                {
                    view: "datatable",
                    id: "list",
                    select: false,
                    resizeColumn: true,
                    scroll: "y",
                    columns: [
                        { id: "sid", header: "编号", width: 80, sort: "int" },
                        { id: "content", header: "公告内容", width: 500, sort: "string" },
                        { id: "modify", header: "修改", width: 60, template: "<button class='modify'>修改</button>" },
                    ],
                    onClick: ClickEvents,
                    data: [],
                },
                definePager(30)
            ]
        });

		let list = $$('list');
		let pager = $$("pager");
        var param: any;
        async function query() {
            param = {};
            param.reverse = false;
			dataQuery("announce/query", param, list, pager);
        }

        function create() {
            var params: FormDlgParams = {
                width: 1200,
                position: "center",
                title: "创建公告",
                elements: [
                    {
                        view: "layout", cols: [
                            { view: "text", id: "sid", label: "编号", labelAlign: "left", labelWidth: 80, width:250 },
                            { view: "label" },
                        ]
                    },
                    { view: "textarea", id: "content", label: "公告内容", labelAlign: "left", labelWidth: 80, height: 300 },
                ]
            };

            openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
                var param = <any>{};
                param.sid = $$("sid").getValue();
                param.content = $$("content").getValue();
                if (!param.sid || !param.content) {
                    alert("信息不完整，请检查");
                }
                try {
                    let r = await service.call("announce/create", param);
                    if (r) {
                        dlg.close()
                        query();
                    } else {
                        alert("发送失败");
                    }
                }
                catch (e) {
                    alert(e.message);
                }
            });

        }

        function exportCsv() {
            param.fn = "公告列表.csv";
            service.downloadFile("announce/exportCSV", param);
        }
    }
}

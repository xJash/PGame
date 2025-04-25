module rechange {
	

	export function rechargeQuery(root: webix.ui.layout, params: any) {

        var serverIDs: Array<number> = [];
		function getServerIDS(ids: Array<number>) {
			serverIDs = ids;
        }
		root.addView({
			type: "wide", padding: 2,
			id: "mainPage",
			rows: [
				{
					view: "layout", cols: [
						{ view: "label", label: "充值详情", css: "title" },
						{ view: "label" },
						{ view: "button", label: "导出", width: 100, click: exportCsv },
					]
				},
				{
					view: "layout", cols: [
						multiServerOptions(getServerIDS),
						{ view: "label" },
					]
				},
				{
					view: "layout", cols: [
						{ view: "text", id: "platform", label: "平台id", labelWidth: 70,  width: 150, value: params.platform },
						{ view: "text", id: "pid", label: "用户id", labelWidth: 70, labelAlign: "right", width: 150, value: params.pid },
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "startTime", align: "right", label: '时间范围', labelAlign: "right", labelWidth: 100, width: 280, timepicker: true },
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "endTime", align: "right", label: '~', labelAlign: "right", labelWidth:20, width: 200, timepicker: true },
						//{ view: "combo", width: 150, labelWidth: 80, id: "sort", label: "排序", labelAlign: "right", options: [{ id: "time", value: "时间" }, { id: "money", value: "金额" }, { id: "sid", value: "区服" }], value:"time" },
						{ view: "label" },
                        { view: "button", id: "refreshBtn", label: "查询", width: 100, click: query },
                        { view: "button", id: "create", label: "假冲", width: 100, click: create },
					]
				},
				{
					view: "datatable",
					id: "list",
					select: true,
					resizeColumn: true,
					scroll: "y",
					columns: [
						{ id: "sid", header: "区服", width: 120, sort: "int" },
						{ id: "pid", header: "用户ID", width: 120, sort: "int" },
						{ id: "platform", header: "平台ID", width: 120, sort: "int" },
						{ id: "orderid", header: "订单ID", width: 180, sort: "int" },
						{ id: "money", header: "充值金额", width: 120, sort: "string" },
						{ id: "adddiamond", header: "充值钻石", width: 120, sort: "int" },
						{ id: "state", header: "充值状态", width: 120, sort: "string" },
						{ id: "time", header: "充值时间", width: 180, sort: "date" },
					],
					data: [],
				},
				definePager(100)
			]
        });
        if ((service.userType == UserType.发行人员)) {
            $$('create').hide();
        }
		let pager = $$('pager');
		let list = $$('list');
		var param: any;
		async function query() {
			param = {};
			param.pid = $$("pid").getValue();
			param.sids = serverIDs.join(',');
			param.platform = $$("platform").getValue();
			param.startTime = $$("startTime").getValue();
			param.endTime = $$("endTime").getValue();
			//param.reverse = true;

			if (param.sidMin > param.sidMax) {
				alert("服务器范围不正确")
			}
		
			dataQuery("recharge/queryRechargeAsync", param, list, pager);
		}

		function exportCsv() {
			param.fn = "充值列表.csv";
			service.downloadFile("recharge/exportRechargeAsync", param);
		}

		function create() {
			var params: FormDlgParams = {
				width: 1200,
				position: "center",
				title: "假充值",
				elements: [
					{
						view: "layout", cols: [
							{ view: "combo", id: "createSid", label: "服务器id", options: serverids(), width: 200 },
                            { view: "text", id: "createPid", label: "玩家ID", width: 200, labelAlign: "right", },
                            {
                                view: "combo", id: "goodsid", label: "充值档", width: 200, labelAlign: "right", options: {
                                    body: {
                                        //suggest: {
                                            filter: service.filterItem,
                                            data: datas._recharges,
                                        //},
                                        on: {
                                            'onItemClick': function (id) {
                                                var item = this.getItem(id);
                                                if (item) {
                                                    console.log("Clicked: " + this.getItem(id).value);
                                                    $$("createMoney").setValue(item.price);
                                                    $$("createDiamond").setValue(item.diamonds);
                                                }
                                                else {
                                                    webix.message("select nothing");
                                                }
                                            }
                                        },
                                    }
                                }
                            },
                            { view: "text", id: "createMoney", label: "金钱", width: 200, labelAlign: "right", },
							{ view: "text", id: "createDiamond", label: "钻石", width: 200, labelAlign: "right",},
						]
					},
				]
			};

            //var item = $$("goodsid");
            //item.attachEvent("onChange", function (newv, oldv) {
            //    webix.message("Value changed from: " + oldv + " to: " + newv);
            //});

			openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
				var param = <any>{};
				param.sid = $$("createSid").getValue();
                param.pid = $$("createPid").getValue();
                param.goodsid = $$("goodsid").getValue();
                param.money = $$("createMoney").getValue();
                param.diamond = $$("createDiamond").getValue();
                var goodsidItem = $$("goodsid");
                if (!param.sid || !param.pid || !param.goodsid) {
                    alert("请填写必要的参数")
                    return;
                }
                try {
					let r = await service.call("fake_recharge/create", param);
					if (r) {
						query();
						dlg.close();
					} else {
						alert("充值失败");
					}
				}
				catch (e) {
					alert(e.message);
				}
			});

		}
	}

	export function fakeRrechargeQuery(root: webix.ui.layout, search: string) {
		root.addView({
			type: "wide", padding: 2,
			id: "mainPage",
			rows: [
				{
					view: "layout", cols: [
						{ view: "label", label: "假充统计", css: "title" },
						{ view: "label" },
						{ view: "button", label: "导出", width: 100, click: exportCsv },
					]
				},
			
				{
					view: "layout", cols: [
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "startTime", align: "right", label: '开始时间', labelAlign: "right", labelWidth: 70, width: 250, timepicker: true },
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "endTime", align: "right", label: '结束时间', labelAlign: "right", labelWidth: 70, width: 250, timepicker: true },
						{ view: "label" },
						{ view: "button", id: "refreshBtn", label: "查询", width: 100, click: query },
					]
				},
				{
					view: "datatable",
					id: "list",
					select: true,
					resizeColumn: true,
					scroll: "y",
					columns: [
						{ id: "sid", header: "区服", width: 120, sort: "int" },
						{ id: "pid", header: "用户ID", width: 120, sort: "int" },
						{ id: "orderid", header: "订单ID", width: 250, sort: "int" },
						{ id: "money", header: "充值金额", width: 120, sort: "string" },
						{ id: "adddiamond", header: "充值钻石", width: 120, sort: "int" },
						{ id: "state", header: "充值状态", width: 120, sort: "string" },
						{ id: "tieme", header: "充值时间", width: 120, sort: "date" },
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
			param.startTime = $$("startTime").getValue();
			param.endTime = $$("endTime").getValue();
			param.reverse = true;

			var pager = $$("pager");
			list.clearAll();
			list.showOverlay("Querying...");
			try {
				/*var count = await service.call("fake_recharge/count", param);
				pager.define("count", count);
				pager.define("page", 0);
				pager.$master = { refresh: setPage };
				pager.refresh();*/
			}
			catch (e) {
				alert(e.message);
			}

			async function setPage() {
				param.start = pager.data.page * pager.data.size;
				param.count = pager.data.size;
				list.clearAll();
				list.showOverlay("Loading...");
				try {
					/*var r = await service.call("fake_recharge/get", param);
					list.hideOverlay();
					list.parse(r);
					
					*/
				}
				catch (e) {
					alert(e.message);
				}
			}
			list.hideOverlay();

			setPage();
		}

		function exportCsv() {
			param.fn = "假充值列表.csv";
			service.downloadFile("fake_recharge/exportCSV", param);
		}
	}
}
module retention {
	export function queryRetention(root: webix.ui.layout, params: any) {
		function select() {
			let r = $$("selectSid").getValue();
			if (!r) return;
			let sids = splitToArr($$("createSid").getValue(), ",");
			for (let i = 0; i < sids.length; i++) {
				if (sids[i] == r) {
					console.log(r);
					return;
				}
			}
			sids.push(r);
			sids.sort((a, b) => {
				return a - b;
			});

			$$("selectSid").setValue(0);
			$$("createSid").setValue(sids);
			$$("createSid").refresh();
		}

		root.addView({
			type: "wide", padding: 2,
			id: "mainPage",
			rows: [
				{ view: "label", label: "留存查询", css: "title" },
				{
					view: "layout", cols: [
						{ view: "text", id: "createSid", minWidth: 140, label: "服务器id" },
						{ view: "combo", id: "selectSid", options: serverids(), width: 140, on: { onChange: select } },
						{ view: "label" },
						{ view: "button", label: "导出", width: 100, click: exportCsv },
					]
				},
				{
					view: "layout", cols: [
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "startTime", align: "right", label: '时间范围', width: 280, timepicker: true },
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "endTime", align: "right", label: '~', labelAlign: "right", labelWidth: 20, width: 200, timepicker: true },
						{ view: "label" },
						{ view: "button", id: "refreshBtn", label: "查询", width: 100, click: query },
					]
				},
				{
					view: "datatable",
					id: "list",
					select: false,
					resizeColumn: true,
					scroll: "y",
					columns: [
						{ id: "sid", header: "区服", width: 120, sort: "int" },
						{ id: "operation", header: "操作", width: 180, sort: "string" },
						{ id: "number", header: "人数", width: 120, sort: "int", },
						{ id: "retention", header: "留存率", width: 120, sort: "int" },
						{ id: "outflow", header: "相对流失率", width: 120, sort: "int" },
						{ id: "time", header: "时间", width: 180, sort: "date" },
					],
					data: [],
				},
				definePager(100)
			]
		});

		let pager = $$('pager');
		let list = $$('list');
		var param: any;
		async function query() {
			param = {};
			let sids = splitToArr($$("createSid").getValue(), ",");
			param.sids = sids;
			param.startTime = $$("startTime").getValue();
			param.endTime = $$("endTime").getValue();
			param.reverse = true;

			var pager = $$("pager");
			list.clearAll();
			list.showOverlay("Querying...");
			try {
				var count = await service.call("retention/count", param);
				pager.define("count", count);
				pager.define("page", 0);
				pager.$master = { refresh: setPage };
				pager.refresh();
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
					var r = await service.call("retention/get", param);
					list.hideOverlay();
					list.parse(r);
				}
				catch (e) {
					alert(e.message);
				}
			}
			list.hideOverlay();

			setPage();
		}

		function exportCsv() {
			/*param.fn = "充值列表.csv";
			service.downloadFile("recharge/exportCSV", param);*/
		}


	}
}
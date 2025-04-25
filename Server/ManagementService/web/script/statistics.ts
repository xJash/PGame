module statistics {

	//留存统计
	export function lcStatistics(root: webix.ui.layout, params: any) {

		var ClickEvents = {
			create: function (e, id, trg) {
				//create(e, id, trg);
			}
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
						{ view: "label", label: "留存统计", css: "title" },
						{ view: "label" },
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
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "startTime", align: "right", label: '开始时间', labelWidth: 70, width: 250, timepicker: true, stringResult: true },
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "endTime", align: "right", label: '结束时间', labelAlign: "right", labelWidth: 70, width: 250, timepicker: true, stringResult: true },
						{ view: "label" },
						{ view: "button", id: "refreshBtn", label: "查询", width: 100, click: query},
						{ view: "button", label: "导出", width: 100, click: exportCsv },
					]
				},

				{
					view: "datatable",
					id: "list",
					select: false,
					resizeColumn: true,
					scroll: "xy",
					columns: [
						{ id: "server", header: "区服", width: 60, sort: "int" },
						{ id: "time", header: "时间", width: 100, template: formatDate, sort: "date" },
						{ id: "regUserCount", header: "注册用户", width: 80, sort: "int" },
						{ id: "activeUserCount", header: "登录用户", width: 80, sort: "int" },
						{ id: "rechargeUserCount", header: "充值人数", width: 80, sort: "int" },
						{ id: "rechargeCount", header: "充值次数", width: 80, sort: "int" },
						{ id: "rechargeAmount", header: "充值金额", width: 80, sort: "int" },
						{ id: "payRate", header: "付费率", width: 60, sort: "int" },
						{ id: "regArpu", header: "注册arpu", width: 70, sort: "int" },
						{ id: "activeArpu", header: "活跃arpu", width: 70, sort: "int" },
						{ id: "arppu", header: "arppu", width: 70, sort: "int" },
						{ id: "retain2", header: "次日留存", width: 70, sort: "int" },
						{ id: "retain3", header: "3日留存", width: 70, sort: "int" },
						{ id: "retain4", header: "4日留存", width: 70, sort: "int" },
						{ id: "retain5", header: "5日留存", width: 70, sort: "int" },
						{ id: "retain6", header: "6日留存", width: 70, sort: "int" },
						{ id: "retain7", header: "7日留存", width: 70, sort: "int" },
						{ id: "retain15", header: "15日留存", width: 70, sort: "int" },
						{ id: "retain30", header: "30日留存", width: 70, sort: "int" },

					],
					onClick: ClickEvents,
					data: []
				},
				definePager(30),
			]
		});

		var list = $$("list");
		var param: any = {};
		var pager = $$('pager');

		async function query() {
			param.sids = serverIDs.join(",");
			param.begin = $$("startTime").getValue();
			param.end = $$("endTime").getValue();
			if (!param.sids || !param.begin || !param.end) {
				alert("查询信息不完整，请检查~");
				return;
			}
			dataQuery("statistics/queryRetainAsync", param, list, pager);
		}

		function exportCsv() {
			param.fn = "留存列表.csv";
			service.downloadFile("statistics/exportRetainCSV", param);
		}
	}


	//在线统计
	export function onlineStatistics(root: webix.ui.layout, params: any) {

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
						{ view: "label", label: "在线统计", css: "title" },
						{ view: "label" },
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
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "startTime", align: "right", label: '开始时间', labelWidth: 70, width: 250, timepicker: true, stringResult: true},
						{ view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "endTime", align: "right", label: '结束时间', labelAlign: "right", labelWidth: 70, width: 250, timepicker: true, stringResult: true},
						{ view: "label" },
						{ view: "button", label: "查询", width: 100, click: query},
						{ view: "button", label: "导出", width: 100, click: exportCsv},
					]
				},
				{
					view: "scrollview", scroll: "xy",  body: {
						rows: [
							{
								view: "layout",
								id: "chatGroup",
								rows: []
							}
						]
					}
				}
			]
		});
		var chatGroup = $$("chatGroup");
		var charIndex = 0;
		let param: any = {};

		async function query() {
			param.sids = serverIDs.join(",");
			param.begin = $$("startTime").getValue();
			param.end = $$("endTime").getValue();
			if (!param.sids || getMS(param.end) < getMS(param.begin)) {
				alert("格式错误，请检查~")
				return
			}
			try {
				let r = await service.call('statistics/queryOnlineAsync', param);
				if (r) {
					parseResult(r);
				} else {
					alert('该时间段没有玩家登陆');
				}
			}
			catch (e) {
				alert(e.message);
			}
		}

		function getMS(time: string):number {
			return new Date(time).getTime();
		}
		
		function parseResult(r: any) {
			let server: Array<{ server: number,serverName:string, time: Array<{ key: number, counts: Array<number> }> }> = [];
			let parseTime = (timeData: Array<{ key: number, counts: Array<number> }>,rData:any) => {
				for (let i = 0; i < timeData.length; i++) {
					if (timeData[i].key == rData.time) {
						return
					}
				}
				timeData.push({
					key: rData.time,
					counts: rData.counts
				})
			}
			let parseServer = (rData:any) => {
				for (let i = 0; i < server.length; i++) {
					let serverData = server[i];
					if (serverData.server == rData.sid) {
						parseTime(serverData.time, rData);
						return;
					}
				}
				server.push({
					server: rData.sid,
					time: [],
					serverName: rData.server
				});
				parseServer(rData);
			}
			for (let i in r) {
				if (r.hasOwnProperty(i)) {
					parseServer(r[i])
				}
			}
			//删除表
			for (let i = 0; i <= charIndex; i++) {
				if ($$(`chart${i}`)) {
					chatGroup.removeView(`chart${i}`);
				}
			}
			charIndex = 0;
			//创建表
		
			for (let i = 0; i < server.length; i++) {
				let serverData = server[i];
				let data = [];
				let timeKeys = [];
				let hour = 0;
				let max = 0;
				for (let j = 0; j < 96; j++) {
					let _data = {};
					let ban = j % 4 !== 0;
					let x: string = "" + hour;
					if (hour < 10) x = "0" + hour;
					if (ban) {
						x += ":"
					} else {
						x += ":00"
						hour++;
					}
					_data['x'] = x;
					_data['id'] = j;
					timeKeys = [];
					for (let k = 0; k < serverData.time.length; k++){
						let timeData = serverData.time[k];
						timeKeys.push(timeData.key);
						_data[`time${k}`] = timeData.counts[j];
						max = Math.max(max, timeData.counts[j]);
					}
					data.push(_data);
				}
				createChart(data, serverData.serverName, timeKeys,max);
			}
		}

		function createChart(data: any[],title:string,timeKeys:any[],max:number) {
			let start = 0;
			let end = 0;
			let step = 0;
			end = Math.ceil(max / 10) * 10;
			step = end / 10;
			let series = [];
			let legend = {
				values:[],
				align: "right",
				valign: "middle",
				layout: "y",
				width: 200,
				margin: 8,
				marker: {
					type: "item",
					width: 18
				}
			};
			for (let i = 0; i < timeKeys.length; i++) {
				let color = '#' + Math.floor(Math.random() * 0xffffff).toString(16);
				series.push({
					value: `#time${i}#`,
					item: {
						borderColor: color,
						color: "#ffffff",
						type: ["", "s", "t"][i % 3],
						radius: 3
					},
					line: {
						color: color,
						width: 2
					},
					template: `#time${i}#`,
					tooltip: {
						template: `#time${i}#` 
					}
				})
				legend.values.push({ text: timeKeys[i] });
			};
			chatGroup.addView(
				{
					view: "layout",
					border: true,
					minHeight: 700,
					minWidth: 1200,
					id: `chart${charIndex}`,
					rows: [
						{ view: "label", align: "center", template: `<div class='title'>${title}</div>`},
						{
							view: "chart",
							type: "line",
							borderless: true,
							series: series,
							legend: legend,
							xAxis: {
								title: "时间/时",
								template: function (obj) {
									let pan = obj.x.split(":")[1] == "00";
									return pan ? obj.x.split(":")[0] : ""
								}
							},
							offset: 0,
							yAxis: {
								start: start,
								end: end,
								step: step,
								title: "人数/个",
								template: function (obj) {
									return (obj % (step * 2) ? "" : obj)
								}
							},
							data: data
						}
					]
				}
			)
			charIndex++;
		}

		function exportCsv() {
			param.fn = "在线列表.csv";
			service.downloadFile("statistics/exportOnlineCSV", param);
		}
	}


	//等级统计
	export function levelStatistics(root: webix.ui.layout, parms: any) {
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
						{ view: "label", label: "等级统计", css: "title" },
						{ view: "label" },
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
						{ view: "text", id: "minLevel", label: "等级范围", labelWidth: 80, width: 140 },
						{ view: "text", id: "maxLevel", label: "-", labelWidth: 14, width: 80 },
						{ view: "text", id: "changeLevel", label: "等级间隔", labelWidth: 80, labelAlign: "right", width: 140 },
						{ view: "label" },
						{ view: "button", label: "查询", width: 100,click: query },
						{ view: "button", id: "totalBtn", label: "总计", width: 100, click: typeHandel },
						{ view: "button", label: "导出", width: 100, click: exportCsv },
					]
				},
				{
					view: "scrollview", scroll: "xy", body: {
						rows: [
							{
								view: "layout",
								id: "chatGroup",
								rows: []
							}
						]
					}
				},
			]
		});

		let parpms: any = {};
		let totalData: any = {};
		let normalData: any = [];
		var chatGroup = $$("chatGroup");
		var charIndex = 0;
		var total: boolean = true;

		async function query() {
			parpms.sids = serverIDs.join(",");
			parpms.minLv = $$('minLevel').getValue() || 1;
			parpms.maxLv = $$('maxLevel').getValue();
			let maxChange = Number(parpms.maxLv) - Number(parpms.minLv);
			let changeLv = Number($$('changeLevel').getValue());
			if (!maxChange || maxChange < 0 || changeLv > maxChange) {
				alert('查询信息不正确，请检查');
				return;
			}

			try {
				let r = await service.call('statistics/queryPlayerLvAsync', parpms);
				parseResult(r);
			} catch (e) {
				alert(e.message);
			}
		}


		function parseResult(r: any) {
			totalData = [];
			normalData = [];
			total = true;
			let minlv = Number($$('minLevel').getValue());
			let maxLv = Number($$('maxLevel').getValue());
			let changeLv = Number($$('changeLevel').getValue()) || 1;
			let parseNormal = () => {
				for (let i in r) {
					if ((<Object>r).hasOwnProperty(i)) {
						let rData = r[i];
						let data = [];
						let max = 0;
						let id = 1;
						for (let j = minlv; j < maxLv + changeLv; j = j + changeLv) {
							let _data = {
								id: id,
								value: 0,
								x: `${j}`,
								min: j,
								max: j + changeLv
							};
							for (let k = 0; k < rData.result.length; k++) {
								let lvData = rData.result[k];
								if (lvData.level >= j && lvData.level < j + changeLv) {
									_data.value += lvData.count;
								}
							}
							max = Math.max(max, _data.value);
							data.push(_data);
							id++;
						}
						normalData.push({
							data: data,
							title: rData.server,
							max:max
						})
					}
				}
			}

			let parseTotal = () => {
				let data = [];
				let max = 0;
				let id = 1;
				for (let i = minlv; i < maxLv + changeLv; i = i + changeLv) {
					let _data = {
						id: id,
						value: 0,
						x: `${i}`,
						min: i,
						max: i + changeLv
					};
					for (let j in r) {
						if ((<Object>r).hasOwnProperty(j)) {
							let rData = r[j];
							for (let k = 0; k < rData.result.length; k++) {
								let lvData = rData.result[k];
								if (lvData.level >= i && lvData.level < i + changeLv) {
									_data.value += lvData.count;
								}
							}
						}
					}
					max = Math.max(max, _data.value);
					data.push(_data);
					id++;
				}
				totalData = {
					data: data,
					title: '总计',
					max: max
				}
			}

			parseNormal();
			parseTotal();
			typeHandel();
		}

		function typeHandel() {
			//删除
			for (let i = 0; i <= charIndex; i++) {
				if ($$(`chart${i}`)) {
					chatGroup.removeView(`chart${i}`);
				}
			}
			charIndex = 0;
			total = !total;
			if (total) {
				createChart(totalData.data, totalData.title, totalData.max);
				$$('totalBtn').define("label", "分别");
			} else {
				for (let i = 0; i < normalData.length; i++) {
					createChart(normalData[i].data, normalData[i].title, normalData[i].max);
				}
				$$('totalBtn').define("label", "总计");
			}
			$$('totalBtn').refresh()
		}

		function createChart(data: any[], title: string, max: number) {
			let start = 0;
			let end = 0;
			let step = 0;
			end = Math.ceil(max / 10) * 10;
			step = end / 10;
			
			chatGroup.addView(
				{
					view: "layout",
					height: 900,
					width: 1600,
					id: `chart${charIndex}`,
					rows: [
						{ view: "label", align: "center", template: `<div class='title'>${title}</div>` },
						{
							view: "chart",
							type: "bar",
							width: 1200,
							height: 800,
							borderless: true,
							value: '#value#',
							label: '#value#',
							xAxis: {
								title: "等级/级",
								template: '#x#'
							},
							yAxis: {
								start: start,
								end: end,
								step: step,
								title: "人数/个",
								template: function (obj) {
									return (obj % (step * 2) ? "" : obj)
								}
							},
							data: data
						}
					]
				}
			)
			charIndex++;
		}

		function exportCsv() {
			parpms.fn = "等级列表.csv";
			service.downloadFile("statistics/exportPlayerLvAsync", parpms);
		}
    }	

    //玩家人数统计
    export function serverPlayerCountStatistics(root: webix.ui.layout, parms: any) {
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
                        { view: "label", label: "区服玩家人数统计", css: "title" },
                        { view: "label" },
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
                        { view: "text", id: "minLv", label: "最低等级", labelWidth: 100, width: 200, labelAlign: "left", },
                        { view: "text", id: "maxLv", label: "最高等级", labelWidth: 100, width: 200, labelAlign: "left", },
                        { view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "startTime", align: "right", label: '创角开始时间', labelWidth: 100, width: 280, timepicker: true, stringResult: true },
                        { view: "datepicker", format: "%Y-%m-%d %H:%i:%s", id: "endTime", align: "right", label: '创角结束时间', labelAlign: "right", labelWidth: 100, width: 280, timepicker: true, stringResult: true },
                        { view: "label" },
                        { view: "button", id: "refreshBtn", label: "查询", width: 100, click: queryServerPlayerCount },
                        { view: "button", label: "导出", width: 100, click: exportServerPlayerCount },
                    ]
                },

                {
                    view: "datatable",
                    id: "list",
                    select: false,
                    resizeColumn: true,
                    scroll: "xy",
                    columns: [
                        { id: "sid", header: "sid", width: 60, sort: "int" },
                        { id: "server", header: "name", width: 60, sort: "int" },
                        { id: "count", header: "玩家数", width: 80, sort: "int" },
                    ],
                },
                definePager(30),
            ]
        });

        var list = $$("list");
        var param: any = {};
        var pager = $$('pager');

        async function queryServerPlayerCount() {
            if (serverIDs.length == 0) {
                alert("请选择要查询的服");
                return;
            }
            param.sids = serverIDs.join(",");
            param.minLv = $$("minLv").getValue();
            param.maxLv = $$("maxLv").getValue();
            param.begin = $$("startTime").getValue();
            param.end = $$("endTime").getValue();
            if (!param.sids) {
                alert("请选择要查询的服");
                return;
            }
            dataQuery("statistics/queryServerPlayerCount", param, list, pager);
        }

        function exportServerPlayerCount() {
            if (serverIDs.length == 0) {
                alert("请选择要查询的服");
                return;
            }
            param = {};
            param.sids = serverIDs.join(",");
            if (!param.sids) {
                alert("请选择要查询的服");
                return;
            }
            param.minLv = $$("minLv").getValue();
            param.maxLv = $$("maxLv").getValue();
            param.begin = $$("startTime").getValue();
            param.end = $$("endTime").getValue();
            param.fn = "区服玩家人数.csv";
            service.downloadFile("statistics/exportServerPlayerCount", param);
        }
    }
}
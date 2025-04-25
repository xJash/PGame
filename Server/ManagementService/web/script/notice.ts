module notice {


  export function noticeSearch(root: webix.ui.layout, params: any) {
    function show(node, v) {
      if ($$("detailpopup"))
        $$("detailpopup").close();
      var popup = webix.ui({
        view: "popup",
        id: "detailpopup",
        body: {
          view: "textarea",
          height: 400,
          value: JSON.stringify(v, null, 4)
        }
      }).show(node);
    }
    var ClickEvents = {
      detailButton: function (e, id, trg) {
        var item = list.getItem(id);
        show(list.getItemNode(id), item.content);
      },

      //deleate: async function (e, id, trg) {
      //	var item = list.getItem(id);
      //	deleate(item.id, item.sid);
      //},
      deleate: deleate,
    };


    var serverIDs: Array < number > = [];

    function getServerIDS(ids: Array < number > ) {
      serverIDs = ids;
    }

    root.addView({
      type: "wide",
      padding: 2,
      id: "mainPage",
      rows: [

        {
          view: "label",
          label: "走马灯查询",
          css: "title"
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
              view: "combo",
              id: 'query_state',
              label: '状态:',
              yCount: "5",
              width: 180,
              options: [
                {
                  id: 0,
                  value: "New"
                },
                {
                  id: 1,
                  value: "Modified"
                },
                {
                  id: 2,
                  value: "Started"
                },
                {
                  id: 3,
                  value: "Ended"
                }
                            ]
                        },
            {
              view: "text",
              id: "query_type",
              label: "类型分组:",
              width: 150,
              suggest: {
                filter: function (item, value) {
                  return true;
                },
                data: [
                  {
                    id: 1000,
                    value: "1000"
                  },
                  {
                    id: 1001,
                    value: "1001"
                  },
                  {
                    id: 1002,
                    value: "1002"
                  },
                  {
                    id: 1003,
                    value: "1003"
                  },
                  {
                    id: 1004,
                    value: "1004"
                  },
                  {
                    id: 1005,
                    value: "1005"
                  },
                  {
                    id: 1006,
                    value: "1006"
                  },
                  {
                    id: 1007,
                    value: "1007"
                  },
                  {
                    id: 1008,
                    value: "1008"
                  },
                  {
                    id: 1009,
                    value: "1009"
                  },
                                ]
              }
                        },
            {
              view: "datepicker",
              format: "%Y-%m-%d %H:%i:%s",
              id: "beginTime",
              align: "right",
              label: '时间范围',
              labelAlign: "left",
              labelWidth: 100,
              width: 280,
              timepicker: true,
              stringResult: true
            },
            {
              view: "datepicker",
              format: "%Y-%m-%d %H:%i:%s",
              id: "endTime",
              align: "right",
              label: '~',
              labelAlign: "right",
              labelWidth: 20,
              width: 200,
              timepicker: true,
              stringResult: true
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
            {
              view: "button",
              id: "createBtn",
              label: "创建",
              width: 100,
              click: cretate
            },
            {
              view: "button",
              id: "deleateBtn",
              label: "全部删除",
              width: 100,
              click: deleteAllNotice
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
              id: "sid",
              header: "区服",
              width: 70,
              sort: "int"
            },
            {
              id: "type",
              header: "通知类型",
              width: 120,
              sort: "int"
            },
            {
              id: "beginTime",
              header: "开始时间",
              width: 250,
              sort: "date",
            },
            {
              id: "endTime",
              header: "结束时间",
              width: 250,
              sort: "date"
            },
            {
              id: "duration",
              header: "播放间隔",
              width: 80,
              sort: "int"
            },
            {
              id: "content",
              header: "文本内容",
              width: 80,
              template: format(),
            },
            {
              id: "loop",
              header: "播放次数",
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
              id: "deleate",
              header: "删除",
              width: 60,
              template: "<button class='deleate'>删除</button>"
            },
					],
          onClick: ClickEvents,
				},

				definePager(30),
			],
    })

    function format() {

      return function formatResult(t, c, v) {

        if (!v)
          return "";

        if (v.length > 16 && (v[0] == '[' || v[0] == '{')) {
          return `<button class="detailButton">详细</button>`;
        } else
          return v;
      }
    }


    let list = $$('list');
    let pager = $$("pager");
    var param: any;
    let datas: Array < any > = [];

    async function query() {
      param = {};
      //param.sid = serverIDs[0]||1;
      param.sids = serverIDs.join(',');
      param.type = $$("query_type").getValue();
      param.state = $$('query_state').getValue();
      if (param.state > 3)
        param.state = 0;
      param.beginTime = $$("beginTime").getValue();
      param.endTime = $$("endTime").getValue();
      //dataQuery("notice/get", param, list, pager);
      dataQuery("notice/getNotice", param, list, pager);
    }


    function exportCsv() {
      param.fn = "走马灯列表.csv";
      service.downloadFile("notice/exportCSV", param);
    }

    function cretate() {
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
      var params: FormDlgParams = {
        width: 1200,
        position: "center",
        title: "走马灯创建",
        elements: [
          {
            view: "layout",
            cols: [
							//{ view: "text", id: "createSid", minWidth: 140, label: "服务器id" },
							//{ view: "combo", id: "selectSid", options: serverids(), width: 140, on: { onChange: select } },
                            multiServerOptions(getServerIDS, "create"),
              {
                view: "label"
              }
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
                width: 250,
                timepicker: true,
                stringResult: true
              },
              {
                view: "datepicker",
                format: "%Y-%m-%d %H:%i:%s",
                id: "end",
                align: "right",
                label: '结束时间',
                labelWidth: 70,
                width: 250,
                timepicker: true,
                stringResult: true
              },
              {
                view: "counter",
                id: "loop",
                label: "播放次数:",
                min: "-1",
                labelAlign: "left",
                value: 1,
                width: 200,
              },
              {
                view: "counter",
                id: "duration",
                label: "播放时间间隔(s):",
                labelAlign: "left",
                value: 30,
                labelWidth: 120
              },
                            //{ view: "counter", id: "type", label: "通知类型", labelAlign: "left", value: 0, width: 200 },
              {
                view: "text",
                id: "type",
                label: "类型分组:",
                width: 150,
                suggest: {
                  filter: function (item, value) {
                    return true;
                  },
                  data: [
                    {
                      id: 1000,
                      value: "1000"
                    },
                    {
                      id: 1001,
                      value: "1001"
                    },
                    {
                      id: 1002,
                      value: "1002"
                    },
                    {
                      id: 1003,
                      value: "1003"
                    },
                    {
                      id: 1004,
                      value: "1004"
                    },
                    {
                      id: 1005,
                      value: "1005"
                    },
                    {
                      id: 1006,
                      value: "1006"
                    },
                    {
                      id: 1007,
                      value: "1007"
                    },
                    {
                      id: 1008,
                      value: "1008"
                    },
                    {
                      id: 1009,
                      value: "1009"
                    },
                                    ]
                }
                            }
						]
					},
          {
            view: "textarea",
            id: "content",
            label: "通知内容",
            labelAlign: "left",
            height: 200
          },
				]
      };

      openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
        var param = < any > {};

        param.beginTime = $$("start").getValue();
        param.endTime = $$("end").getValue();
        param.content = $$('content').getValue();
        param.loop = $$('loop').getValue();
        param.duration = $$('duration').getValue();
        param.type = $$('type').getValue();
        param.sids = serverIDs.join(",");
        //let sids = splitToArr($$("createSid").getValue(), ",");
        //if (!param.beginTime || !param.endTime || !param.duration || !param.loop || !param.content || sids.length <= 0) {
        if (!param.beginTime || !param.endTime || !param.duration || !param.loop || !param.content || serverIDs.length <= 0) {
          alert("信息不完整");
          return;
        }
        try {
          let r = true;
          r = await service.call("/notice/addNotice", param);
          if (r) {
            dlg.close();
          } else {
            alert("发送失败");
          }
          //let r = true;
          //for (let i = 0; i < sids.length; i++) {
          //	param.sid = sids[i];
          //	console.log(param.sid);
          //	r = await service.call("notice/add", param);
          //}
          //if (r) {
          //	dlg.close();
          //} else {
          //	alert("发送失败");
          //}
        } catch (e) {
          alert(e.message);
        }
      });
    }

    //async function deleate(id, sid) {
    //    var param = <any>{};
    //    param.id = id;
    //    param.sid = sid;
    //    try {
    //        //let r = await service.call("activity/delete", param);
    //        //if (r) {
    //        //	query();
    //        //}
    //    }
    //    catch (e) {
    //        alert(e.message);
    //    }
    //}
    async function deleate(e, id, trg) {
      var item = list.getItem(id);
      let serverIDs: Array < number > = [];

      function getServerIDS(ids: Array < number > ) {
        serverIDs = ids;
      }
      let useType: boolean = false;

      function selectHandle(ids: string) {
        useType = ids == "yes";
        $$(ids == "yes" ? "no" : "yes").setValue(0);
        $$(ids).setValue(1);
      }

      let params: FormDlgParams = {
        width: 400,
        position: "center",
        title: "删除",
        elements: [
          {
            view: "layout",
            cols: [
                            multiServerOptions(getServerIDS, "create", item.sid),
              {
                view: "label"
              },
                        ]
                    },
          {
            view: "layout",
            cols: [
              {
                view: "label",
                label: "是否按类型删除:",
                labelAlign: "left",
                width: 100,
                labelWidth: 0
              },
              {
                view: "checkbox",
                id: "yes",
                labelRight: "yes",
                label: "",
                value: 0,
                labelAlign: "right",
                labelWidth: 0,
                click: selectHandle,
                autoheight: true,
                width: 100
              },
              {
                view: "checkbox",
                id: "no",
                labelRight: "no",
                label: "",
                value: 1,
                labelAlign: "right",
                labelWidth: 0,
                click: selectHandle,
                autoheight: true,
                width: 100
              },
              {
                view: "label"
              },
                        ]
                    }
                ]
      };

      openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
        let param = < any > {};
        try {
          let r;
          if (useType) {
            param.sids = serverIDs.join(",");
            param.type = item.type;
            r = await service.call("notice/deleteNoticeByType", param);
          } else {
            param.sid = item.sid;
            param.id = item.id;
            r = await service.call("notice/deleteNotice", param);
          }
          if (r) {
            query();
            dlg.close();
          }
        } catch (e) {
          alert(e.message);
        }
      });
    }


    async function deleateAll() {
      if (datas.length <= 0) return;
      //for (let i = 0; i < datas.length; i++) {
      //	if (Number(datas[i].state) == 1) {
      //		alert('有活动正在进行，无法删除，请重新检查');
      //		return
      //	}
      //}
      try {
        //for (let i = 0; i < datas.length; i++) {
        //	let data = datas[i];
        //	await deleate(data.id, data.sid);
        //}
        var param = {};
        var r = await service.call("/notice/deleteAllNotice", param);
      } catch (e) {
        alert(e.message);
      }
    }

    async function deleteAllNotice() {
      let serverIDs: Array < number > = [];

      function getServerIDS(ids: Array < number > ) {
        serverIDs = ids;
      }

      let params: FormDlgParams = {
        width: 400,
        position: "center",
        title: "全部删除",
        elements: [
          {
            view: "layout",
            cols: [
                            multiServerOptions(getServerIDS, "create"),
              {
                view: "label"
              },
                        ]
                    },
                ]
      };

      openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
        let param = < any > {};
        try {
          let r;
          param.sids = serverIDs.join(",");
          r = await service.call("notice/deleteAllNotice", param);
          if (r) {
            query();
            dlg.close();
          }
        } catch (e) {
          alert(e.message);
        }
      });
    }
  }
}

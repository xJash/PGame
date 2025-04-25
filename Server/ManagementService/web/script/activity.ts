module activity {
  export function activityQuery(root: webix.ui.layout, params: any) {
    var ClickEvents = {
      modify: modify,
      deleate: deleate
    };

    let serverIDs: Array < number > = [];

    function getServerIDS(ids: Array < number > ) {
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
              label: "活动管理",
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
                        multiServerOptions(getServerIDS),
            {
              view: "label"
            },

                    ]
                },
        {
          view: "layout",
          cols: [

                        //{ view: "text", id: "type", label: "活动类型", width: 200, labelAlign: "left", },
            {
              view: "combo",
              id: "type",
              label: "活动类型",
              width: 250,
              labelAlign: "left",
              suggest: {
                filter: service.filterItem,
                data: datas._activities,
              }
                        },
            {
              view: "text",
              id: "name",
              label: "活动名称",
              width: 200,
              labelAlign: "right",
            },
                        //{ view: "text", id: "state", label: "活动状态", width: 200, labelAlign: "right", },
            {
              view: "combo",
              id: "state",
              label: "活动状态",
              width: 200,
              labelAlign: "right",
              suggest: {
                filter: service.filterItem,
                data: [
                  {
                    id: 0,
                    value: "0:新增加"
                  },
                  {
                    id: 1,
                    value: "1:进行中"
                  },
                  {
                    id: 2,
                    value: "2:已结束"
                  },
                                ],
              }
                        },
            {
              view: "label"
            },
            {
              view: "button",
              id: "queryBtn",
              label: "查询",
              width: 100,
              click: query
            },
            {
              view: "button",
              id: "createBtn",
              label: "创建",
              width: 100,
              click: create
            },
            {
              view: "button",
              label: "导出",
              width: 100,
              click: exportCsv
            },
            {
              view: "button",
              id: "deleateBtn",
              label: "批量删除",
              width: 100,
              click: deleateAll
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
              id: "sid",
              header: "区服",
              width: 80,
              sort: "int"
            },
            {
              id: "p0",
              header: "p0",
              width: 80,
              sort: "int"
            },
            {
              id: "sort",
              header: "sort",
              width: 80,
              sort: "int"
            },
            {
              id: "type",
              header: "活动类型",
              width: 80,
              sort: "int"
            },
            {
              id: "name",
              header: "活动名称",
              width: 150,
              sort: "string"
            },
            {
              id: "start",
              header: "开始时间",
              width: 150,
              sort: "date"
            },
            {
              id: "end",
              header: "结束时间",
              width: 150,
              sort: "date"
            },
            {
              id: "state",
              header: "活动状态",
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
                    ],
          onClick: ClickEvents,
          data: [],
                },
                definePager(30)
            ]
    });

    let pager = $$('pager');
    let list = $$('list');
    let param: any
    //let datas: Array<any> = [];

    //活动查询
    async function query() {
      if (serverIDs.length == 0) {
        alert("请选择要查询的服");
        return;
      }
      param = {};
      param.state = $$("state").getValue();
      param.sids = serverIDs.join(",");
      param.type = $$("type").getValue();
      param.name = $$("name").getValue();
      if (param.state > 2)
        param.state = 0;
      if (!param.sids) {
        alert("请选择要查询的服");
        return;
      }
      param.reverse = true;
      dataQuery("activity/getActivityAsync", param, list, pager, function (r) {
        for (let i in r) {
          r[i].deleate = "删除"
          r[i].modify = "修改"
        };
      });
    }

    //活动创建
    async function create() {
      let serverIDs: Array < number > = [];

      function getServerIDS(ids: Array < number > ) {
        serverIDs = ids;
      }

      let params: FormDlgParams = {
        width: 1500,
        position: "center",
        title: "活动创建",
        elements: [
          {
            view: "layout",
            cols: [
                            multiServerOptions(getServerIDS, "create", "所在区服", 0, 20),
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
                id: "createType",
                label: "类型(必填)",
                labelWidth: 100,
                width: 250,
                labelAlign: "left",
                options: {
                  body: {
                    //suggest: {
                    filter: service.filterItem,
                    data: datas._activities,
                    //},
                    on: {
                      'onItemClick': function (id) {
                        var item = this.getItem(id);
                        if (item) {
                          console.log("Clicked: " + this.getItem(id).value);
                          $$("createName").setValue(item.name);
                        } else {
                          webix.message("select nothing");
                        }
                      }
                    },
                  }
                }
                            },
              {
                view: "text",
                id: "createName",
                label: "活动名(必填)",
                labelWidth: 100,
                width: 250,
                labelAlign: "right",
              },
                            //{ view: "text", id: "createType", label: "type", width: 150, labelAlign: "right", },
                            //{
                            //    view: "combo", id: "createType", label: "类型(必填)", width: 250, labelAlign: "right", suggest: {
                            //        filter: service.filterItem,
                            //        data: datas._activities,
                            //    }
                            //},
              {
                view: "text",
                id: "createP0",
                label: "p0",
                width: 150,
                labelAlign: "right",
              },
              {
                view: "text",
                id: "createSort",
                label: "sort",
                width: 150,
                labelAlign: "right",
              },
                        ]
                    },
          {
            view: "layout",
            cols: [
              {
                view: "datepicker",
                format: "%Y-%m-%d %H:%i:%s",
                id: "createStart",
                align: "right",
                label: '开始时间(必填)',
                labelWidth: 100,
                width: 300,
                timepicker: true,
                stringResult: true
              },
              {
                view: "datepicker",
                format: "%Y-%m-%d %H:%i:%s",
                id: "createEnd",
                align: "right",
                label: '结束时间(必填)',
                labelWidth: 100,
                width: 300,
                timepicker: true,
                stringResult: true
              },
              {
                view: "label",
                id: "createFileName",
                align: "right",
                width: 200
              },
              {
                view: "button",
                label: "上传文件",
                width: 100,
                click: upload
              },
                        ]
                    }
                ]
      };

      openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
        if (serverIDs.length == 0) {
          alert("请选择目标服");
          return;
        }
        var param = < any > {};
        param.sort = $$("createSort").getValue() || 1;
        param.p0 = $$("createP0").getValue() || 0;
        param.name = $$("createName").getValue();
        param.startTime = $$("createStart").getValue();
        param.endTime = $$("createEnd").getValue();
        param.type = $$("createType").getValue() || 0;

        if (!param.name || !param.startTime || !param.endTime || serverIDs.length <= 0) {
          alert("信息不完整，请检查");
          return
        }
        if (!file) {
          alert("no file");
          return
        }

        try {
          //for (let i = 0; i < serverIDs.length; i++) {
          //    param.sid = serverIDs[i];
          //    await service.uploadFileWithParamsAsync("activity/addActivityAsync", file, param);
          //}
          param.sids = serverIDs.join(",");
          await service.uploadFileWithParamsAsync("activity/addActivityBatchAsync", file, param);
          dlg.close();
          query();
        } catch (e) {
          alert(e.message);
        }

        //try {
        //	if (file) {
        //		await service.uploadFile("activity/uploadEventReward", file, serverIDs);
        //	}
        //	for (let i = 0; i < serverIDs.length; i++) {
        //		param.sid = serverIDs[i];
        //		await service.call("activity/add", param);
        //	}
        //	dlg.close();
        //	query();
        //}
        //catch (e) {
        //	alert(e.message);
        //}
      });

      var file;

      function upload() {
        getFile(f => {
          file = f;
          $$("createFileName").setValue(file.name);
        });
      }
    }

    //活动修改
    function modify(e, id, trg) {
      var item = list.getItem(id);
      let serverIDs: Array < number > = [];

      function getServerIDS(ids: Array < number > ) {
        serverIDs = ids;
      }

      var params: FormDlgParams = {
        width: 1500,
        position: "center",
        title: "活动修改",
        elements: [
          {
            view: "layout",
            cols: [
                            multiServerOptions(getServerIDS, "modify", item.sid, null, 15),
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
                value: item.start,
                id: "startTime",
                align: "right",
                label: '开始时间',
                labelWidth: 70,
                width: 250,
                timepicker: true,
                stringResult: true
              },
              {
                view: "datepicker",
                format: "%Y-%m-%d %H:%i:%s",
                value: item.end,
                id: "endTime",
                align: "right",
                label: '结束时间',
                labelAlign: "right",
                labelWidth: 70,
                width: 250,
                timepicker: true,
                stringResult: true
              },
                        ]
                    },
          {
            view: "layout",
            cols: [
              {
                view: "text",
                id: "sort",
                value: item.sort,
                label: "sort",
                labelWidth: 40,
                width: 160,
              },
              {
                view: "text",
                id: "p0",
                value: item.p0,
                label: "p0",
                labelWidth: 40,
                width: 160,
                labelAlign: "right",
              },
              {
                view: "text",
                id: "modifyName",
                value: item.name,
                label: "name",
                labelWidth: 80,
                width: 200,
                labelAlign: "right",
              },
              {
                view: "label",
                id: "modifyFileName",
                align: "right",
                width: 200
              },
              {
                view: "button",
                label: "上传文件",
                width: 100,
                click: upload
              },
                        ]
                    }
                ]
      };

      openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
        var param = < any > {};
        param.type = item.type; // 活动唯一标示符改为type 
        param.sort = $$("sort").getValue();
        param.p0 = $$("p0").getValue();
        param.name = $$("modifyName").getValue();
        param.startTime = $$("startTime").getValue();
        param.endTime = $$("endTime").getValue();
        try {
          param.sids = serverIDs.join(",");
          if (file) {
            await service.uploadFileWithParamsAsync("activity/modifyActivityByTypeBatchAsync",
              file,
              param);
          } else {
            await service.call("activity/modifyActivityByTypeBatchAsync", param);
          }
          //for (let i = 0; i < serverIDs.length; i++) {
          //	param.sid = serverIDs[i];
          //	await service.call("activity/modify", param);
          //}
          dlg.close()
          query();
        } catch (e) {
          alert(e.message);
        }
      });

      var file;

      function upload() {
        getFile(f => {
          file = f;
          $$("modifyFileName").setValue(file.name);
        });
      }
    }

    //活动删除
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
        width: 900,
        position: "center",
        title: "删除",
        elements: [
          {
            view: "layout",
            cols: [
                            multiServerOptions(getServerIDS, "create", item.sid, null, 15),
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
        param.sids = serverIDs.join(",");
        param.state = item.state;
        if (param.sids.length <= 0 || (typeof param.state) != "number") {
          alert("格式不对，请检查");
          return
        }
        try {
          let r;
          if (useType) {
            param.type = item.type;
            r = await service.call("activity/deleteActivityByTypeAndStateBatch", param);
          } else {
            param.sid = item.sid;
            param.id = item.id;
            r = await service.call("activity/delete", param);
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

    //批量删除
    async function deleateAll() {
      let serverIDs: Array < number > = [];

      function getServerIDS(ids: Array < number > ) {
        serverIDs = ids;
      }
      let state: number = 2;

      function selectHandle(ids: string) {
        for (let i = 0; i < 3; i++) {
          if ($$(`state${i}`)) {
            $$(`state${i}`).setValue(0);
          }
        }
        if ($$(ids)) {
          $$(ids).setValue(1);
          state = Number(ids.split("state")[1]);
        }
      }

      let params: FormDlgParams = {
        width: 800,
        position: "center",
        title: "批量删除",
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
          {
            view: "layout",
            cols: [
              {
                view: "label",
                label: "活动状态:",
                labelAlign: "left",
                width: 100,
                labelWidth: 0
              },
              {
                view: "checkbox",
                id: "state0",
                labelRight: "新增加(0)",
                label: "",
                value: 0,
                labelAlign: "right",
                labelWidth: 0,
                click: selectHandle,
                autoheight: true
              },
              {
                view: "checkbox",
                id: "state1",
                labelRight: "进行中(1)",
                label: "",
                value: 0,
                labelAlign: "right",
                labelWidth: 0,
                click: selectHandle,
                autoheight: true
              },
              {
                view: "checkbox",
                id: "state2",
                labelRight: "已结束(2)",
                label: "",
                value: 1,
                labelAlign: "right",
                labelWidth: 0,
                click: selectHandle,
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
        if (serverIDs.length == 0) {
          alert("请选择要应用的服");
          return;
        }
        let param = < any > {};
        param.sids = serverIDs.join(",");
        param.state = state;
        if (param.sids.length <= 0 || (typeof param.state) != "number") {
          alert("格式不对，请检查");
          return
        }
        try {
          let r = await service.call("activity/deleteActivityByStateBatch", param);
          if (r) {
            query();
            dlg.close();
          }
        } catch (e) {
          alert(e.message);
        }
      });
    }

    function exportCsv() {
      param.fn = "活动列表.csv";
      service.downloadFile("activity/exportCSV", param);
    }
  }
}

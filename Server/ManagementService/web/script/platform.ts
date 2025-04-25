module platform {
  export function app(root: webix.ui.layout, params: any) {

    var ClickEvents = {
      modify: modifyAppSetting,
      deleate: deleteAppSetting,
    };

    root.addView({
      type: "wide",
      padding: 2,
      width: "auto",
      id: "mainPage",
      rows: [
        {
          view: "layout",
          cols: [
            {
              view: "text",
              id: "serial",
              label: "包id",
              width: 300
            },
            {
              view: "text",
              id: "cname_1",
              label: "包名称",
              width: 300
            },
            {
              view: "combo",
              id: "ctag_1",
              label: "包类型",
              yCount: "5",
              width: 200,
              options: [
                {
                  id: 1,
                  value: "1:安卓",
                },
                {
                  id: 2,
                  value: "2:ios",
                }
                            ]
                        },
            {
              view: "combo",
              id: "type_1",
              label: "状态:",
              yCount: "5",
              width: 200,
              options: [
                {
                  id: 1,
                  value: "1:正常通过",
                },
                {
                  id: 2,
                  value: "2:强制更新",
                },
                {
                  id: 3,
                  value: "3:非强制更新",
                }
                            ]
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
              view: "label"
            },
            {
              view: "button",
              id: "queryBtn",
              label: "查询",
              width: 100,
              click: queryAppSetting,
              align: "right"
            },
            {
              view: "button",
              id: "createBtn",
              label: "创建",
              width: 100,
              click: addAppSetting,
              align: "right"
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
              header: "包ID",
              width: 80,
              sort: "int"
            },
            {
              id: "cname",
              header: "包名称",
              width: 150,
              sort: "string"
            },
            {
              id: "ctag",
              header: "包类型(android:1/ios:2)",
              width: 200,
              sort: "int"
            },
            {
              id: "type",
              header: "当前状态(1:正常进入 2:强制下线 3:非强制)",
              width: 300,
              sort: "int"
            },
            {
              id: "content",
              header: "描述内容",
              width: 150,
              sort: "string"
            },
            {
              id: "forUrl",
              header: "跳转Url",
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
                    ],
          onClick: ClickEvents,
                },
                definePager(50)
            ]
    });

    let pager = $$('pager');
    let list = $$('list');
    let param: any

    async function addAppSetting() {
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
                label: "包ID",
                width: 300,
                labelAlign: "right",
              },
              {
                view: "text",
                id: "cname_2",
                label: "包名称",
                width: 300,
                labelAlign: "right",
              },
              {
                view: "combo",
                id: "ctag_2",
                label: "包类型",
                yCount: "5",
                width: 200,
                options: [
                  {
                    id: 1,
                    value: "1:安卓",
                  },
                  {
                    id: 2,
                    value: "2:ios",
                  }
                                ]
                            },
                        ]
                    },
          {
            view: "combo",
            id: "type_2",
            label: "状态:",
            yCount: "5",
            width: 200,
            options: [
              {
                id: 1,
                value: "1:正常通过",
              },
              {
                id: 2,
                value: "2:强制更新",
              },
              {
                id: 3,
                value: "3:非强制更新",
              }
                        ]
                    },
          {
            view: "layout",
            cols: [
              {
                view: "text",
                id: "content",
                label: "描述内容",
                labelAlign: "right",
              },
                        ]
                    },
          {
            view: "layout",
            cols: [
              {
                view: "text",
                id: "forUrl",
                label: "跳转的Url",
                labelAlign: "right",
              },
                        ]
                    },
                ]
      };

      openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
        var param = < any > {};
        param.serial = $$("cserial").getValue();
        param.cname = $$("cname_2").getValue();
        param.ctag = $$("ctag_2").getValue();
        param.type = $$("type_2").getValue();
        param.content = $$("content").getValue();
        param.forUrl = $$("forUrl").getValue();
        if (!param.serial ||
          !param.cname ||
          !param.ctag ||
          !param.type) {
          alert("信息不完整，请检查");
          return
        }

        try {
          await service.call("platform/addAppSetting", param);
          dlg.close();
          queryAppSetting();
        } catch (e) {
          alert(e.message);
        }
      });
    }
    async function deleteAppSetting(e, id, trg) {
      param = {};
      var item = list.getItem(id);
      param.serial = item.serial;
      try {
        await service.call("platform/deleteAppSetting", param);
        await queryAppSetting();
      } catch (e) {
        alert(e.message);
      }
    }
    async function modifyAppSetting(e, id, trg) {
      param = {};
      var item = list.getItem(id);
      let params: FormDlgParams = {
        width: 1200,
        position: "center",
        title: "包参数修改_" + item.cname,
        elements: [
          {
            view: "layout",
            cols: [
              {
                view: "text",
                id: "cname_3",
                label: "包名称:",
                value: item.cname,
                width: 300,
                labelAlign: "right",
              },
              {
                view: "combo",
                id: "ctag_3",
                label: "包类型:(1:android 2:ios)",
                value: item.ctag,
                yCount: "5",
                width: 200,
                options: [
                  {
                    id: 1,
                    value: "1:安卓",
                  },
                  {
                    id: 2,
                    value: "2:ios",
                  }
                                ]
                            },
                        ]
                    },
          {
            view: "layout",
            cols: [
              {
                view: "combo",
                id: "type_3",
                label: "状态:",
                value: item.type,
                yCount: "5",
                width: 200,
                options: [
                  {
                    id: 1,
                    value: "1:正常通过",
                  },
                  {
                    id: 2,
                    value: "2:强制更新",
                  },
                  {
                    id: 3,
                    value: "3:非强制更新",
                  }

                                ]
                            },
                        ]
                    },
          {
            view: "layout",
            cols: [
              {
                view: "text",
                id: "content",
                label: "描述内容:",
                value: item.content
              },
                        ]
                    },
          {
            view: "layout",
            cols: [
              {
                view: "text",
                id: "forUrl",
                label: "跳转的Url:",
                value: item.forUrl
              },
                        ]
                    },
                ]
      };

      openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
        var param = < any > {};
        param.serial = item.serial;
        param.cname = $$("cname_3").getValue();
        param.ctag = $$("ctag_3").getValue();
        param.type = $$("type_3").getValue();
        param.content = $$("content").getValue();
        param.forUrl = $$("forUrl").getValue();
        if (!param.serial ||
          !param.cname ||
          !param.ctag ||
          !param.type) {
          alert("信息不完整，请检查");
          return
        }

        try {
          await service.call("platform/modifyAppSetting", param);
          dlg.close();
          await queryAppSetting();
        } catch (e) {
          alert(e.message);
        }
      });
    }
    async function queryAppSetting() {
      param = {};
      param.serial = $$("serial").getValue();
      param.cname = $$("cname_1").getValue();
      param.ctag = $$("ctag_1").getValue();
      param.type = $$("type_1").getValue();
      dataQuery("platform/queryAppSetting", param, list, pager, function (r) {
        for (let i in r) {
          r[i].deleate = "删除"
          r[i].modify = "修改"
        };
      });
    }
    //export function cdkey(root: webix.ui.layout, params: any) {

    //    var ClickEvents = {
    //        deleate: deleteActivityConfig,
    //    };

    //    root.addView({
    //        type: "wide", padding: 2,
    //        id: "mainPage",
    //        rows: [
    //            {
    //                view: "layout", cols: [
    //                    { view: "label", label: "礼包码管理", css: "title", width: 100, },
    //                    { view: "label" },
    //                ]
    //            },
    //            {
    //                view: "layout", cols: [
    //                    { view: "text", id: "serial", label: "礼包ID", width: 300, labelAlign: "right", },
    //                    { view: "text", id: "type", label: "CDKey类型", width: 300, labelAlign: "right", },
    //                    { view: "text", id: "code", label: "CDKey", width: 300, labelAlign: "right", },
    //                    { view: "label" },
    //                    { view: "button", id: "queryBtn", label: "查询", width: 100, click: queryCDKey },
    //                    { view: "button", id: "createBtn", label: "创建", width: 100, click: uploadCDKey },
    //                    { view: "button", id: "uploadBtn", label: "导入", width: 100, click: uploadCDKey },
    //                    { view: "button", label: "导出", width: 100, click: exportCDKey },
    //                ]
    //            },
    //            {
    //                view: "datatable",
    //                id: "list",
    //                select: true,
    //                resizeColumn: true,
    //                scroll: "y",
    //                columns: [
    //                    { id: "code", header: "CDKey", width: 150, sort: "string" },
    //                    { id: "serial", header: "礼包ID", width: 80, sort: "int" },
    //                    { id: "type", label: "CDKey类型", width: 200, sort: "int" },
    //                    { id: "count", label: "剩余个数", width: 200, sort: "int" },
    //                    { id: "deleate", header: "删除", width: 60, template: "<button class='deleate'>删除</button>" },
    //                    { id: "check", header: "勾选", width: 60, template: "{common.checkbox()}" },
    //                ],
    //                onClick: ClickEvents,
    //            },
    //            definePager(50)
    //        ]
    //    });

    //let pager = $$('pager');
    //let list = $$('list');
    //let param: any

    //async function uploadCDKey() {
    //    let params: FormDlgParams = {
    //        width: 1200,
    //        position: "center",
    //        title: "CDKey添加",
    //        elements: [
    //            {
    //                view: "layout", cols: [
    //                    { view: "label", id: "createFileName", align: "right", width: 500 },
    //                    { view: "label" },
    //                    { view: "button", label: "上传文件", align: "right", width: 100, click: upload },
    //                ]
    //            }
    //        ]
    //    };

    //    openFormDlg(params, async function (vales: any, dlg: webix.ui.window) {
    //        var param = <any>{};
    //        if (!file) {
    //            alert("请选择文件");
    //            return
    //        }

    //        try {
    //            await service.uploadFile("cdkey/uploadCDKey", file, param);
    //            dlg.close();
    //            queryCDKey();
    //        }
    //        catch (e) {
    //            alert(e.message);
    //        }
    //    });

    //    var file;
    //    function upload() {
    //        getFile(f => {
    //            file = f;
    //            $$("createFileName").setValue(file.name);
    //        });
    //    }
    //}

    //async function deleteActivityConfig(e, id, trg) {
    //    param = {};
    //    var item = list.getItem(id);
    //    param.serial = item.serial;
    //    param.type = item.type;
    //    param.code = item.code;
    //    try {
    //        await service.call("cdkey/deleteCDKey", param);
    //        await queryCDKey();
    //    }
    //    catch (e) {
    //        alert(e.message);
    //    }
    //}
    //async function queryCDKey() {
    //    param = {};
    //    param.serial = $$("serial").getValue();
    //    param.type = $$("type").getValue();
    //    param.code = $$("code").getValue();
    //    dataQuery("cdkey/queryCDKey", param, list, pager, function (r) {
    //        for (let i in r) {
    //            r[i].deleate = "删除"
    //        };
    //    });
    //}
    //async function exportCDKey() {
    //    param = {};
    //    param.serial = $$("serial").getValue();
    //    param.type = $$("type").getValue();
    //    param.code = $$("code").getValue();
    //    param.fn = "cdkey" + param.serial + "_" + param.type + "_" + ".csv";
    //    service.downloadFile("cdkey/exportCDKey", param);
    //}
  }
}

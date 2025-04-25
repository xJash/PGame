module user {

  export function setup() {
    function resetPassword() {
      var params = {
        title: "修改密码",
        elements: [
          {
            name: "oldPwd",
            view: "text",
            label: "旧的密码:",
            labelAlign: "right",
            labelWidth: 80,
            type: "password"
          },
          {
            name: "newPwd",
            view: "text",
            label: "新的密码:",
            labelAlign: "right",
            labelWidth: 80,
            type: "password"
          },
          {
            name: "pwd2",
            view: "text",
            label: "重复密码:",
            labelAlign: "right",
            labelWidth: 80,
            type: "password"
          },
				],
        rules: {
          oldPwd: webix.rules.isNotEmpty,
          newPwd: webix.rules.isNotEmpty,
          $obj: function (data) {
            if (data.newPwd != data.pwd2) {
              alert("密码不一致");
              return false;
            }
            return true;
          }
        },
        props: {
          left: document.body.clientWidth - 300,
          width: 280,
        }
      };
      openFormDlg(params, async function (vals, dlg) {
        try {
          await service.call("auth/changePassword", {
            oldPwd: md5.b64(vals.oldPwd),
            newPwd: md5.b64(vals.newPwd)
          });
          dlg.close();
        } catch (e) {
          alert(e.message);
        }
      });
    }
    var menu = {
      view: "submenu",
      layout: "y",
      width: 120,
      select: true,
      data: [
        {
          id: "1",
          value: "重置密码"
        },
        {
          $template: "Separator"
        },
        {
          id: "2",
          value: "退出登录"
        },
			],
      on: {
        onItemClick: function (id) {
          if (id == "1") {
            resetPassword();
          } else {
            window.localStorage.removeItem("session");
            window.location.reload(true);
          }
        }
      }
    };
    ( < any > webix.ui(menu)).show($$("setupIcon").getNode(), {
      pos: "bottom"
    });
  }


  export function userPage(root: webix.ui.layout, search: string) {
    root.addView({
      type: "wide",
      padding: 2,
      id: "mainPage",
      rows: [
        {
          view: "label",
          label: "用户管理",
          css: "title"
        },
        {
          view: "layout",
          cols: [
            {
              view: "button",
              label: "添加用户",
              width: 120,
              click: addUser
            },
            {
              view: "button",
              label: "删除用户",
              width: 120,
              click: removeUser
            },
            {
              view: "button",
              label: "重置密码",
              width: 120,
              click: resetPassword
            },
            {
              view: "label"
            }
					]
				},
        {
          view: "datatable",
          id: "list",
          select: true,
          resizeColumn: true,
          scroll: "y",
          columns: [
						//{ id: "id", width: 60, tooltip: false, sort: "string" },
            {
              id: "account",
              header: "账号",
              width: 160,
              sort: "string"
            },
            {
              id: "name",
              header: "用户昵称",
              width: 160,
              sort: "string"
            },
            {
              id: "type",
              header: "权限类型",
              width: 90,
              sort: "int",
              format: function (v) {
                return UserType[v]
              }
            },
            {
              id: "lastLogin",
              header: "上次登录",
              width: 160,
              template: formatDate
            },
					],
          data: []
				}
			]
    });
    var list = $$("list");

    function refresh() {
      list.clearAll();
      list.parse(service.call("user/users", {}));
    }
    refresh();

    function addUser() {
      var types = Object.getOwnPropertyNames(UserType).filter(v => v.length > 1);
      var params = {
        title: "添加用户",
        elements: [
          {
            name: "account",
            view: "text",
            label: "账号名:",
            labelAlign: "right",
            labelWidth: 80
          },
          {
            name: "name",
            view: "text",
            label: "用户名:",
            labelAlign: "right",
            labelWidth: 80
          },
          {
            name: "pwd",
            view: "text",
            label: "登录密码:",
            labelAlign: "right",
            labelWidth: 80,
            type: "password"
          },
          {
            name: "pwd2",
            view: "text",
            label: "重复密码:",
            labelAlign: "right",
            labelWidth: 80,
            type: "password"
          },
          {
            name: "type",
            view: "combo",
            label: "账号类型:",
            labelAlign: "right",
            labelWidth: 80,
            options: types
          },
				],
        rules: {
          name: webix.rules.isNotEmpty,
          account: webix.rules.isNotEmpty,
          pwd: webix.rules.isNotEmpty,
          pwd2: webix.rules.isNotEmpty,
          type: webix.rules.isNotEmpty,
          $obj: function (data) {
            if (data.pwd != data.pwd2) {
              alert("密码不一致");
              return false;
            }
            return true;
          }
        },
        props: {
          top: 100,
          left: 180,
          width: 320,
        }
      };

      openFormDlg(params, async function (vals, dlg) {
        vals.type = UserType[vals.type];
        vals.pwd = md5.b64(vals.pwd);
        delete vals.pwd2;
        try {
          await service.call("user/addUser", vals);
          dlg.close();
          refresh();
        } catch (e) {
          alert(e.message);
        }
      });
    }

    function removeUser() {
      var ids = list.getSelectedId(true);
      if (ids.length == 0) {
        alert("请先选择用户");
        return;
      }
      var item = list.getItem(ids[0]);
      confirmDialog("删除用户", `你确定要删除用户"${item.name}"吗？`, {}, async function () {
        try {
          await service.call("user/removeUser", {
            id: item.account
          });
          refresh();
        } catch (e) {
          alert(e.message);
        }
      });
    }

    function resetPassword() {
      var ids = list.getSelectedId(true);
      if (ids.length == 0) {
        alert("请先选择用户");
        return;
      }
      var item = list.getItem(ids[0]);

      var params = {
        title: "重置密码",
        elements: [
          {
            view: "label",
            label: `输入${item.name}的新密码`
          },
          {
            name: "pwd",
            view: "text",
            label: "登录密码:",
            labelAlign: "right",
            labelWidth: 80,
            type: "password"
          },
          {
            name: "pwd2",
            view: "text",
            label: "重复密码:",
            labelAlign: "right",
            labelWidth: 80,
            type: "password"
          },
				],
        rules: {
          pwd: webix.rules.isNotEmpty,
          pwd2: webix.rules.isNotEmpty,
          $obj: function (data) {
            if (data.pwd != data.pwd2) {
              alert("密码不一致");
              return false;
            }
            return true;
          }
        },
        props: {
          width: 320,
        }
      };
      openFormDlg(params, async function (vals, dlg) {
        try {
          await service.call("user/resetPassword", {
            account: item.account,
            pwd: md5.b64(vals.pwd)
          });
          dlg.close();
          refresh();
        } catch (e) {
          alert(e.message);
        }
      });
    }
  }
}

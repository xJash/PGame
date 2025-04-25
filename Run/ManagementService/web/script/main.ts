function createLoginForm(onLogin: Function): webix.ui.baseview {
	return webix.ui({
		container: "layout_div",
		id: "login",
		width: 400,
		paddingX: 20,
		type: "clean",
		rows: [
			{ view: "template", template: "html->logo", autoheight: true },
			{
				view: "form",
				id: "login_form",
				//width: 360,
				rules: { name: webix.rules.isNotEmpty, password: webix.rules.isNotEmpty },
				elements: [
					{ view: "text", value: '', name: "name", label: "用户名", width: 300, align: "center", invalidMessage: "请输入用户名" },
					{ view: "text", type: 'password', name: "password", value: '', label: "密码", width: 300, align: "center", invalidMessage: "请输入密码" },
					{ view: "checkbox", labelRight: "记住用户名", name: "remember", align: "left", customCheckbox: false, labelWidth: 15, value: 1 },
					{ view: "button", value: "登 录", type: "form", width: 300, align: "center", click: onLogin }
				]
			}
		]
	});
}

function hashChange() {
	var id = window.location.hash;
	if (id.length == 0)
		return;

	id = id.substring(1);
	pageNav(id);
}
console.log(service.userType);
var userSelect = true;
var userMenu = {
	view: "sidebar",
	id: "sidebar",
	data: [
        {
            id: "1", icon: "user", value: "玩家", include: [UserType.运维操作, UserType.联运操作, UserType.GM客服, UserType.只读用户, UserType.发行人员], data: [
                { id: "playerInfo", value: "玩家信息", include: [UserType.运维操作, UserType.联运操作, UserType.GM客服, UserType.只读用户, UserType.发行人员]},
                { id: "operationlog", value: "操作记录", include: [UserType.运维操作, UserType.联运操作, UserType.GM客服, UserType.只读用户, UserType.发行人员]},
			]
		},
		{
            id: "2", icon: "money", value: "充值", include: [/*UserType.运维操作, */UserType.联运操作, UserType.发行人员], data: [
                { id: "rechargeQuery", value: "充值查询" },
			]
		},
		{
            id: "3", icon: "child", value: "活动", include: [UserType.运维操作, UserType.联运操作, UserType.发行人员], data: [
                { id: "activityQuery", value: "活动管理"}, 
                { id: "activityConfig", value: "活动配置" }
			]
		},
		{
            id: "4", icon: "envelope", value: "邮件", include: [UserType.运维操作, UserType.联运操作/*, UserType.GM客服*/], data: [
                { id: "mailQuery", value: "邮件查询" },
			]
		},
		{
            id: "5", icon: "lightbulb-o", value: "走马灯", include: [UserType.运维操作, UserType.联运操作/*, UserType.GM客服*/, UserType.只读用户, UserType.发行人员], data: [
                { id: "noticeSearch", value: "走马灯查询" },
			]
		},
		{
            id: "9", icon: "ban", value: "封禁", include: [UserType.运维操作, UserType.联运操作, UserType.GM客服, UserType.发行人员], data: [
                { id: "banQuery", value: "封禁管理" },
                { id: "muteQuery", value: "禁言词管理" }
			]
		},
		{
            id: "16", icon: "bullhorn", value: "公告", include: [UserType.运维操作, UserType.联运操作/*, UserType.GM客服*/, UserType.发行人员], data: [
                { id: "announceQuery", value: "公告管理" },
			]
		},

		{
            id: "17", icon: "bar-chart", value: "统计", include: [/*UserType.运维操作, */UserType.联运操作, UserType.发行人员], data: [
                { id: "lcStatistics", value: "留存统计" },
                { id: "onlineStatistics", value: "在线统计" },
                { id: "levelStatistics", value: "等级统计" },
                { id: "serverPlayerCountStatistics", value: "区服玩家人数统计" },
			]
        },
        {
            id: "18", icon: "search", value: "SQL查询", include: [/*UserType.运维操作,*/ UserType.Operator], data: [
                { id: "sqlQuery", value: "SQL查询" },
            ]
        },
        {
            id: "19", icon: "server", value: "游戏服", include: [UserType.Operator/*, UserType.账户管理员*/], data: [
                { id: "serverManage", value: "游戏服管理" },
                { id: "runSQL", value: "运行SQL" },
            ]
        },
        {
            id: "20", icon: "server", value: "开服计划", include: [UserType.运维操作, UserType.联运操作], data: [
                { id: "serverOpen", value: "开服计划" },
            ]
        },
        {
            id: "21", icon: "gift", value: "礼包管理", include: [UserType.运维操作, UserType.联运操作], data: [
                { id: "cdkeyGift", value: "礼包配置" },
                { id: "cdkey", value: "礼包码管理" },
            ]
        },
		{
			id: "14", icon: "user", value: "系统管理", include: [UserType.账户管理员], data: [
				{ id: "user", value: "用户管理" },
			]
        },
        {
            id: "15", icon: "platform", value: "平台管理", include: [UserType.联运操作], data: [
                { id: "app", value: "安卓包控制" },
            ]
        },
		/*
			{
			id: "6", icon: "dashboard", value: "运营数据统计", include: [UserType.运维操作], data: [
				{ id: "留存查询", value: "留存查询" },
			]
		},
		{
			id: "10", icon: "dashboard", value: "运营活动", include: [UserType.运维操作, UserType.联运操作], data: [
				{ id: "运营活动列表", value: "列表" },
				{ id: "运营活动查询", value: "查询" },
			]
		},


		{ id: "7", icon: "dashboard", value: "服务器状态统计", },
		{ id: "8", icon: "dashboard", value: "热点信息", },
		{ id: "9", icon: "dashboard", value: "封禁设置", },
		{ id: "11", icon: "dashboard", value: "玩家存档回滚", },
		{ id: "12", icon: "dashboard", value: "SQL查询", },
		{ id: "13", icon: "dashboard", value: "激活码生成", },
		
		{ id: "15", icon: "question-circle", value: "帮助" },*/
	],
	on: {
		onAfterSelect: function (id) {
			if (userSelect)
				window.location.hash = id;
		}
	}
};

function canAccess(t) {
	if (t.include && t.include.indexOf(service.userType) >= 0)
		return true;
	if (t.exclude && t.exclude.indexOf(service.userType) < 0)
		return true;
	return (!t.include && !t.exclude);
}

var menu;

function showPage(id: string, search: string) {
	var root = $$("root");
	if ($$("mainPage"))
		root.removeView("mainPage");
	var params: any = {};
	if (search) {
		var args = search.split('&');
		for (var k in args) {
			var p = args[k].split('=');
			params[p[0]] = p[1];
		}
	}
	switch (id) {
		case "user":
			user.userPage(root, params);
			break;
        case "playerInfo":
			player.allPlayerInfo(root, params);
			break;
        case "operationlog":
			player.operationlog(root, params);
			break;
        case "noticeSearch":
			notice.noticeSearch(root, params);
			break;
        case "rechargeQuery":
			rechange.rechargeQuery(root, params);
			break;
        case "activityQuery":
			activity.activityQuery(root, params);
            break;
        case "activityConfig":
            activity.activityConfig(root, params);
            break
        case "mailQuery":
			mail.mailQuery(root, params);
			break;
        case "announceQuery":
			announce.announceQuery(root, params);
			break;
        case "banQuery":
			ban.banQuery(root, params);
            break;
        case "muteQuery":
            mute.muteQuery(root, params);
            break;
        case "lcStatistics":
			statistics.lcStatistics(root, params);
			break;
        case "onlineStatistics":
			statistics.onlineStatistics(root, params);
			break;
        case "levelStatistics":
			statistics.levelStatistics(root, params);
            break;
        case "serverPlayerCountStatistics":
            statistics.serverPlayerCountStatistics(root, params);
            break;
        case "sqlQuery":
            sqlquery.sqlQuery(root, params);
            break;
        case "serverOpen":
            server.serverOpen(root, params);
            break;
        case "cdkeyGift":
            cdkey.cdkeyGift(root, params);
            break;
        case "cdkey":
            cdkey.cdkey(root, params);
            break;
        case "serverManage":
            server.serverManage(root, params);
            break;
        case "runSQL":
            runsql.runSQL(root, params);
            break;
        case "app":
            platform.app(root, params);
            break;
        case "help":
            root.addView({
                id: "mainPage",
                view: "iframe",
                src: "help/index.htm"
            });
            break;
		default:
			root.addView({
				id: "mainPage",
				template: "建设中..."
			});
			break;
	}
}

function pageNav(id) {
	var args = id.split('_');
	userSelect = false;
	id = args[0];
	var search = args[1];
	var root = $$("root");
	if (id == "") {
		root.addView({ id: "mainPage", template: " 　" });
		userSelect = true;
		return;
	}
	var sidebar = $$("sidebar");
	sidebar.closeAll();
	for (var i = 0; i < menu.data.length; i++) {
		var item = <any>menu.data[i];
		if (item.id == id) {
			sidebar.select(id);
			showPage(id, search);
			userSelect = true;
			return;
		}
		var submenu = item.data;
		if (!submenu)
			continue;
		for (var j = 0; j < submenu.length; j++) {
			if (submenu[j].id == id) {
				//console.log("open:" + menu.data[i].id);
				sidebar.open(menu.data[i].id);
				sidebar.select(id);
				showPage(id, search);
				userSelect = true;
				return;
			}
		}
	}
	userSelect = true;

}

function mainForm() {
	function filterMenuItems(items) {
		var list = [];
		for (var i in items) {
			var t = items[i];
			if (canAccess(t)) {
				list.push(t);
				if (t.data)
					t.data = filterMenuItems(t.data);
			}
		}
		return list;
	}
	userMenu.data = filterMenuItems(userMenu.data);
	menu = JSON.parse(JSON.stringify(userMenu));
	var ui = {
		type: "wide", padding: 2, //width: "auto",
		rows: [
			{
				view: "toolbar", height: 35, elements: [
					{ view: "label", template: "<div class='title'>xulong游戏后台运维管理系统</div>" },
					{ view: "label", id: "userLabel", width: 250, align: "right" },
					{ view: "icon", icon: "cog", id: "setupIcon", click: user.setup }
				]
			},
			{
				view: "accordion", cols: [
					{ header: "功能列表", headerHeight: 24, body: userMenu, width: 180 },
					{ body: { type: "wide", id: "root", cols: [{ id: "mainPage", template: " " }] } }
				]
			}
		]
	}
	webix.ui(ui);
	hashChange();
	window.addEventListener("hashchange", hashChange);

	$$("userLabel").setValue(`当前用户: ${service.userName}　权限: ${UserType[service.userType]}`);
}

async function main() {
	var session = localStorage.getItem("session");
	if (session) {
		if (await service.verify(session)) {
			mainForm();
			return;
		}
		else
			localStorage.removeItem("session");
	}
	var dlg = createLoginForm(async function () {
		var form = this.getParentView();
		if (form.validate()) {
			var vals = form.getValues();
			if (vals.remember)
				window.localStorage.setItem("name", vals.name);
			else
				window.localStorage.setItem("name", "");
			form.disable();

			try {
				await service.login(vals.name, md5.b64(vals.password));
				dlg.destructor();
				mainForm();
			}
			catch (e) {
				alert(e.message);
				form.enable();
			}
		}
	});
	var name = window.localStorage.getItem("name") || "";
	$$("login_form").setValues({ name: name, remember: name ? 1 : 0 });
}

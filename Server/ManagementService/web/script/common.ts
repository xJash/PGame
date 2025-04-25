webix.extend((<any>webix).ui.datatable, {
    updateItemValues: function (id, update) {
        let data = this.getItem(id);
        let vals: any = {};
        let needUpdate = false;
        for (let k in update) {
            if (k != "id" && typeof (data[k]) !== "undefined" && update[k] != data[k]) {
                data[k] = update[k];
                vals[k] = data[k];
                needUpdate = true;
            }
        }
        if (needUpdate) {
            let rowindex = this.getIndexById(id);
            let state = this._get_y_range();
            if (rowindex < state[0] || rowindex >= state[1]) return;
            let x_range = this._get_x_range();
            for (let i = 0; i < this._columns.length; i++) {
                let column = this._columns[i];
                if (typeof (vals[column.id]) === "undefined")
                    continue;
                if (column.attached && column.node) {
                    let node = column.node.childNodes[rowindex - state[0]];
                    let value = this._getValue(data, this._columns[i], 0);

                    node.innerHTML = value;
                    node.className = this._getCss(this._columns[i], value, data, id);
                }
            }
        }
    }
}, false);


type WebixCallback = (...args: any[]) => any;

function showTips(str: string, callback?: WebixCallback) {

    let multicombo = webix.ui({
        view: "multicombo",
        label: "To",
        value: "1,3",
        options: [
            {
                "id": 1,
                "value": "Ray M. Parra"
            },
            {
                "id": 2,
                "value": "Sabrina N. Hermann"
            },
            {
                "id": 3,
                "value": "Lane E. Dion"
            },
            {
                "id": 4,
                "value": "Bradly N. Mauro"
            }
        ]
    }).show();
    return;
    if (!str) return;
    webix.alert(str, callback)
}

function showPopup(params, body, node?: any) {
    if ($$("showpopup"))
        $$("showpopup").close();
    let popup = <any>webix.ui({
        id: "showpopup",
        view: "popup",
        on: {
            onHide: () => popup.close()
        },
        body: body
    });
    if (params)
        for (let k in params)
            popup[k] = params[k];

    if (node)
        popup.show(node);
    else
        popup.show();
    return popup;
}

interface FormDlgParams {
    title: string;
    elements: any[];
    width?: any;
    left?: any;
    position?: any,
    top?: any;
    vals?: any;
    rules?: any;
    props?: any;
}


function definePager(pageSize) {
    return {
        view: "pager",
        height: 20,
        id: "pager",
        group: 10,
        page: 1,
        count: 0,
        size: pageSize,
        template: " <div class='paging_text1'>Count: #count# {common.first()}{common.prev()}{common.pages()}{common.next()}{common.last()} {common.page()}/#limit#</div>"
    };
}




function serverids() {
    return JSON.parse(service.getSync("server/ids")).result.map(v => v.toString());
}


function splitToArr(obj: string, arg: string) {
    let r = [];
    let _r = obj.split(arg);
    for (let i = 0; i < _r.length; i++) {
        if (_r[i])
            r.push(_r[i]);
    }
    return r;
}

function openFormDlg(params: FormDlgParams, onSubmit: (vales: any, dlg: webix.ui.window) => void, onCancel?: () => boolean) {
    let dlgCfg = {
        id: "dlg",
        view: "window",
        modal: true,
        width: params.width || "auto",
        //left: params.left|| 100,
        //top: params.top || 50,
        position: params.position || "center",
        head: {
            template: params.title
        },
        body: {
            view: "form",
            id: "inputForm",
            elements: [
                {
                    margin: 100,
                    cols: [
                        {
                            view: "button",
                            label: "确 定",
                            id: "okBtn",
                            click: onOK
                        },
                        {
                            view: "button",
                            label: "取 消",
                            click: cancel
                        }
                    ]
                }
            ],
            rules: params.rules
        }
    }
    if (params.props) {
        for (let k in params.props)
            dlgCfg[k] = params.props[k];
    }
    dlgCfg.body.elements = params.elements.concat(dlgCfg.body.elements);

    let dlg: any = webix.ui(dlgCfg);
    dlg.show();
    if (params.vals)
        $$("inputForm").setValues(params.vals);
    return dlg;

    function onOK() {
        let form = <webix.ui.form>$$('inputForm');
        if (form.validate()) {
            onSubmit(form.getValues(), dlg);
        }
    }

    function cancel() {
        if (onCancel) {
            if (onCancel())
                dlg.close();
        } else
            dlg.close();
    }
}

function confirmDialog(title: string, content: string, params: any, onOK: Function) {
    params.width = params.width || 300;
    params.top = params.top || 50;
    params.title = title;
    params.left = params.left || (document.documentElement.clientWidth - params.width) * 0.5;
    params.buttons = ["确 定", "取 消"];
    params.text = content;
    params.callback = result => {
        if (result == 0)
            onOK();
    };
    webix.modalbox(params);
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function parseJSONDate(date) {
    if (!date)
        return "";
    return new Date(date);
    //return eval('new ' + (date.replace(/\//g, '')));
}

function formatDate(t, c, v) {
    if (!v)
        return "";
    if (typeof v === "string")
        v = parseJSONDate(v);
    return v.toLocaleDateString() + " " + v.toLocaleTimeString();
}

function replaceAll(s, s1, s2) {
    return s.replace(new RegExp(s1, "gm"), s2);
}

function htmlencode(s) {
    s = replaceAll(s, "&", "&amp;");
    s = replaceAll(s, "<", "&lt;");
    return "<pre>" + s + "</pre>";
}

function charCount(str, ch) {
    let count = 0;
    let code = ch.charCodeAt(0);
    for (let i = 0; i < str.length; i++)
        if (str.charCodeAt(i) == code)
            count++;
    return count;
}

function stringIndexOfN(str, ch, n) {
    let pos = -1;
    while (n > 0) {
        pos = str.indexOf(ch, pos + 1);
        if (pos < 0)
            return -1;
        n--;
    }
    return pos;
}

async function dataQuery(url: string, param: any, list: any, pager: any, call?: Function) {
    let datas: any;
    //if (!param.start || !param.count) {
    //	param.start = 1;
    //	param.count = 1;
    //}
    list.clearAll();
    list.showOverlay("搜索中...(求轻虐)");
    try {
        var r = await service.call(url, param);
        datas = r;
        pager.define("count", r.length);
        pager.define("page", 0);
        pager.$master = {
            refresh: setPage
        };
        pager.refresh();
    } catch (e) {
        alert(e.message);
    }

    async function setPage() {
        let start = pager.data.page * pager.data.size;
        let end = start + pager.data.size;
        let r = datas.slice(start, end);
        list.clearAll();
        list.showOverlay("加载中...");
        if (call)
            call(r);
        list.parse(r);
        list.hideOverlay();
    }
    list.hideOverlay();
    setPage();
}

function multiServerOptions(valFn: Function, idstr: string = "", labelValue: string = "所在区服:", id?: number, max: number = 30) {
    let serverInfo = serverids();
    let serverOptions = [];
    serverOptions.push({
        view: "label",
        label: labelValue,
        labelAlign: "left",
        width: 100,
        labelWidth: 0
    });
    serverOptions.push({
        view: "checkbox",
        id: idstr + "allSelect",
        labelRight: "全选",
        value: "0",
        labelAlign: "left",
        labelWidth: 0,
        width: 60,
        click: selectHandle
    });
    let cols = [];
    let rows = [];
    let index = 0;
    //if (!id)
    //	id = serverInfo[0];
    for (let i = 0; i < serverInfo.length; i++) {
        let info = serverInfo[i];
        let value = 0;
        if (id && id == Number(info))
            value = 1;
        cols.push({
            view: "checkbox",
            id: idstr + info,
            labelRight: info,
            label: "",
            value: value,
            labelAlign: "right",
            labelWidth: 0,
            width: 50,
            click: selectHandle,
            autoheight: true
        })

        rows[Math.floor(i / max)] = {
            view: "layout",
            cols: cols
        };

        index++;
        index = (i + 1) % max;
        if (index == 0) {
            cols = []
        }
    }
    if (rows.length > 20) {
        serverOptions.push({
            view: "scrollview",
            scroll: "y",
            maxHeight: 160,
            maxWidhth: 1000,
            body: {
                rows: rows
            }
        })
    } else {
        serverOptions.push({
            view: "layout",
            rows: rows
        });
    }
    serverOptions.push({
        view: "label"
    })

    function selectHandle(e) {
        let self = $$(e);
        let value = self.getValue();
        let panNum: number = 1;
        let all = $$(idstr + "allSelect");
        for (let i = 0; i < serverInfo.length; i++) {
            let item = $$(idstr + serverInfo[i]);
            if (self == all) {
                item.setValue(value);
            } else {
                if (!item.getValue()) {
                    panNum = 0;
                }
            }
        }
        if (self != all)
            all.setValue(panNum);
        let r: Array<number> = [];
        for (let i = 0; i < serverInfo.length; i++) {
            let item = $$(idstr + serverInfo[i]);
            if (Number(item.getValue())) {
                r.push(Number(serverInfo[i]));
            }
        }
        valFn(r);
    }
    valFn([id]);
    return {
        view: "layout",
        cols: serverOptions
    }
}

function getFile(call: Function) {
    let input = document.createElement('input');
    input = document.createElement('input');
    input.type = "file";
    document.body.appendChild(input);
    input.style.display = 'none';
    input.click();
    input.onchange = function () {
        let file = input.files[0];
        if (file) {
            if (file.name.split(".")[1] === "csv") {
                call(file);
            } else {
                alert("文件格式不正确,请重新选择");
            }
        }
        document.body.removeChild(input);
    }
}

enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
    Fatal
};

enum UserType {
    只读用户 = 0,
    GM客服 = 1,
    运维操作 = 2,
    联运操作 = 3,
    账户管理员 = 4,
    Operator = 5,
    发行人员 = 10,
}

namespace service {
    let ajax = {
        _send: function (method, url, params, call, async) {
            let x = new XMLHttpRequest();
            if (typeof params == "object") {
                let p = [];
                for (let a in params) {
                    let value = params[a];
                    let t = typeof value;
                    if (value === null || t === 'undefined')
                        value = "";
                    if (t === "object")
                        value = JSON.stringify(value);
                    p.push(a + "=" + encodeURIComponent(value));
                }
                params = p.join("&");
            }
            if (params && method === 'GET') {
                url = url + (url.indexOf("?") != -1 ? "&" : "?") + params;
                params = null;
            }
            x.open(method, url, async);
            if (method === 'POST')
                x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            let self = this;
            x.onerror = function (ev) {
                console.error("ajax error: ", ev);
                call({
                    errCode: -1,
                    errMsg: "网络错误"
                });
            };
            x.onload = function () {
                let is_error = x.status >= 400 || (!x.status && !x.responseText);
                let err = null;
                if (is_error) {
                    let statusText = x.statusText;
                    if (x.status == 0)
                        statusText = "timeout.";
                    err = {
                        errCode: x.status,
                        errMsg: statusText
                    };
                }
                call(err, x.responseText);
            }
            x.send(params || null);
            return x;
        },

        get: function (url, params, cb, async) {
            return this._send('GET', url, params, cb, async);
        },

        post: function (url, params, cb, async) {
            return this._send('POST', url, params, cb, async);
        }
    }

    export let session = null;
    export let userType = 0;
    export let userName = "";

    function hex_md5(pass) {
        return pass;
    }

    export function verify(session: string) {
        return new Promise<boolean>(r => {
            ajax.get("auth/verify", {
                session: session
            }, function (err, result) {
                if (err) {
                    alert("网络故障，请刷新网页");
                    return;
                }
                let json = JSON.parse(result);
                if (json.result) {
                    service.userName = json.result.name;
                    service.session = json.result.session;
                    service.userType = json.result.type;
                    r(true);
                } else
                    r(false);
            }, true);
        });
    }

    export function login(name: string, password: string) {
        return new Promise<void>((r, e) => {
            ajax.get("auth/login", {
                name: name,
                password: hex_md5(password)
            }, function (err, result) {
                if (err) {
                    alert("网络故障，请刷新网页");
                    return;
                }
                let json = JSON.parse(result);
                if (json.status == 0) {
                    localStorage.setItem("session", json.result.session);
                    service.userName = json.result.name;
                    service.session = json.result.session;
                    service.userType = json.result.type;
                    r();
                } else
                    e(new Error(json.message));
            }, true);
        });
    }

    export function get(url: string, params?: any) {
        if (!params)
            params = {};
        params.session = this.session;
        return new Promise<string>((r, e) => {
            ajax.get(url, params, function (err, result) {
                if (err) {
                    alert("Error code: " + err.errCode + " message:" + err.errMsg);
                    e(new Error(err.errMsg));
                } else
                    r(result);
            }, true);
        });
    }
    export function downloadFile(url, params?: any) {
        if (!params)
            params = {};
        params.session = this.session;
        try {
            if (typeof params == "object") {
                let p = [];
                for (let a in params) {
                    let value = params[a];
                    let t = typeof value;
                    if (value === null || t === 'undefined')
                        value = "";
                    if (t === "object")
                        value = JSON.stringify(value);
                    p.push(a + "=" + encodeURIComponent(value));
                }
                params = p.join("&");
            }
            url = url + (url.indexOf("?") != -1 ? "&" : "?") + params;

            let iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        } catch (e) { }
    }

    export function upload(url, params, file, call, async) {
        let x = new XMLHttpRequest();
        if (typeof params == "object") {
            let p = [];
            for (let a in params) {
                let value = params[a];
                let t = typeof value;
                if (value === null || t === 'undefined')
                    value = "";
                if (t === "object")
                    value = JSON.stringify(value);
                p.push(a + "=" + encodeURIComponent(value));
            }
            params = p.join("&");
        }
        url = url + (url.indexOf("?") != -1 ? "&" : "?") + params;
        let fd = new FormData();
        fd.append('file', file);
        x.open('POST', url, async);
        let self = this;
        x.onerror = function (ev) {
            console.error("upload error: ", ev);
            call({
                errCode: -1,
                errMsg: "网络错误"
            });
        };
        x.upload.onprogress = function (event) {
            var pre = Math.floor(100 * event.loaded / event.total);
            console.log(pre);
        }
        x.onload = function () {
            let is_error = x.status >= 400 || (!x.status && !x.responseText);
            let err = null;
            if (is_error) {
                let statusText = x.statusText;
                if (x.status == 0)
                    statusText = "timeout.";
                err = {
                    errCode: x.status,
                    errMsg: statusText
                };
            }
            call(err, x.responseText);
        }
        x.send(fd);
        return x;
    }

    export function uploadFile(url, file: File, params?: any) {
        if (url[0] !== "/") {
            url = "/" + url;
        };
        if (!params)
            params = {};
        params.session = service.session;
        return new Promise<any>((r, e) => {
            upload(url, params, file, function (err, result) {
                if (err) {
                    e(new Error(err.errMsg));
                    //alert(err.errMsg);
                    return;
                }
                let json = JSON.parse(result);
                if (json.status == 0) {
                    r(json.result);
                } else if (json.status == -101) {
                    alert("session过期，请重新登录");
                    window.location.href = window.location.protocol + "//" + window.location.host;
                    //window.location.reload(true);
                } else
                    e(new Error(json.message));
                //alert(json.message);
            }, true);
        });
    }

    export function uploadFileWithParamsAsync(url, file: File, params?: any) {
        if (url[0] !== "/") {
            url = "/" + url;
        };
        if (!params)
            params = {};
        params.session = service.session;
        return new Promise<any>((r, e) => {
            upload(url, params, file, function (err, result) {
                if (err) {
                    e(new Error(err.errMsg));
                    //alert(err.errMsg);
                    return;
                }
                let json = JSON.parse(result);
                if (json.status == 0) {
                    r(json.result);
                } else if (json.status == -101) {
                    alert("session过期，请重新登录");
                    window.location.href = window.location.protocol + "//" + window.location.host;
                    //window.location.reload(true);
                } else
                    e(new Error(json.message));
                //alert(json.message);
            }, true);
        });
    }

    let pullStoped = false;

    export function stopPull() {
        pullStoped = true;
    }
    export function pullNotify(eventHandler) {
        function pull() {
            ajax.get("notify", {
                session: session
            }, function (err, result) {
                if (pullStoped)
                    return;
                if (err) {
                    console.error(err);
                    alert(err.errMsg);
                    window.location.reload(true);
                    return;
                }
                let json = JSON.parse(result);
                if (json.status == 0) {
                    let r = json.result;
                    if (Array.isArray(r)) {
                        for (let i = 0; i < r.length; i++) {
                            try {
                                let item = r[i];
                                eventHandler(item.type, item.data);
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    } else {
                        eventHandler(r.type, r.data);
                    }
                } else if (json.status == -101) {
                    alert("session过期，请重新登录");
                    window.location.reload(true);
                    return;
                }
                pull();
            }, true);
        }
        pull();
    }

    export function getSync(url: string, params?: any) {
        if (!params)
            params = {};
        params.session = service.session;
        let r;
        ajax.get(url, params, function (err, result) {
            if (err) {
                alert("Error code: " + err.errCode + " message:" + err.errMsg);
                throw new Error(err.errMsg);
            } else
                r = result;
        }, false);
        return r;
    }

    export function call(method: string, params: any) {
        params.session = service.session;
        if (method[0] !== "/")
            method = "/" + method;
        return new Promise<any>((r, e) => {
            ajax.post(method, params, function (err, result) {
                if (err) {
                    e(new Error(err.errMsg));
                    //alert(err.errMsg);
                    return;
                }
                let json = JSON.parse(result);
                if (json.status == 0) {
                    r(json.result);
                } else if (json.status == -101) {
                    alert("session过期，请重新登录");
                    window.location.href = window.location.protocol + "//" + window.location.host;
                    //window.location.reload(true);
                } else
                    e(new Error(json.message));
                //alert(json.message);
            }, true);
        });
    }

    export function pollNotify(url: string, cb: Function) {
        let params = {
            session: service.session
        };

        function poll() {
            ajax.post(url, params, function (err, result) {
                if (!err) {
                    let msgs = result.split("\n");
                    for (let i = 0; i < msgs.length; i++) {
                        let msg = msgs[i];
                        try {
                            cb(msg);
                        } catch (ex) {
                            console.error(ex);
                        }
                    }
                }
                poll();
            }, true);
        }
    }
    export function filterItem(item: {
        id: number,
        value: string
    }, value: string) {
        if (isNaN(Number(value))) {
            if (item.value.toLowerCase().indexOf(value.toLowerCase()) > -1) {
                return true;
            }
        } else {
            if (item.value.indexOf(value) == 0) {
                return true;
            }
        }
        return false;
    }
}

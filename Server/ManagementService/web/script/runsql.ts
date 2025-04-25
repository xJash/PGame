module runsql {
    export function runSQL(root: webix.ui.layout, parms: any) {
        root.addView({
            type: "wide", padding: 2,height:"100%",
            id: "mainPage",
            rows: [
                {
                    view: "layout", cols: [
                        { view: "label", label: "运行SQL", css: "title" },
                        { view: "label" },
                    ]
                },
                {
                    view: "layout", cols: [
                        multiServerOptions(getServerIDS, "selectServers"),
                        { view: "label" },
                    ]
                },
                {
                    view: "layout", cols: [
                        { view: "label" },
                        { view: "button", label: "运行", width: 100, click: runSql },
                    ]
                },
                {
                    view: "layout", cols: [
                        { view: "textarea", id: "input", label: "input sql", labelAlign: "left", height: 250 },
                    ]
                },
                {
                    view: "layout", cols: [
                        { view: "label" },
                    ]
                },
                {
                    view: "layout", cols: [
                        { view: "textarea", id: "output", label: "output", labelAlign: "left", height: 250 },
                    ]
                },
            ]
        });
        let serverIDs: Array<number> = [];
        function getServerIDS(ids: Array<number>) {
            serverIDs = ids;
        }

        var param: any;
        async function runSql() {
            param = {};
            param.sids = serverIDs.join(",");
            param.sql = $$('input').getValue();
            try {
                let r = await service.call("/sql/runSQL", param);
                $$('output').setValue(r);
            }
            catch (e) {
                alert(e.message);
            }
        }
    }
}
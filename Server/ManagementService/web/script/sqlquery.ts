module sqlquery {
  export function sqlQuery(root: webix.ui.layout, parms: any) {
    root.addView({
      type: "wide",
      padding: 2,
      height: "100%",
      id: "mainPage",
      rows: [
        {
          view: "layout",
          cols: [
            {
              view: "label",
              label: "SQL查询",
              css: "title"
            },
            {
              view: "label"
            },
                    ]
                },
        {
          view: "layout",
          cols: [
                        multiServerOptions(getServerIDS, "selectServers"),
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
              label: "查询",
              width: 100,
              click: exportQuery /*runQuerySQL*/
            },
            {
              view: "button",
              label: "导出",
              width: 100,
              click: exportQuery
            },
                    ]
                },
        {
          view: "layout",
          cols: [
            {
              view: "textarea",
              id: "input",
              label: "input sql",
              labelAlign: "left",
              height: 250
            },
                    ]
                },
        {
          view: "layout",
          cols: [
            {
              view: "label"
            },
                    ]
                },
        {
          view: "layout",
          id: "results",
          rows: []
                },
            ]
    });
    var index = 0;
    var queryResults = $$("results");

    let serverIDs: Array < number > = [];

    function getServerIDS(ids: Array < number > ) {
      serverIDs = ids;
    }

    var param: any;
    async function runQuerySQL() {
      param = {};
      if (serverIDs.length == 0) {
        alert("lack of server(s)");
        return;
      }
      param.sids = serverIDs.join(",");
      param.sql = $$('input').getValue();
      try {
        let r = await service.call("/sql/runQuerySQL", param);
        //queryResults.clearAll();
        for (let i = 0; i < index; i++) {
          if ($$(`datatable${i}`)) {
            queryResults.removeView(`datatable${i}`);
          }
        }
        let c = JSON.parse(r.columns);
        for (let i in r.results) {
          let json = r.results[i];
          queryResults.addView({
            view: "datatable",
            //datatype: "xml",
            resizeColumn: true,
            scroll: "y",
            id: `datatable${index}`,
            data: JSON.parse(json),
          });
          index++;
        }
      } catch (e) {
        alert(e.message);
      }
    }

    async function exportQuery() {
      param = {};
      if (serverIDs.length == 0) {
        alert("lack of server(s)");
        return;
      }
      param.sids = serverIDs.join(",");
      param.sql = $$('input').getValue();
      param.fn = "查询结果.csv";
      service.downloadFile("/sql/exportQuery", param);
    }
  }
}

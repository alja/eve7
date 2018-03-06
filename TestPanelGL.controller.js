sap.ui.define([
   'sap/ui/jsroot/GuiPanelController',
   'sap/ui/model/json/JSONModel'
], function (GuiPanelController, JSONModel) {
    "use strict";

    return GuiPanelController.extend("mysplit.TestPanelGL", {

        // function called from GuiPanelController
        onPanelInit : function() {
            var id = this.getView().getId();
            console.log("onPanelInit TestPanelGL id = " + id);
        },
        onInit : function() {
            var id = this.getView().getId();
            console.log("onInit AMT ???? TestPanelGL id = " + id);
         //   console.log("handle ",handle );
          //  handle.Send("dddddddddddddd");
        },

        // function called from GuiPanelController
        onPanelExit : function() {
        },

        ProcessMsg: function(msg) {
            console.log("AMT TestPanelGL  processmsg ---->", msg);
            if (msg.indexOf("GEO:")==0) {
                var json = msg.substr(4);
                var data = JSROOT.parse(json);

                if (data) {
                    var pthis = this;
	            JSROOT.draw("__xmlview2--panelGL", data, "", function(painter) {
                        console.log('TestPanelGL painter callback ==> painter', painter);
                        pthis.geo_painter = painter;
                        if (pthis.fast_event) pthis.drawExtra(pthis.fast_event);
                        pthis.geo_painter.Render3D();

		    });
                }
            }
            
            else if (msg.indexOf("EXT:")==0) {
                var json = msg.substr(4);
                var data = JSROOT.parse(json);
                if (this.drawExtra(data)) {
                    painter.Render3D();
                }

            }
            else {
                console.log('FitPanel Get message ' + msg);
            }
        },
        drawExtra : function(lst) {
            if (!this.geo_painter) {
                // no painter - no draw of event
                this.fast_event = lst;
                return false;
            }
            else {
                this.geo_painter.drawExtras(lst);
                //console.log("draw POINTS", lst);
                return true;
            }
        },

    });

});

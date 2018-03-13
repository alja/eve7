sap.ui.define([
   'sap/ui/jsroot/GuiPanelController',
    'sap/ui/model/json/JSONModel'
], function (GuiPanelController, JSONModel, ResizeHandler) {
    "use strict";

    return GuiPanelController.extend("eve.3D", {

        // function called from GuiPanelController
        onPanelInit : function() {
            var id = this.getView().getId();
            console.log("onPanelInit 3D id = " + id);            
	    ResizeHandler.register(this.getView(), this.onResize.bind(this));
        },
        onInit : function() {
            var id = this.getView().getId();
            console.log("onInit AMT ???? 3D id = " + id);
        },

        // function called from GuiPanelController
        onPanelExit : function() {
        },

        processMsg: function(msg) {
           // console.log("AMT 3D  processmsg ---->", msg);
            if (msg.indexOf("GEO:")==0) {
                var json = msg.substr(4);
                var data = JSROOT.parse(json);

                if (data) {
                    var pthis = this;
	            JSROOT.draw("TopEveId--MainPanel--panelGL", data, "", function(painter) {
                        console.log('3D painter callback ==> painter', painter);
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
                   this.geo_painter.Render3D();
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

                 this.geo_painter.clearExtras(); // remove old three.js container with tracks and hits

            
                //  this.geo_painter.drawExtras(lst);
                for (var n=0; n< lst.arr.length; ++n) {
                    this.geo_painter.drawHit(lst.arr[n], lst.arr[n].fName);
                }
                console.log(lst);
                console.log("PAINTER ", this.geo_painter);
                return true;
            }
        },
	onResize: function(event) {
            // use timeout
            console.log("resize painter")
            if (this.resize_tmout) clearTimeout(this.resize_tmout);
            this.resize_tmout = setTimeout(this.onResizeTimeout.bind(this), 300); // minimal latency
	},

	onResizeTimeout: function() {
            delete this.resize_tmout;
            if (this.geo_painter) {
		this.geo_painter.CheckResize();
		console.log("geo painter check resize ");
	    }
	}

    });

});

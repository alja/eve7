sap.ui.define([
    'sap/ui/jsroot/GuiPanelController',
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/ResizeHandler"
], function (GuiPanelController, JSONModel, ResizeHandler) {
    "use strict";

    return GuiPanelController.extend("eve.3D", {
        // function called from GuiPanelController
        onPanelInit : function() {
            console.log("onPanelInit id = ",  this.getView().getId());            
        },
        onInit : function() {
            console.log("onInit  id = ", this.getView().getId());
	    ResizeHandler.register(this.getView(), this.onResize.bind(this));
            DOCUMENT_READY = true;
            sap.ui.getCore().byId("TopEveId").getController().processWaitingMsg();
        },

        // function called from GuiPanelController
        onPanelExit : function() {
        },
        geometry:function(data) {
            var pthis = this;
            var id = this.getView().getId() + "--panelGL";
	    JSROOT.draw(id, data, "", function(painter) {
                console.log('3D painter initialized', painter);
                pthis.geo_painter = painter;
                if (pthis.fast_event) pthis.drawExtra(pthis.fast_event);
                pthis.geo_painter.Render3D();

	    });
        },
        event: function(data) {
            if (this.drawExtra(data)) {
                this.geo_painter.Render3D();
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
                    this.geo_painter.drawExtras(lst.arr[n], lst.arr[n].fName);
                }
                console.log(lst);
                // console.log("PAINTER ", this.geo_painter);
                return true;
            }
        },
	onResize: function(event) {
            // use timeout
            // console.log("resize painter")
            if (this.resize_tmout) clearTimeout(this.resize_tmout);
            this.resize_tmout = setTimeout(this.onResizeTimeout.bind(this), 300); // minimal latency
	},

	onResizeTimeout: function() {
            delete this.resize_tmout;
            if (this.geo_painter) {
		this.geo_painter.CheckResize();
	    }
	}

    });

});

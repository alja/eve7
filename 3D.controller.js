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
            /*
            if (this.drawExtra(data)) {
                this.geo_painter.Render3D();
            }*/

        },
        drawExtra : function(el) {
            if (!this.geo_painter) {
                // no painter - no draw of event
                this.fast_event = el;
                return false;
            }
            else {
                
                this.geo_painter.clearExtras(); // remove old three.js container with tracks and hits

                var producer = this;
                this[el.renderer](el);


                this.geo_painter.Render3D();
                // console.log("PAINTER ", this.geo_painter);

                return true;
            }
        },
        makeHit: function(hit) {
            /*
            el.fN = el.geoBuff.length;
            el.fP =  el.geoBuff;
            this.geo_painter.drawHit(el);
*/

      var hit_size = 8*hit.fMarkerSize,
          size = hit.geoBuff.length,
          pnts = new JSROOT.Painter.PointsCreator(size, true, hit_size);
            
for (var i=0;i<size;i++)
         pnts.AddPoint(hit.geoBuff[i*3],hit.geoBuff[i*3+1],hit.geoBuff[i*3+2]);
               var mesh = pnts.CreatePoints(JSROOT.Painter.root_colors[hit.fMarkerColor] || "rgb(0,0,255)");

      mesh.highlightMarkerSize = hit_size*3;
      mesh.normalMarkerSize = hit_size;

      mesh.geo_name = hit.fName;
      mesh.geo_object = hit;

      this.geo_painter.getExtrasContainer().add(mesh);
            /*
            // crate three js object
            var geom = new THREE.BufferGeometry();
            geom.addAttribute( 'position', new THREE.BufferAttribute( arr, 3 ) );
            el.fMarkerSize=3;
            var hitColor = JSROOT.Painter.root_colors[el.fMarkerColor] || "rgb(0,0,255)";
            var hit_size = 8*el.fMarkerSize;
            var material = new THREE.PointsMaterial( {size: hit_size, color:hitColor} );
            var mesh = new THREE.Points(this.geom, material);
            mesh.nvertex = 1; // AMT ???

            // AMT this is taken from TGeoPainter.prototype.drawHit
            mesh.highlightMarkerSize = hit_size*3;
            mesh.normalMarkerSize = hit_size;

            mesh.geo_name = el.fName;
            mesh.geo_object = el;
            console.log("hiy mesh ", mesh);
            this.geo_painter.getExtrasContainer().add(mesh);
*/

        },
        makeTrack: function(el, arr) {

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

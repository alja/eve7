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
            this.fast_event = [];


        },

        // function called from GuiPanelController
        onPanelExit : function() {
        },
        geometry:function(datax) {
            var data = datax[0]
            this.viewType = this.getView().data("type");
            var pthis = this;
            var id = this.getView().getId() + "--panelGL";
            console.log("geometry data ", this.viewType, data);
	    JSROOT.draw(id, data, "", function(painter) {
                console.log('3D painter initialized', painter);
                pthis.geo_painter = painter;


                if (pthis.fast_event) pthis.drawExtra();

                if (pthis.viewType != "3D") {

                    
                    var a = 451;
                    painter._camera =  new THREE.OrthographicCamera(-a, a, -a, a, -a, a);
                    painter._camera.position.x = 0;
                    painter._camera.position.y = 0;
                    painter._camera.position.z = a-90;
                    console.log("camera ",   painter._camera);

             //       painter.options.project = "x";
             //       painter.options.projectPos = 10; 
                }

                pthis.geo_painter.Render3D();

	    });
        },
        event: function(data) {
            /*
            if (this.drawExtra(data)) {
                this.geo_painter.Render3D();
            }*/
        },
        endChanges: function(val) {

            this.needRedraw = true;
        },
        drawExtra : function(el) {
            if (!this.geo_painter) {
                // no painter - no draw of event
                this.fast_event.push(el);
                return false;
            }
            else {
               // this.geo_painter.clearExtras(); // remove old three.js container with tracks and hits
                var len = this.fast_event.length;
                for(var i = 0; i < len;  i++){
                    var  x = this.fast_event.pop();
                    var rnrData = x[this.viewType];
                    console.log("calling rendere ",rnrData.rnrFunc, rnrData );
                    this[rnrData.rnrFunc](x, rnrData);                    
                }
                if (el) {this[x.renderer](x);}
                if (this.needRedraw) {
                    this.geo_painter.Render3D();
                    this.needRedraw = false;
                }
                // console.log("PAINTER ", this.geo_painter);

                return true;
            }
        },
        makeHit: function(hit, rnrData) {
            console.log("drawHit ", hit, "this type ", this.viewType);
            var hit_size = 8*rnrData.fMarkerSize,
                size = rnrData.glBuff.length/3,
                pnts = new JSROOT.Painter.PointsCreator(size, true, hit_size);
            
            for (var i=0;i<size;i++) {
                pnts.AddPoint(rnrData.glBuff[i*3],rnrData.glBuff[i*3+1],rnrData.glBuff[i*3+2]);
               // console.log("add vertex ", rnrData.glBuff[i*3],rnrData.glBuff[i*3+1],rnrData.glBuff[i*3+2]);
            }
            var mesh = pnts.CreatePoints(JSROOT.Painter.root_colors[rnrData.fMarkerColor] || "rgb(0,0,255)");

            mesh.highlightMarkerSize = hit_size*3;
            mesh.normalMarkerSize = hit_size;

            mesh.geo_name = hit.fName;
            mesh.geo_object = hit;

            this.geo_painter.getExtrasContainer().add(mesh);
            mesh.visible = hit.fRnrSelf;
            return mesh;
        },
        makeTrack: function(track, rnrData) {            
            var N = rnrData.glBuff.length/3;
            var track_width = track.fLineWidth || 1,
                track_color = JSROOT.Painter.root_colors[track.fLineColor] || "rgb(255,0,255)";

            var buf = new Float32Array(N*3*2), pos = 0;
            for (var k=0;k<(N-1);++k) {
                buf[pos]   = rnrData.glBuff[k*3];
                buf[pos+1] = rnrData.glBuff[k*3+1];
                buf[pos+2] = rnrData.glBuff[k*3+2];
                buf[pos+3] = rnrData.glBuff[k*3+3];
                buf[pos+4] = rnrData.glBuff[k*3+4];
                buf[pos+5] = rnrData.glBuff[k*3+5];
                // console.log(" vertex ", buf[pos],buf[pos+1], buf[pos+2],buf[pos+3], buf[pos+4],  buf[pos+5]);
                pos+=6;
            }
            var lineMaterial = new THREE.LineBasicMaterial({ color: track_color, linewidth: track_width }),
                line = JSROOT.Painter.createLineSegments(buf, lineMaterial);

            line.geo_name = track.fName;
            line.geo_object = track;
            this.geo_painter.getExtrasContainer().add(line);
            line.visible = track.fRnrSelf;
            return line;
        },
        replaceElement:function(el) {
            var ec = this.geo_painter.getExtrasContainer();
            var c = ec.children;
            
            for (var i = 0; i < c.length; ++i) {
                if (c[i].geo_object.guid == el.guid) {
                    console.log("replace 3D");
                    ec.remove(c[i]);
                }
            }
            this[el.renderer](el);             
            this.geo_painter.Render3D();
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

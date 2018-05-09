
/*
function EveJetConeGeometry(vertices)
{
    THREE.BufferGeometry.call( this );

    this.addAttribute( 'position', new THREE.BufferAttribue( vertices, 3 ) );

    var N = vertices.length / 3;
    var idcs = [];
    for (var i = 1; i < N - 1; ++i)
    {
        idcs.push( i ); idcs.push( 0 ); idcs.push( i + 1 );
    }
    this.setIndex( idcs );
}

EveJetConeGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
EveJetConeGeometry.prototype.constructor = EveJetConeGeometry;
*/


sap.ui.define([
    'sap/ui/jsroot/GuiPanelController',
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/ResizeHandler"
], function (GuiPanelController, JSONModel, ResizeHandler) {
    "use strict";

    return GuiPanelController.extend("eve.GL", {
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
        geometry:function(data) {
            var pthis = this;
            var id = this.getView().getId() + "--panelGL";
	    JSROOT.draw(id, data, "", function(painter) {
                console.log('GL painter initialized', painter);
                pthis.geo_painter = painter;
                if (pthis.fast_event) pthis.drawExtra();
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
           // console.log("drawExtra ");
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
                    this[x.renderer](x);                    
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
        makeHit: function(hit) {
           // console.log("drawHit ", hit);
            var hit_size = 8*hit.fMarkerSize,
                size = hit.geoBuff.length/3,
                pnts = new JSROOT.Painter.PointsCreator(size, true, hit_size);
            
            for (var i=0;i<size;i++)
                pnts.AddPoint(hit.geoBuff[i*3],hit.geoBuff[i*3+1],hit.geoBuff[i*3+2]);
            var mesh = pnts.CreatePoints(JSROOT.Painter.root_colors[hit.fMarkerColor] || "rgb(0,0,255)");

            mesh.highlightMarkerSize = hit_size*3;
            mesh.normalMarkerSize = hit_size;

            mesh.geo_name = hit.fName;
            mesh.geo_object = hit;

            this.geo_painter.getExtrasContainer().add(mesh);
            mesh.visible = hit.fRnrSelf;
            return mesh;
        },
        makeTrack: function(track) {            
            var N = track.geoBuff.length/3;
            var track_width = track.fLineWidth || 1,
                track_color = JSROOT.Painter.root_colors[track.fLineColor] || "rgb(255,0,255)";

            var buf = new Float32Array(N*3*2), pos = 0;
            for (var k=0;k<(N-1);++k) {
                buf[pos]   = track.geoBuff[k*3];
                buf[pos+1] = track.geoBuff[k*3+1];
                buf[pos+2] = track.geoBuff[k*3+2];
                buf[pos+3] = track.geoBuff[k*3+3];
                buf[pos+4] = track.geoBuff[k*3+4];
                buf[pos+5] = track.geoBuff[k*3+5];
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
        makeJet: function(jet) {
            //var geo = new EveJetConeGeometry(jet.geoBuff);
            var geo = new THREE.BufferGeometry;
            geo.addAttribute('position', new THREE.BufferAttribute( jet.geoBuff, 3 ) );
            {
                var N = jet.geoBuff.length / 3;
                var idcs = [];
                idcs.push( N - 1 );  idcs.push( 0 );  idcs.push( 1 );
                for (var i = 1; i < N - 1; ++i)
                {
                    idcs.push( i );  idcs.push( 0 );  idcs.push( i + 1 );
                }
                geo.setIndex( idcs );
            }

            var jet_ro = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff0000) }));
            jet_ro.geo_name = jet.fName;
            jet_ro.geo_object = jet;
            this.geo_painter.getExtrasContainer().add(jet_ro);
            jet_ro.visible = jet.fRnrSelf;
            return jet_ro;
        },
        replaceElement:function(el) {
            var ec = this.geo_painter.getExtrasContainer();
            var c = ec.children;
            
            for (var i = 0; i < c.length; ++i) {
                if (c[i].geo_object.guid == el.guid) {
                    console.log("replace GL");
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

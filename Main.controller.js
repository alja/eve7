sap.ui.define(['sap/ui/core/mvc/Controller'],
	function(Controller) {
	    "use strict";

	    var SplitterController = Controller.extend("eve.Main", {

		onInit: function () {
		    console.log("SPLIT CONTROLLER \n");
		},
                getHandle: function () {
                    return this.handle;
                },
	        OnWebsocketMsg: function(handle, msg) {
                    this.handle = handle;
                    // console.log("OnWebsocketMsg response ", msg);
                    var resp = JSON.parse(msg);
                    if (resp.function === "geometry") {
                        var ele =  this.getView().byId("3D");
                        if (!ele) return;
                        var cont = ele.getController();
                        cont[resp.function](resp.args[0]);
                    }
                    else if (resp.function === "event") {
                        console.log("EVE ", resp);
                        this._event = resp.args[0];
                        this.event();
                    }
                    else if (resp.function === "replaceElement") {
                        console.log("replace element ", msg);
                        // find the element with guid in the event ... currently one level
                        var id = resp.element.guid;
                        console.log("going to change ele ", id);
                        this._event.arr[id] = resp.element;
                        // this.event(this._event)
                        this.event();
                    }
                },
                event: function() {
                      //  this._event = lst;
                        {
                        var ele =  this.getView().byId("3D");
                        console.log("ele 3D >>>> ", ele);
                        if (!ele) return;
                        var cont = ele.getController();
                            cont["event"]( this._event);
                        }
                        {
                        var ele =  this.getView().byId("Summary");
                        console.log("ele Sum", ele);
                        if (!ele) return;
                            var cont = ele.getController();
                            
                        console.log("ele Sum cont", cont);
                            cont.event( this._event);
                        }
                },
		setMainVerticalSplitterHeight: function(){
                    var mainViewHeight = document.body.clientHeight;
		    var mainToolbarHeight = 49;
		    var height = mainViewHeight - mainToolbarHeight;    
		    var splitter =  this.getView().byId("MainAreaSplitter");
		    if (splitter) {
		        //console.log("set splitter height >>>  " , height);		
                        splitter.setHeight(height + "px");
                    }
		},
		onAfterRendering: function(){
		    var me = this;
		    setTimeout(
			function(){
			    $(window).on("resize", function(){
				me.setMainVerticalSplitterHeight();
			    });
			    me.setMainVerticalSplitterHeight();
			},
			100
		    );
		    
		}
	    });

	    return SplitterController;

});

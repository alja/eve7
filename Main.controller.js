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
                        this.event = resp.args[0];
                        {
                        var ele =  this.getView().byId("3D");
                        console.log("ele ", ele);
                        if (!ele) return;
                        var cont = ele.getController();
                            cont[resp.function](resp.args[0]);
                        }
                        {
                        var ele =  this.getView().byId("Summary");
                        console.log("ele Sum", ele);
                        if (!ele) return;
                        var cont = ele.getController();
                            cont[resp.function](resp.args[0]);
                        }
                    }
                    else if (resp.function === "replaceElement") {
                        console.log("replace element ", msg);
                        // find the element with guid in the event ... currently one level
                        var id = resp.element.guid;
                        console.log("going to change ele ", id);
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

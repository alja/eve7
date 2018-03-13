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
                    var c =  this.byId("MainPanel").getController();
                    console.log(".....MainPanel . ", c);
                    c.processMsg(msg);
                },
		setMainVerticalSplitterHeight: function(){
                    var mainViewHeight = document.body.clientHeight;
		    var mainToolbarHeight = 49;
		    var height = mainViewHeight - mainToolbarHeight;
		    //console.log("height >>>  " , height);		    
		    var splitter =  this.getView().byId("MainAreaSplitter");
		    if (splitter) {
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

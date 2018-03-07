sap.ui.define(['sap/ui/core/mvc/Controller'],
	function(Controller) {
	"use strict";

	var SplitterController = Controller.extend("mysplit.Splitter", {

		onInit: function () {
		    console.log("SPLIT CONTROLLER \n");
		},
	    
		      setMainVerticalSplitterHeight: function(){
			  var mainViewHeight =screen.height;
		//	  
                          var mainViewHeight = document.body.clientHeight;
//			  console.log(" this view ", this.getView());
			  var mainToolbarHeight = 49;
			  var height = mainViewHeight - mainToolbarHeight;
			  console.log("height >>>  " , height);
			  
			  var splitter =  this.getView().byId("mainSplitter");
			  console.log("splitter dddd ", splitter);
			  splitter.setHeight(height + "px");
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

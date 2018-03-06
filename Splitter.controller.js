sap.ui.define(['sap/ui/core/mvc/Controller'],
	function(Controller) {
	"use strict";

	var SplitterController = Controller.extend("mysplit.Splitter", {

		onInit: function () {
		    console.log("SPLIT CONTROLLER \n");
		}
	});

	return SplitterController;

});

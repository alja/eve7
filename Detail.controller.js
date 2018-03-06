sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller"
], function (JSONModel, Controller, MessageToast) {
    "use strict";

    return Controller.extend("flexiblecolumnlayout.Detail", {
	onInit: function () {
	    this.oRouter = this.getOwnerComponent().getRouter();
	    this.oModel = this.getOwnerComponent().getModel();
	    
	    console.log("set tank model");
	    var oModel3 = new sap.ui.model.json.JSONModel({ 
                filename: "https://root.cern/js/files/zdemo.root", 
		itemname: "geom", 
		opt: "z" 
	    });
	    sap.ui.getCore().setModel(oModel3, "__xmlview2--panel3");
	    
	},
	testABC: function(args) {

	    alert("testABC args"+ args);
	    console.log("!!!!!Called function testABC() , args = ", args);
	},
	test: function() {
	    console.log("!!!!!Called function test");
	},
	handleDetailPress: function () {
	    var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(2);
	    this.oRouter.navTo("detailDetail", {layout: oNextUIState.layout});
	},
	handleFullScreen: function () {
	    var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
	    this.oRouter.navTo("detail", {layout: sNextLayout});
	},
	handleExitFullScreen: function () {
	    var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
	    this.oRouter.navTo("detail", {layout: sNextLayout});
	},
	handleClose: function () {
	    var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
	    this.oRouter.navTo("master", {layout: sNextLayout});
	},
	handlePainter: function() {
	    var page = sap.ui.getCore().byId("__xmlview2--p3");
	    console.log("page ", page);

	    
	    var panel = sap.ui.getCore().byId("__xmlview2--panel3");
	    console.log("panel ", panel);

            var obj_painter = null;
            var panelController = panel.getController();
	    console.log("controller ", panelController);
	    var obj_painter = null;
         panel.getController().getPainter(function(painter) {
             obj_painter = painter;
	     console.log(" AMT this is painter callback");

         });
	    console.log(" Detail controller handlePainter exit", obj_painter);
	}

    });
}, true);

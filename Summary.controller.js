sap.ui.define([
    'sap/ui/core/mvc/Controller',
    "sap/ui/model/json/JSONModel"
], function(Controller, JSONModel) {
    "use strict";

    return Controller.extend("eve.Summary", {
	onInit: function () {
            
            	 var data = [
	     {
		 text: "A-Node",
 		 nodes: [
 		     {
 			 text: "A-Node1"
 		     },
 		     {
 			 text: "A-Node2"
 		     },
 		     {
 			 text: "A-Node3"
 		     }
 		 ]
	     },
 	     {
 		 text: "B-Node",
 		 nodes: [
 		     {
			 somethingDifferent: "515",
 			 text: "B-Node1",
                         selected: Boolean(1)
 		     },
 		     {
 			 
 			 text: "B-Node2"
 		     }
 		 ]
 	     }
 	         ];
            
            var oTree = this.getView().byId("tree");
	    oTree.setMode(sap.m.ListMode.Single);
	    oTree.setIncludeItemInSelection(true);
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(data);
	    
	 oTree.setModel(oModel, "myModelName");

	    var oStandardTreeItem = new  sap.m.StandardTreeItem({
	        title: "{myModelName>text}",
                type: sap.m.ListType.Detail
	    });
	    oTree.bindItems("myModelName>/", oStandardTreeItem);

            
	},
        event: function(list) { 






            
        },
        changeNumPoints:function()
        {
            console.log("printEvent ", this.amdata.number);
            
        }
	
    });

});

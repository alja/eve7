sap.ui.define([
    'sap/ui/core/mvc/Controller',
    "sap/ui/model/json/JSONModel"
], function(Controller, JSONModel) {
    "use strict";

    return Controller.extend("eve.Summary", {
	onInit: function () {
            
            	 var data = [
	     {
		 text: "Event"
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
            this.tree = oTree;
            this.model = oModel;
            
	},
        event: function(lst) { 
            console.log("summary event lst \n", lst);
            var oTreeData = [];
            
            for (var n=0; n< lst.arr.length; ++n) {
                var el = {text : lst.arr[n].fName , uid : lst.arr[n].guid };
                oTreeData.push(el);
            }
            var eventData = { "text" : "Event", "uid" : 77, nodes : oTreeData};
            console.log("event model ", eventData);

            this.model.setData([]);
            this.model.setData([eventData]);
            this.model.refresh(true);

            
        },
        onItemPressed: function(oEvent)
        {
	    console.log("path", oEvent.getParameter("listItem").getBindingContext("myModelName").getPath());	
        },
        changeNumPoints:function()
        {
            console.log("printEvent ", this.amdata.number);
            
        }
	
    });

});

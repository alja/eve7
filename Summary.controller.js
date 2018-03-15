sap.ui.define([
    'sap/ui/core/mvc/Controller',
    "sap/ui/model/json/JSONModel"
], function(Controller, JSONModel) {
    "use strict";

    var deep_value = function(obj, path){
        for (var i=0, path=path.split('/'), len=path.length; i<len; i++){
            obj = obj[path[i]];
        };
        return obj;
    };
    return Controller.extend("eve.Summary", {
	onInit: function () {
            
            	 var data = [
	     {
		 fName: "Event"
	     }
 	         ];
            
            var oTree = this.getView().byId("tree");
	    oTree.setMode(sap.m.ListMode.Single);
	    oTree.setIncludeItemInSelection(true);
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(data);
	    
	 oTree.setModel(oModel, "myModelName");

	    var oStandardTreeItem = new  sap.m.StandardTreeItem({
	        title: "{myModelName>fName}",
                type: sap.m.ListType.Detail
	    });
	    oTree.bindItems("myModelName>/", oStandardTreeItem);
            this.tree = oTree;
            this.model = oModel;
            
	},
        event: function(lst) {
            this.event = lst;
            console.log("summary event lst \n", lst);
            
            var oTreeData = [];
            
            for (var n=0; n< lst.arr.length; ++n) {
                var el = {fName : lst.arr[n].fName , uid : lst.arr[n].guid };
                oTreeData.push(el);
            }

            var eventData = { "fName" : "Event", "uid" : 77, "arr" : oTreeData};
            console.log("event model ", eventData);

            this.model.setData([]);
            this.model.setData([eventData]);
            this.model.refresh(true);
            this.tree.expandToLevel(3);

            
        },
        
        onItemPressed: function(oEvent)
        {
	    //console.log("path", oEvent.getParameter("listItem").getBindingContext("myModelName").getPath());
	    var path =  oEvent.getParameter("listItem").getBindingContext("myModelName").getPath();
            path = path.substring(3);
    	    console.log("deep val ", deep_value(this.event, path));

            
        },
        changeNumPoints:function()
        {
            console.log("printEvent ", this.amdata.number);
            
        }
	
    });

});

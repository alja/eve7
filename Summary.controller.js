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


            var gedModel = 
		{
	            "ROOT::Experimental::TEvePointSet" : [
		        {
			    name : "N points",
			    function: "changeNpoints",
			    value : 1
			},
		        {
			    name : "Range",
			    function: "changeRange",
			    value : 1
			}
	            ],
	            "ROOT::Experimental::TEveTrack" : [
		        {
			    name : "Line width",
			    function: "change Line Width",
        		    value : 1
		        },
		        {
			    name : "Fit",
			    function: "changeFit",
			    value : true
			}
	            ]
		};
	    sap.ui.getCore().setModel(this.oProductModel, "ged");
            
	},
        event: function(lst) {
            this._event = lst;
            console.log("summary event lst \n", lst);
            
            var oTreeData = [];
            
            for (var n=0; n< lst.arr.length; ++n) {
                var el = {fName : lst.arr[n].fName , guid : lst.arr[n].guid, _typename :  lst.arr[n]._typename};
                oTreeData.push(el);
            }

            var eventData = { "fName" : lst.fName, "guid" : lst.guid, "arr" : oTreeData, _typename: lst._typename};
            console.log("event model ", eventData);

            this.model.setData([]);
            this.model.setData([eventData]);
            this.model.refresh(true);
            this.tree.expandToLevel(3);
	    sap.ui.getCore().setModel(this.model, "myModelName");

            
            this.oProductModel = new sap.ui.model.json.JSONModel();
	    this.oProductModel.setData([this._event]);
	    sap.ui.getCore().setModel(this.oProductModel, "event");
        },
        
        onItemPressed: function(oEvent)
        {
	    //console.log("path", oEvent.getParameter("listItem").getBindingContext("myModelName").getPath());
	    var path =  oEvent.getParameter("listItem").getBindingContext("myModelName").getPath();
            path = path.substring(3);
    	    console.log("deep val ", deep_value(this._event, path));
            this.editorElement = deep_value(this._event, path);

            var oProductDetailPanel = this.byId("productDetailsPanel");
            // var title =   this.editorElement.fName + " (" + this.editorElement._typename + " )" ;
            var title =  this.editorElement._typename ;
            oProductDetailPanel.setHeaderText(title);

            var eventPath = oEvent.getParameter("listItem").getBindingContext("myModelName").getPath();
            //  eventPath="/arr/1";
	    var oProductDetailPanel = this.byId("productDetailsPanel");
            console.log("event path ", eventPath);
	    oProductDetailPanel.bindElement({ path: eventPath, model: "event" });
        },
        setupGED:function()
        {
            var gedView = this.getView().byId.GED();
            gedView.destroyContent();
            
            var guiDef = this.guiModel[ this.editorElement._typename];
            for (var i = 0; i < guiDef.length; ++i) {
                widget = guiDef[1];
	        switch(typeof this.editorElement._typename) {
	        case "string":
		    return new Text(sId, {
		        text: {
			    path: "revenue",
			    type: new StringType()
		        }
		    });
		    
	        case "number":
		    return new Input(sId, {
		        value: {
			    path: "revenue",
			    type: new Float()
		        },
		        change: function(oEvent) { tc.onInputChange(oEvent);}
		    });
		    
	        case "boolean":
		    return new CheckBox(sId, {
		        checked: {
			    path: "revenue"
		        },
		        select: function(event) {
			    console.log("fff checkbox", event.getSource().getBindingContext().getPath());
		        }
		    });
	        }
            }
            
        },
        changeNumPoints:function()
        {
            var myJSON = "changeNumPoints(" +  this.editorElement.guid + ", "  + this.editorElement.fN +  ")";
            sap.ui.getCore().byId("TopEveId").getController().getHandle().Send(myJSON);
        },
	printEvent: function(event)
        {  
            var propertyPath = event.getSource().getBinding("value").getPath();
            console.log("property path ", propertyPath);
            var bindingContext = event.getSource().getBindingContext("event");

            var path =  bindingContext.getPath(propertyPath);
            var object =  bindingContext.getObject(propertyPath);
            console.log("obj ",object );
            // alert("You have change : "+ path + " = " + object + " element " + JSON.stringify(this.editorElement));

            this.changeNumPoints();
        },
	changeRnrSelf: function(event)
        {
            console.log("change Rnr ", event.getParameters());
            
            var myJSON = "changeRnrSelf(" +  this.editorElement.guid + ", "  + event.getParameters().selected +  ")";
            sap.ui.getCore().byId("TopEveId").getController().getHandle().Send(myJSON); 
        },
	changeRnrChld: function(event)
        {
            console.log("change Rnr ", event, " source ", event.getSource());
        }
    });

});

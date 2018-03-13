sap.ui.define(['sap/ui/core/mvc/Controller', "sap/ui/model/json/JSONModel"],
	      function(Controller, JSONModel) {
		  "use strict";

		  var SSc = Controller.extend("eve.Summary", {

                      amdata : {"number" : "123"},

		      onInit: function () {
			  console.log("summary controller !!!");


                          var oModel = new JSONModel(this.amdata);
                          this.getView().setModel(oModel);

                          
		      },
                      changeNumPoints:function()
                      {
                          console.log("printEvent ", this.amdata.number);
/*
                          var ret = {
                              "functionName":"changeNumPoints ",
                              "args" : this.amdata
                          }
                          // var myJSON = "changeNumPoints " + JSON.stringify(this.amdata);
                          var myJSON =  JSON.stringify(ret);
*/
                          var myJSON = "changeNumPoints(" +  this.amdata.number + ")";
                          
                          
                      }
		      
		  });

		  return SSc;

	      });

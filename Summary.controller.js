sap.ui.define(['sap/ui/core/mvc/Controller', "sap/ui/model/json/JSONModel"],
	      function(Controller, JSONModel) {
		  "use strict";

		  var SSc = Controller.extend("mysplit.Summary", {

                      amdata : {"number" : "123"},

		      onInit: function () {
			  console.log("summary controller !!!");


                          var oModel = new JSONModel(this.amdata);
                          this.getView().setModel(oModel);

                          
		      },
                      requesetNewN:function()
                      {
                          console.log("requesetNewN\n");
                          globalHandle.Send("changeNumPoints()"); 
                      },
                      printEvent:function()
                      {
                          console.log("printEvent ", this.amdata.number);
                          globalHandle.Send("changeNumPoints()"); 
                      }
		      
		  });

		  return SSc;

	      });

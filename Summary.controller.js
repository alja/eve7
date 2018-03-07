sap.ui.define(['sap/ui/core/mvc/Controller'],
	      function(Controller) {
		  "use strict";

		  var SSc = Controller.extend("mysplit.Summary", {

		      onInit: function () {
			  console.log("summary controller !!!");
		      }
		      
		  });

		  return SSc;

	      });

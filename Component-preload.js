sap.ui.define(['sap/ui/core/UIComponent'],
	function(UIComponent) {
	"use strict";

	var Component = UIComponent.extend("mysplit.Component", {

		metadata : {
			rootView : "mysplit.Main",
			dependencies : {
				libs : [
					"sap.ui.commons",
					"sap.ui.layout"
				]
			},
			config : {
				sample : {
					files : [
						"Main.view.xml",
					        "Main.controller.js",
					        "TestPanelGL.view.xml",
  					        "TestPanelGL.controller.js",
					        "Summary.view.xml",
						"Summary.controller.js"
					]
				}
			}
		},

		onAfterRendering : function() {
		}
	});

	return Component;

});

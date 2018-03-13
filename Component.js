sap.ui.define(['sap/ui/core/UIComponent'],
	function(UIComponent) {
	"use strict";

	var Component = UIComponent.extend("eve.Component", {

		metadata : {
			rootView : "eve.Main",
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
					        "3D.view.xml",
  					        "3D.controller.js",
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

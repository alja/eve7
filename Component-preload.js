sap.ui.define(['sap/ui/core/UIComponent'],
	function(UIComponent) {
	"use strict";

	var Component = UIComponent.extend("mysplit.Component", {

		metadata : {
			rootView : "mysplit.Splitter",
			dependencies : {
				libs : [
					"sap.ui.commons",
					"sap.ui.layout"
				]
			},
			config : {
				sample : {
					files : [
						"Splitter.view.xml",
					        "Splitter.controller.js",
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

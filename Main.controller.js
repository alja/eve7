sap.ui.define(['sap/ui/core/mvc/Controller'],
	function(Controller) {
	    "use strict";

	    var SplitterController = Controller.extend("eve.Main", {

		onInit: function () {
		    console.log("SPLIT CONTROLLER \n");

		       {
                        var sv =  this.getView().byId("ViewAreaSplitter");
                        console.log("view Name ", sv);
		        console.log("SPLIT CONTROLLER == ", sv.getContentAreas());
                        var ca = sv.getContentAreas();
                        console.log("primary ",ca[0].data("type"), ca[0] );
                        viewManager.addView(ca[0].getId(), ca[0].data("type"));
                    }

                    {

                        var sv =  this.getView().byId("SecondaryView");
			if (sv) {
                        var ca = sv.getContentAreas();
                        for (var i = 0; i < ca.length; ++i) {
                            console.log("seconary  ",  i ,  ca[i].data("type"), ca[i].getId());
                            viewManager.addView(ca[i].getId(), ca[i].data("type"));

                        }
			}
                    }

                    DOCUMENT_READY = true;
                    this.processWaitingMsg();
		},
                getHandle: function () {
                    return this.handle;
                },
	        OnWebsocketMsg: function(handle, msg) {
                    this.handle = handle;
                    
                    if (typeof msg != "string") {
                        
                        
                        console.log('TestPanel ArrayBuffer size ' +  msg.byteLength);
                        var sizeArr = new Int8Array(msg, 0, 1);
                        var textSize = sizeArr[0];
                        console.log("textsize ", textSize);
                        var arr = new Int8Array(msg, 1, textSize);
                        var str = String.fromCharCode.apply(String, arr);
                        console.log("str = ", str);
                        
                        var obj = JSON.parse(str);
                        console.log("---------------------------- renderer comming ", obj);
                        // TODO string to JSON !!!
                        var headerOff = 4*Math.ceil((1+textSize)/4.0);  

                        var fArr = new Float32Array(msg, headerOff);

                        var el = this.findElementWithId(obj.guid, this._event);

                        console.log("find element ", el);
                        
                        el.renderer = obj.renderer;
                        el.geoBuff = fArr;
                        /*
                        var v =  this.getView().byId("GL");
                        var cont = v.getController();
                        cont.drawExtra(el);                        
                        */
                        viewManager.envokeFunction("drawExtra", el);
                        return;
                    }


                    
                    // console.log("OnWebsocketMsg response ", msg);
                    var resp = JSON.parse(msg);
                    if (resp.function === "geometry") {
			/*
                        var ele =  this.getView().byId("GL");
                        if (!ele) return;
                        var cont = ele.getController();
                        cont[resp.function](resp.args[0]);
                        */
			viewManager.envokeFunction("geometry", resp.args[0]);
                    }
                    else if (resp.function === "event") {
                        console.log("EVE ", resp);
                        this._event = resp.args[0];
                        this.event();
                    }
                    else if (resp.function === "replaceElement") {
                        console.log("replace element ", resp);
                        // find the element with guid in the event ... currently one level

                        var obj = this.findElementWithId(resp.element.guid, this._event);

                         console.log("DEBUG .... got a reference to OLD  ", obj.parent);
                         resp.element.renderer = obj.renderer;
                         resp.element.geoBuff = obj.geoBuff;
                        

                        // TO DO .... destruct original obj, copy binary render data

                        console.log("DEBUG .... new event ", this._event);
                        /*
                        var ele =  this.getView().byId("GL");
                        var cont = ele.getController();
                        cont.replaceElement(resp.element);
			*/
			viewManager.envokeFunction("replaceElement", resp.element);
                        this.event();

                    }
                    else if (resp.function === "endChanges") {
                        this.endChanges = resp.val;
                        if (resp.val) {
			    /*
                            var ele =  this.getView().byId("GL");
                            var cont = ele.getController();
                            cont.endChanges(resp.val);
			    */
			    viewManager.envokeFunction("endChanges", resp.val);
                        }
                    }
                },
                processWaitingMsg: function() {
                    for ( var i = 0; i < msgToWait.length; ++i ) {
                        this.OnWebsocketMsg(handleToWait, msgToWait[i]);
                    }
                    handleToWait = 0;
                    msgToWait = [];
                },
                event: function() {
                    //  this._event = lst;
		    /*
                    {
			
                        var ele =  this.getView().byId("GL");
                        console.log("ele GL >>>> ", ele);
                        if (!ele) return;
                        var cont = ele.getController();
                            cont["event"]( this._event);
                        }
		    */
		    viewManager.envokeFunction("event", this._event);
                        {
                        var ele =  this.getView().byId("Summary");
                       // console.log("ele Sum", ele);
                        if (!ele) return;
                            var cont = ele.getController();
                            
                        // console.log("ele Sum cont", cont);
                            cont.event( this._event);
                        }
                },
		setMainVerticalSplitterHeight: function(){
                    var mainViewHeight = document.body.clientHeight;
		    var mainToolbarHeight = 49;
		    var height = mainViewHeight - mainToolbarHeight;    
		    var splitter =  this.getView().byId("MainAreaSplitter");
		    if (splitter) {
		        //console.log("set splitter height >>>  " , height);		
                        splitter.setHeight(height + "px");
                    }
		},
		onAfterRendering: function(){
		    var me = this;
		    setTimeout(
			function(){
			    $(window).on("resize", function(){
				me.setMainVerticalSplitterHeight();
			    });
			    me.setMainVerticalSplitterHeight();
			},
			100
		    );
		    
		},
                findElementWithId: function(valueToSearch, el) {
                    if (!el) {
                        el = this._event;
                    }
                    console.log("serach ",valueToSearch, "in", el )
                    if (el.guid == valueToSearch) {
                        console.log("found it findElementWithId ", el)
                        return el;
                    }
                    if ( el.arr) {
                        for (var i = 0; i < el.arr.length; i++) {
                            var x = this.findElementWithId(valueToSearch, el.arr[i]);
                            if (x) return x; 
                        }
                    }
                    return 0;
                }
	    });

	    return SplitterController;

});

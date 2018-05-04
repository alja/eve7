sap.ui.define(['sap/ui/core/mvc/Controller'],
	function(Controller) {
	    "use strict";

	    var SplitterController = Controller.extend("eve.Main", {


		onInit: function () {

           
            console.log("ViewManager 3D ",  this);
            console.log("ViewManager 3D view ",this.getView());
            console.log("ViewManager 3D view ",this.getView().data("type"));
                    
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
                        var ca = sv.getContentAreas();
                        for (var i = 0; i < ca.length; ++i) {
                            console.log("seconary  ",  i ,  ca[i].data("type"), ca[i].getId());
                            viewManager.addView(ca[i].getId(), ca[i].data("type"));

                        }
                    }

                    console.log("main on init ", viewManager);
                    // 
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
                        var textSize = 11;
                        {
                        var sizeArr = new Int32Array(msg, 0, 4);
                            textSize = sizeArr[0];
                            
                            console.log("textsize 4", textSize);
                        }
                        
                        var arr = new Int8Array(msg, 4, textSize);
                        var str = String.fromCharCode.apply(String, arr);
                        console.log("core header = ", str);
                        

                        var off = 4+ textSize;
                        var renderData = JSON.parse(str);

                        var vtArr = [];
                        var el = this.findElementWithId(renderData.guid, this._event);
                        for (var i = 0; i < renderData["hsArr"].length; ++i)
                        {
                            var vha = new Int8Array(msg, off,renderData["hsArr"][i]);
                            str = String.fromCharCode.apply(String, vha);
                            // console.log("off ", off, "viewHeader header = ", str);
                            off  =  4*Math.ceil((off+renderData["hsArr"][i])/4.0);
                            // console.log("arr off ", off);
                            var fArr = new Float32Array(msg, off, renderData["bsArr"][i]/4);
                            off+=renderData["bsArr"][i];
                            // console.log("farr ", fArr);

                            
                            var vo = JSON.parse(str);
                            vo["glBuff"] = fArr;
                            el[vo.viewType] = vo;
                           // vtArr.push({"header": vo, "glBuff": fArr, "type":vo.viewType})                            
                        }

                        console.log("element with rendering info ", el);
                       
                        
                        return;
                    }
                    
                    // console.log("OnWebsocketMsg response ", msg);
                    var resp = JSON.parse(msg);
                    if (resp.function === "geometry") {
                        viewManager.envokeViewFunc("3D", "geometry", resp.args[0]);
                        
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
                        

                        console.log("DEBUG .... new event ", this._event);
                        
                        
                        viewManager.envokeViewFunc("3D", "replaceElement", resp.element);
                        this.event();

                    }
                    else if (resp.function === "endChanges") {
                        this.endChanges = resp.val;
                        if (resp.val) {
                        viewManager.envokeViewFunc("3D", "endChanges", resp.val);

                        }
                    }
                },
                processWaitingMsg: function() {
                    console.log("processWaitingMsg ",msgToWait );
                    for ( var i = 0; i < msgToWait.length; ++i ) {
                        this.OnWebsocketMsg(handleToWait, msgToWait[i]);
                    }
                    handleToWait = 0;
                    msgToWait = [];
                },
                event: function() {
                      //  this._event = lst;
                    
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
                    // console.log("serach ",valueToSearch, "in", el )
                    if (el.guid == valueToSearch) {
                        // console.log("found it findElementWithId ", el)
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

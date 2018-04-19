sap.ui.define(['sap/ui/core/mvc/Controller'],
	function(Controller) {
	    "use strict";

	    var SplitterController = Controller.extend("eve.Main", {

		onInit: function () {
		    console.log("SPLIT CONTROLLER \n");
		},
                getHandle: function () {
                    return this.handle;
                },
	        OnWebsocketMsg: function(handle, msg, offset) {
                    this.handle = handle;

                    
                    if (typeof msg != "string") {
                        
                        
                        console.log('TestPanel ArrayBuffer size ' +  msg.byteLength + ' offset ' + offset);
                        var sizeArr = new Int8Array(msg, offset, offset+1);
                        var textSize = sizeArr[0];
                        console.log("textsize ",textSize );
                        var arr = new Int8Array(msg, offset+1, textSize);
                        for (var i =0; i < textSize; ++i) {
                            // console.log(i, ":", arr[i], "-->", String.fromCharCode(arr[i]));
                        }
                        var str = String.fromCharCode.apply(String, arr);
                        console.log("str = ", str);
                        var obj = JSON.parse(str);

                        // TODO string to JSON !!!
                        var headerOff = 4*Math.ceil((offset+1+textSize)/4.0);  

                        var fArr = new Float32Array(msg, headerOff);

                        var el = this.findElementWithId(obj.guid, this._event.arr);
                        el.renderer = obj.renderer;
                        el.geoBuff = fArr;
                        
                        var v =  this.getView().byId("3D");
                        var cont = v.getController();
                        cont.drawExtra(el, fArr);                        
                        return;
                    }


                    
                    // console.log("OnWebsocketMsg response ", msg);
                    var resp = JSON.parse(msg);
                    if (resp.function === "geometry") {
                        var ele =  this.getView().byId("3D");
                        if (!ele) return;
                        var cont = ele.getController();
                        cont[resp.function](resp.args[0]);
                    }
                    else if (resp.function === "event") {
                        console.log("EVE ", resp);
                        this._event = resp.args[0];
                        this.event();
                    }
                    else if (resp.function === "replaceElement") {
                        console.log("replace element ", resp);
                        // find the element with guid in the event ... currently one level

                        var obj = this.findElementWithId(resp.element.guid, this._event.arr);
                        // obj =  resp.element;
                        var idx= obj.idx;
                     //   console.log("DEBUG .... got a reference to OLD  ", obj.parent, "  p.idx ", idx);
                        obj.parent[idx] = resp.element;
                        console.log("DEBUG .... new event ", this._event);
                        
                        this.event();
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
                        {
                        var ele =  this.getView().byId("3D");
                        console.log("ele 3D >>>> ", ele);
                        if (!ele) return;
                        var cont = ele.getController();
                            cont["event"]( this._event);
                        }
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
                findElementWithId: function(valueToSearch, theArray, currentIndex) {
                    
                    for (var i = 0; i < theArray.length; i++) {
                        if(theArray.arr) {
                            var obj = findElementWithId(valueToSearch, theArray.arr[i], currentIndex + i + ',');
                            if (obj) return obj;
                        } else if (theArray[i]['guid'] == valueToSearch) {
                            var obj = {
                                idx:i,
                                parent : theArray
                            };
                            return obj;
                        }
                    }
                }
	    });

	    return SplitterController;

});

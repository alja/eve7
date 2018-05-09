class ViewManager {
    constructor() {
        this.views = [];
    }


    addView(id, type) {
        var view = {"id":id, "type":type};
        console.log()
        this.views.push(view);
    }


    envokeViewFunc(func, arg) {
        console.log("viewmanager envoke func ", func, arg);
        
        for (var i = 0; i < this.views.length; ++i)
        {
            var c = sap.ui.getCore().byId(this.views[i].id).getController();
            c[func](arg);
        }
    }
    setGeometry(arg)
    {
        console.log("view manager geometry ", arg);
        for (var i = 0; i < this.views.length; ++i)
        {
            var controller =  sap.ui.getCore().byId(this.views[i].id).getController();
            var type = this.views[i].type;
            console.log("geo ",arg[type] );
            controller.geometry(arg[type]);

        }
    }

    updateElement(el) {
        console.log("view manger add element ", el);
        for (var i = 0; i < this.views.length; ++i)
        {
            var vi = this.views[i];
            var controller =  sap.ui.getCore().byId(vi.id).getController();
            /*
            var rnrInfo = el[vi.type];
            var func = rnrInfo.rnrFunc;
            var arg =  rnrInfo.glBuff;
*/
            controller.drawExtra(el);
            
        }
    }

}

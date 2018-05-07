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

        for (var i = 0; i < this.views.length; ++i)
        {
            var c = sap.ui.getCore().byId(this.views[i].id).getController();
            c[func](arg);
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

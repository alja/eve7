class ViewManager {
    constructor() {
        this.views = [];
    }

    addView(id, type) {
        var view = {"id":id, "type":type};
        console.log()
        this.views.push(view);
    }


    addElementRnrInfo(el) {
        // console.log("view manger add element ", el);
        for (var i = 0; i < this.views.length; ++i)
        {
            var vi = this.views[i];
            var controller =  sap.ui.getCore().byId(vi.id).getController();
            controller.drawExtra(el);
            
        }
    }

    replace(oldEl, newEl) {
       // console.log("viewManager old ", oldEl);
       // console.log("viewManager new",  newEl);
        for (var i = 0; i < this.views.length; ++i)
        {
            var c = sap.ui.getCore().byId(this.views[i].id).getController();
            c.replaceElement(oldEl, newEl);
        }
    }

    envokeViewFunc(func, arg) {
        // console.log("viewmanager envoke func ", func,         
        for (var i = 0; i < this.views.length; ++i)
        {
            var c = sap.ui.getCore().byId(this.views[i].id).getController();
            c[func](arg);
        }
    }

}

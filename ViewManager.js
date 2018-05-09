class ViewManager {
    constructor() {
        this.views = [];
    }


    addView(id, type) {
        var view = {"id":id, "type":type};
        console.log()
        this.views.push(view);
    }


    envokeFunction(func, arg) {
        console.log("viewmanager envoke func ", func, arg);
        
        for (var i = 0; i < this.views.length; ++i)
        {
            var c = sap.ui.getCore().byId(this.views[i].id).getController();
            c[func](arg);
        }
    }

}

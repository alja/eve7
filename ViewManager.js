class ViewManager {
    constructor() {
        this.views = [];
    }


    addView(id, type) {
        var view = {"id":id, "type":type};
        console.log()
        this.views.push(view);
    }


    envokeViewFunc(type, func, arg) {

        for (var i = 0; i < this.views.length; ++i)
        {
            if (this.views[i].type == type) {
                var c = sap.ui.getCore().byId(this.views[i].id).getController();
                c[func](arg);
            }
        }
    }

}

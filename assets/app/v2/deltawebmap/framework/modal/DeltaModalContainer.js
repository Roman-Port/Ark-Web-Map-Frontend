"use strict";

//Displays a modal in a location
class DeltaModalContainer {

    constructor(mount, app) {
        this.mount = mount;
        this.app = app;
        this.stack = [];
        this.area = DeltaTools.CreateDom("div", "modal_container", mount);
        this.ANIMATION_TIME = 150;
    }

    //Adds a modal and returns it's context
    AddModal(width, height) {
        //Create a context and add it to the stack
        var ctx = new DeltaModalContext(this, this.app, width, height);
        this.stack.push(ctx);

        //Refresh current view
        window.requestAnimationFrame(() => {
            this._UpdateView();
        });

        return ctx;
    }

    //Removes the frontmost modal
    PopModal() {
        this._SetModalActive(this.stack.length - 1, false);
        var d = this.stack.splice(this.stack.length - 1, 1)[0];
        d.view.style.pointerEvents = "none";
        window.setTimeout(() => {
            d.view.remove();
        }, 150);
        this._UpdateView();
    }

    _UpdateView() {
        //Updates the current in-front modal
        if (this.stack.length == 0) {
            //Hide
            this.area.classList.remove("modal_container_active");
            return;
        } else {
            this.area.classList.add("modal_container_active");
        }

        //Set active
        for (var i = 0; i < this.stack.length; i += 1) {
            this._SetModalActive(i, i == this.stack.length - 1);
        }
    }

    _SetModalActive(index, active) {
        if (active) {
            this.stack[index].view.classList.add("modal_holder_active");
        } else {
            this.stack[index].view.classList.remove("modal_holder_active");
        }
    }

}
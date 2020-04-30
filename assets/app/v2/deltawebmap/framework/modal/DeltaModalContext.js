"use strict";

//Represents a modal displayed on the screen
class DeltaModalContext {

    constructor(container, app, width, height) {
        //This is usually called by DeltaModalContainer, not by the user
        this.container = container;
        this.app = app;
        this.width = width;
        this.height = height;
        this.pages = [];

        //Create view
        this.view = DeltaTools.CreateDom("div", "modal_holder", container.area);

        //Create internal view
        this.insideView = DeltaTools.CreateDom("div", "modal_view_container", this.view);
        this.insideView.style.width = width.toString() + "px";
        this.insideView.style.height = height.toString() + "px";

        //Create carousel
        this.carousel = DeltaTools.CreateDom("div", "modal_view_carousel", this.insideView);
        this.carousel.style.width = width.toString() + "px";
        this.carousel.style.height = height.toString() + "px";
    }

    AddPage(dom) {
        //Add to pages and carousel
        var e = DeltaTools.CreateDom("div", "modal_view_carousel_item");
        e.appendChild(dom);
        e.style.width = this.width.toString() + "px";
        e.style.height = this.height.toString() + "px";

        //Add
        this.pages.push(e);
        this.carousel.appendChild(e);

        //Update widths
        this.carousel.style.width = (this.pages.length * this.width).toString() + "px";

        //Update
        this._UpdatePagePos();
    }

    Close() {
        //Todo
        this.container.PopModal();
    }

    _UpdatePagePos() {
        //Move the carousel to the last page
        this.carousel.style.left = (-(this.pages.length - 1) * this.width).toString() + "px";
    }

}
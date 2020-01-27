"use strict";

class PopoutModalView {

    constructor(server, baseData, baseParts, baseAdapters, morePromise, moreParts, moreAdapters, mounter) {
        /* FLOW:
         * We pass the baseData object and process it, then we wait for morePromise to download more data.
         * When processing, we use the adapter mapped to the index of the part to use it
         * A mounter is a function that will position a DOM element to be where we'd like it to be
         */

        //Save vars
        this.server = server;
        this.baseData = baseData;
        this.baseParts = baseParts;
        this.baseAdapters = baseAdapters;
        this.moreParts = moreParts;
        this.moreAdapters = moreAdapters;
        this.morePromise = morePromise;
        this.mounter = mounter;
        this.task = null;

        //Reserver
        this.mount = null;
    }

    static ShowDinoDataFromIcon(server, data, mounter) {
        return PopoutModalView.ShowDinoData(server, data, function (d) {
            return {
                "title": d.dialog.title,
                "subtitle": d.dialog.subtitle,
                "icon": d.img
            }
        }, data.id, mounter);
    }

    static ShowDinoData(server, data, adapter, id, mounter) {
        //Start loading
        var dataPromise = server.WebRequestToEndpoint("tribes_dino", {}, {
            "{dino}": id
        });

        //Create
        var modal = new PopoutModalView(server, data, [new PopoutPartTitle()], [adapter], dataPromise,
        [
            new PopoutPartTitleColorPicker(),
            new PopoutPartStats(),
            new PopoutPartInventory()
        ],
        [
            function (data) {
                return {
                    "title": data.dino.tamed_name,
                    "subtitle": data.dino_entry.screen_name,
                    "icon": data.dino_entry.icon.image_url,
                    "id": data.dino_id,
                    "prefs": data.prefs
                };
            },
            function (data) {
                return {
                    "maxStats":data.dino.max_stats,
                    "currentStats":data.dino.current_stats,
                    "status":data.dino.status
                };
            },
            function (data) {
                return {
                    "inventory": data.inventory
                };
            }
        ], mounter);
        modal.Show();
        return modal;
    }

    async Show() {
        this.task = this.InternalShow();
        await this.task;
    }

    async InternalShow() {
        //Create the mount
        this.mount = DeltaTools.CreateDom("div", "");
        this.mounter(this.mount);

        //Create and mount the base part
        this.Mount(this.MakePart(this.baseData, this.baseParts, this.baseAdapters));

        //Wait for processing to finish
        var data = await this.morePromise;

        //Create and mount this new promise
        this.Mount(this.MakePart(data, this.moreParts, this.moreAdapters));
    }

    Mount(dom) {
        //If the mount already has an inner DIV, remove it
        if (this.mount.children.length == 1) {
            this.mount.children[0].remove();
        }

        //Attach this new part
        this.mount.appendChild(dom);
    }

    MakePart(data, parts, adapters) {
        //Create container
        var e = DeltaTools.CreateDom("div", "popout_modal");

        //Add parts
        for (var i = 0; i < parts.length; i += 1) {
            var dom = DeltaTools.CreateDom("div", "");
            parts[i].Generate(dom, this.server, adapters[i](data));
            e.appendChild(dom);
        }

        //Add events to avoid conflicts with elements higher in the DOM
        e.addEventListener('click', PopoutModalView.PreventDefaultEvent);
        e.addEventListener('mousedown', PopoutModalView.PreventDefaultEvent);
        e.addEventListener('mouseup', PopoutModalView.PreventDefaultEvent);
        e.addEventListener('pointerup', PopoutModalView.PreventDefaultEvent);
        e.addEventListener('pointerdown', PopoutModalView.PreventDefaultEvent);
        e.addEventListener('scroll', PopoutModalView.PreventDefaultEvent);
        e.addEventListener('wheel', PopoutModalView.PreventDefaultEvent);

        return e;
    }

    static PreventDefaultEvent(evt) {
        evt.stopPropagation();
    }

    Close() {
        this.mount.remove();
    }

}

class PopoutPart {

    /* Represents an inner part of a popout */

    constructor() {

    }

    Generate(e, server, data) {

    }

}
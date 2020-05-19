"use strict";

class AdminTabServerSecure extends AdminSubTabMenuTabModule {

    constructor() {
        super("Secure Mode");
        this.mountpoint = null;
    }

    Attach() {
        this.mountpoint = DeltaTools.CreateDom("div", null);
        this._AddTitle(this.name);
        this._AddText("Secure mode is a feature that protects users from admin abuse. When secure mode is on, admins of the server will be unable to view tribe content (dinos, structures, items) of tribes they aren't part of.");
        this._AddText("Players will also be told when secure mode is on or has been toggled recently. Secure mode is designed to give players peace of mind that their content is safe from admins that may use it to cheat.");
        this._AddWarning("Players will be notified when you change this setting, even if you change it back.");
        this._AddText("Only the server owner may change this setting.");
        return this.mountpoint;
    }

    OnFirstOpened() {

    }

}
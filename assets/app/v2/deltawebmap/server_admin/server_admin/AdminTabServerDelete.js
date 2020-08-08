"use strict";

class AdminTabServerDelete extends AdminSubTabMenuTabModule {

    constructor() {
        super("Delete");
        this.mountpoint = null;
    }

    Attach() {
        this.mountpoint = DeltaTools.CreateDom("div", null);
        this._AddTitle(this.name);
        this._AddText("Deleting a server will remove all of it's content from Delta Web Map. Deleting a server from Delta Web Map will not impact the game server. ");
        this._AddRedBtn("Delete Server", () => {
            var modal = this.server.app.modal.AddModal(480, 290);
            var builder = new DeltaModalBuilder();
            builder.AddContentCustomText("modal_preset_title", "Delete " + this.server.info.display_name);
            builder.AddContentCustomText("modal_preset_subtitle", "Deleting this server from Delta Web Map will not impact the game server.");
            builder.AddContentWarningBox("You cannot undo this action, even by contacting support.");
            builder.AddAction("Delete", "NEGATIVE", () => {
                modal.AddPage(DeltaModalBuilder.GetLoadingView());
                this.server.DeleteServer().then(() => {
                    //Open end dialog
                    var builder = new DeltaModalBuilder();
                    builder.AddContentCustomText("modal_preset_title", "Finish Removal");
                    builder.AddContentCustomText("modal_preset_subtitle", "To finish removing Delta Web Map, remove the mod from your server and reboot.");
                    builder.AddContentCustomText("modal_preset_subtitle", "Not removing the mod from your server will cause Delta Web Map to enable again next time you reboot the server.");
                    builder.AddAction("Okay", "NEUTRAL", () => {
                        modal.Close();
                    });
                    modal.AddPage(builder.Build());
                });
            });
            builder.AddAction("Cancel", "NEUTRAL", () => {
                modal.Close();
            });
            modal.AddPage(builder.Build());
        });
        return this.mountpoint;
    }

    OnFirstOpened() {

    }

}
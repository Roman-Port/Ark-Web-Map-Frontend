"use strict";

//Created only when a user first creates an account. Guides them through the setup of it
class DeltaOOBE {

    constructor() {

    }

    //Shows the first screen we see when getting an account
    static ShowOOBEPrompt(app) {
        var modal = app.modal.AddModal(480, 590);

        var builder = new DeltaModalBuilder();
        builder.AddContentTitle("👋 Welcome to Delta Web Map!");
        builder.AddContentDescription("Thanks for using Delta Web Map, " + app.user.data.screen_name + "! We're so excited to bring you the best way to manage your ARK servers.");
        builder.AddContentDescription("Let's make Delta Web Map yours. Choose how you'll be using Delta Web Map, and we'll help you set it up.");

        builder.AddContentBigNav([
            {
                "title": "Access others' ARK servers I've joined",
                "callback": () => {
                    modal.Close();
                    app.OnOOBEFinished();
                },
                "is_big": true
            },
            {
                "title": "Add an ARK server I own to Delta Web Map",
                "callback": () => {
                    modal.Close();
                    DeltaOOBE.OpenGuildCreator(app);
                },
                "is_big": false
            }
        ]);

        builder.AddAction("Log Out", "NEUTRAL", () => {
            app.user.LogOut();
            modal.Close();
        });
        modal.AddPage(builder.Build());
    }

    static ShowNoServersPrompt(app) {
        var modal = app.modal.AddModal(480, 590);

        var builder = new DeltaModalBuilder();
        builder.AddContentTitle("No ARK Servers!");
        builder.AddContentDescription("To start using Delta Web Map, join an ARK server with Delta Web Map installed in-game. You'll be given access here within a minute.");

        builder.AddContentBigNav([
            /*{
                "title": "Clone a demo server",
                "callback": () => {

                },
                "is_big": false
            },*/
            {
                "title": "Add an ARK server I own to Delta Web Map",
                "callback": () => {
                    modal.Close();
                    DeltaOOBE.OpenGuildCreator(app);
                },
                "is_big": false
            }
        ]);

        builder.AddAction("Log Out", "NEUTRAL", () => {
            app.user.LogOut();
            modal.Close();
        });
        modal.AddPage(builder.Build());
    }

    static OpenGuildCreator(app) {
        new DeltaGuildCreator(app);
    }

}
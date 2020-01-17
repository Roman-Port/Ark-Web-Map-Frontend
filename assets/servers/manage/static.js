var KEY_SERVERSETUP_PROVIDER = "PROVIDER";

var PROVIDER_SETUPS = {
    "arkserversio": {
        "title": "ArkServers.IO",
        "instructions": [
            {
                "title": "Configure Server",
                "description": "This step will set up Delta Web Map to be personalized by you.",
                "steps": [
                    {
                        "title": "Open the \"Expert\" Tab",
                        "text": "From the home page of your server, click on the \"Expert\" tab from the top of the page.",
                        "image": "/assets/servers/providers/arkserversio/tutorial-configure-home.png"
                    },
                    {
                        "title": "Edit GameUserSettings.ini",
                        "text": "Under \"GameUserSettings.ini\", click the \"Edit\" button.",
                        "image": "/assets/servers/providers/arkserversio/tutorial-configure-expert.png"
                    },
                    {
                        "title": "Paste Lines into Editor and Save",
                        "text": function () {
                            return "In the editor window, copy the following lines into it. If an entry for Delta Web Map labeled \"[DeltaWebMapSync]\", replace it. Then, click \"Save and Preview\" and verify that changes were saved.<div class=\"serverctab_steps_codeblock\">[DeltaWebMapSync]<br>DeltaUserToken=" + serversme.token + "</div>";
                        },
                        "image": "/assets/servers/providers/arkserversio/tutorial-configure-gameusersettings.png"
                    }
                ]
            },
            {
                "title": "Install Mod and Reboot",
                "description": "This step will install Delta Web Map onto your server. Make sure to reboot it by the end of this process.",
                "steps": [
                    {
                        "title": "Open the \"Mods\" Tab",
                        "text": "From the home page of your server, click on the \"Mods\" tab from the top of the page.",
                        "image": "/assets/servers/providers/arkserversio/tutorial-mod-home.png"
                    },
                    {
                        "title": "Search for \"Delta Web Map\"",
                        "text": "Search for the mod in the search box near the top of the page.",
                        "image": "/assets/servers/providers/arkserversio/tutorial-mod-mods.png"
                    },
                    {
                        "title": "Install \"Delta Web Map Service\"",
                        "text": "Check to make sure the app you're installing has the blue Delta Web Map triangle and click the green \"Install\" button.",
                        "image": "/assets/servers/providers/arkserversio/tutorial-mod-search.png"
                    },
                    {
                        "title": "Reboot your Server",
                        "text": "Come back to the home page of your server and click the \"restart\" button. Wait for your server to finish restarting.",
                        "image": "/assets/servers/providers/arkserversio/tutorial-mod-reboot.png"
                    }
                ]
            }
        ]
    }
};

var FLOW_MAX_STEPS = 6;

var FLOWS = [
    {
        "title": "welcome",
        "nextEnabled":true,
        "oncreate": function (e, context) {

        },
        "onnext": function (next, to, context) {
            next();
        },
        "getProgress": function (context) {
            return 0;
        }
    },
    {
        "title": "provider",
        "nextEnabled": false,
        "oncreate": function (e, context) {

        },
        "onnext": function (next, to, context) {
            next(0);
        },
        "getProgress": function (context) {
            return 1 / FLOW_MAX_STEPS;
        }
    },
    {
        "title": "security-settings",
        "nextEnabled": true,
        "oncreate": function (e, context) {
            SetServerLockStatus(false);
        },
        "onnext": function (next, to, context) {
            next(0);
        },
        "getProgress": function (context) {
            return 2 / FLOW_MAX_STEPS;
        }
    },
    {
        "title": "provider-steps",
        "nextEnabled": true,
        "oncreate": function (e, context) {
            ShowCustomModStep(PROVIDER_SETUPS[savedSetupServerConfig[KEY_SERVERSETUP_PROVIDER]].instructions[context]);
        },
        "onnext": function (next, to, context) {
            if (context >= PROVIDER_SETUPS[savedSetupServerConfig[KEY_SERVERSETUP_PROVIDER]].instructions.length - 1) {
                next();
            } else {
                to(3, context + 1);
            }
        },
        "getProgress": function (context) {
            return (3 + context) / FLOW_MAX_STEPS;
        }
    },
    {
        "title": "setting-up",
        "nextEnabled": false,
        "oncreate": function (e, context) {

        },
        "onnext": function (next, to, context) {
            next();
        },
        "getProgress": function (context) {
            return 5 / FLOW_MAX_STEPS;
        }
    }
]
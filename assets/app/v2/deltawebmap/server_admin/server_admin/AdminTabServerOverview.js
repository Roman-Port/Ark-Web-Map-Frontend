"use strict";

class AdminTabServerOverview extends AdminSubTabMenuTabModule {

    constructor() {
        super("Overview");
        this.mountpoint = null;
    }

    Attach() {
        this.mountpoint = DeltaTools.CreateDom("div", null);
        this._AddTitle(this.name);
        return this.mountpoint;
    }

    OnFirstOpened() {
        this.RefreshContent();
    }

    RefreshContent() {
        this.server.FetchAdminStats().then((status) => {
            this.WriteContent(status);
        });
    }

    WriteContent(adminStatus) {
        var d = DeltaTools.CreateDom("div", null, this.mountpoint);
        d.appendChild(this.CreateOnlineBox(adminStatus));
        this.CreateGraph(adminStatus);
    }

    CreateOnlineBox(status) {
        //Create base
        var b = DeltaTools.CreateDom("div", "admin_content_box");
        var light = DeltaTools.CreateDom("div", "admin_overview_online_light", b);
        var title = DeltaTools.CreateDom("div", "admin_overview_online_text", b);
        var sub = DeltaTools.CreateDom("div", "admin_overview_online_sub", b);

        //Switch on status
        if (status.status == "ONLINE") {
            title.innerText = "Online";
            sub.innerText = "Started " + new moment(status.last_started).format("MMMM Do, YYYY h:mm A");
            light.classList.add("admin_overview_online_light_online");
        } else if (status.status == "OFFLINE") {
            title.innerText = "Offline";
            sub.innerText = "Last Seen " + new moment(status.last_ping).format("MMMM Do, YYYY h:mm A");
        } else if (status.status == "OUTDATED_SERVER") {
            title.innerText = "Online - update available";
            sub.innerText = "Version " + status.last_version;
            light.classList.add("admin_overview_online_light_warning");
            this._AddWarning("The mod is out of date. Update it from the Steam Workshop and restart your server to access the latest features.");
        } else if (status.status == "VERY_OUTDATED_SERVER") {
            title.innerText = "Server too far out of date";
            sub.innerText = "Version " + status.last_version;
            light.classList.add("admin_overview_online_light_error");
            this._AddWarning("The mod is so far out of date that it can no longer connect to Delta Web Map. You should update the mod from the Steam Workshop and restart the server now to continue using Delta Web Map.");
        } else {
            //Unknown
            title.innerText = "Unknown Status";
            sub.innerText = "";
        }

        return b;
    }

    CreateGraph(status) {
        //Convert
        var avgPings = [];
        var labels = [];
        for (var i = 0; i < status.pings.length; i += 1) {
            if (i % 10 != 0) { continue;}
            avgPings.push(Math.round(status.pings[i].tick_avg * 10000) / 10);
            labels.push(new moment(status.pings[i].time).format("MM/DD h:mm A"));
        }

        //Create
        var holder = DeltaTools.CreateDom("div", "admin_content_box", this.mountpoint);
        var ctx = DeltaTools.CreateDom("canvas", null, holder).getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Average Time per Tick',
                        data: avgPings,
                        backgroundColor: "#3882dc",
                        borderColor: "#3882dc",
                        borderWidth: 1,
                        fill: false,
                    },
                ]
            },
            options: {
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        display: false,
                        scaleLabel: {
                            display: true,
                            labelString: 'Time'
                        }
                    }],
                    yAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Milliseconds per Tick'
                        }
                    }]
                }
            }
        });
    }
}
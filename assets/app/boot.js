//Fetch assets
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        //Parse
        var d = JSON.parse(this.responseText);

        //Add all assets
        for(var i = 0; i<d.asset_load_order.WEB.length; i+=1) {
            var ar = d.asset_load_order.WEB[i];
            var a = d.assets[ar];
            switch(a.type) {
                case "JAVASCRIPT":
                    var e = document.createElement("script");
                    e.src = a.pathname;
                    document.body.appendChild(e);
                    break;
                case "CSS":
                    var e = document.createElement("link");
                    e.rel = "stylesheet";
                    e.href = a.pathname;
                    document.head.appendChild(e);
                    break;
                default:
                    console.log("WARNING: Found unknown type "+a.type+" while loading assets!");
            }
        }
    } else if(this.readyState == 4) {
        console.log("Oops! There was an error fetching required resources. Try again later.");
    }
}
xmlhttp.open("GET", CONFIG_ROOT+CONFIG_ENVIORNMENT+"/app_assets.json", true);
xmlhttp.send(null);
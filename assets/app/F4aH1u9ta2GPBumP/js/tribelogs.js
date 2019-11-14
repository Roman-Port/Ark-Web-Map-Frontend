var tribelogs = {};
tribelogs.logs = [];
tribelogs.container = document.getElementById('tribelog_container');

tribelogs.refresh = function() {
    //Clear
    tribelogs.container.innerHTML = "";

    //Add each
    for(var i = 0; i<tribelogs.logs.length; i+=1) {
        var d = tribelogs.logs[i];
        tribelogs.createEntry(d, tribelogs.container);
    }
}

tribelogs.clear = function() {
    tribelogs.logs = [];
    tribelogs.refresh();
}

tribelogs.stream = function(url) {
    main.serverRequest(url, {}, function(d) {
        //Add all
        for(var i = 0; i<d.results.length; i+=1) {
            tribelogs.logs.push(d.results[i]);
        }

        //Refresh
        tribelogs.refresh();

        //If there were results, stream the next page
        if(d.results.length > 0) {
            tribelogs.stream(d.next);
        }
    })
}

tribelogs.createEntry = function(d, parent) {
    var e = main.createDom("div", "tribelog_entry", parent);

    //Add real date, if acceptable
    if(d.realtime) {
        //Show the real date
        var t = main.createDom("div", "tribelog_entry_time tribelog_entry_time_real", e);

        //Create time string
        t.innerText = "Around " + tribelogs.formatTime(new Date(d.seen));
    }

    //Set the game day
    var gt = main.createDom("div", "tribelog_entry_time tribelog_entry_time_game", e);
    gt.innerText = "ARK Day "+d.day+" "+d.hour+":"+tribelogs.formatPaddedString(d.min, 2)+":"+tribelogs.formatPaddedString(d.sec, 2);

    //Add content
    var ec = main.createDom("div", "tribelog_entry_content", e);
    ec.innerText = d.content;

    //Add color
    e.style.borderLeftColor = d.color;

    return e;
}

tribelogs.formatTime = function(t) {
    //Create a new time we will compare to
    var c = new Date();

    //First, make time since there will always be this.
    var options = {
        "hour":"numeric",
        "minute":"numeric"
    }
    var time = t.toLocaleTimeString(undefined, options);

    //Use just this if this is on the same day
    if(t.getYear() == c.getYear() && t.getMonth() == c.getMonth() && t.getDate() == c.getDate()) {
        return time;
    }

    //Now, we'll add the day. This is the most common option
    options = {
        "weekday":"short",
        "month":"short",
        "day":"numeric"
    }
    if(t.getYear() != c.getYear()) {
        //Wow, this is more than a year old! Add the year
        options.year = "numeric";
    }

    return t.toLocaleDateString(undefined, options) + " at "+time;
}

tribelogs.formatPaddedString = function(dd, len) {
    var d = dd.toString();
    while(d.length < len) {
        d = "0"+d;
    }
    return d;
}
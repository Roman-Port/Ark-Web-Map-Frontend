"use strict"; 

//Serves as a container for server types. Must be extended
class ServerDataPackage {

    constructor(name, server) {
        //Create
        this.name = name; //Just used as a label
        this.server = server;
        this.CHUNK_SIZE = 800;

        //Make events
        this.OnContentLoadFinished = new DeltaBasicEventDispatcher(); //We've finished loading all of the content {}
        this.OnContentChunkReceived = new DeltaBasicEventDispatcher(); //When we load a single chunk {"progress", "total", "delta", "source"}
        this.OnContentUpdated = new DeltaBasicEventDispatcher(); //Main event. Called whenever the dataset is modified {"filtered_content"}
        this.OnContentAddRemoved = new DeltaBasicEventDispatcher(); //Always called at the same time as above event. Contains the difference between the content instead of all of it {"adds", "removes"}

        //Make content
        this.content = []; //Holds all content
        this.filteredContent = []; //Content that was filtered
    }

    //Functions that must be extended

    async FetchCount() {
        //Returns an integer with the total length
        throw "Must be extended.";
    }

    async FetchContent(offset, limit) {
        //Returns an array of content after fetching with the offset and limit
        throw "Must be extended.";
    }

    //API

    async LoadContent() {
        //Check
        if (this.content.length != 0) {
            throw "Redownloading content is undefined behavior and is unsupported for now.";
        }

        //Begin requesting content
        var progress = 0;
        var total = 0;

        //Request until we're out
        var lastChunkSize = this.CHUNK_SIZE;
        while (lastChunkSize == this.CHUNK_SIZE) {
            //Request
            var chunk = await this.FetchContent(progress, this.CHUNK_SIZE, {
                getLoadedClientCallback: (c) => {
                    //c is an xmlhttp client
                    total = parseInt(c.getResponseHeader("X-Delta-Sync-TotalItems"));
                }
            });

            //Update
            progress += chunk.length;
            lastChunkSize = chunk.length;

            //Fire event
            this.OnContentChunkReceived.Fire({
                "progress": progress,
                "total": total,
                "delta": lastChunkSize,
                "source": this
            });

            //Add to content
            var newFilteredContent = [];
            for (var i = 0; i < chunk.length; i += 1) {
                //Add main
                this.content.push(chunk[i]);

                //Push to filtered
                if (this.EntityMatchesFilter(chunk[i])) {
                    this.filteredContent.push(chunk[i]);
                    newFilteredContent.push(chunk[i]);
                }
            }

            //Push events
            this.OnContentUpdated.Fire({
                "filtered_content": this.filteredContent
            });
            this.OnContentAddRemoved.Fire({
                "adds": newFilteredContent,
                "removes": []
            });
        }
    }

    EntityMatchesFilter(e) {
        //Checks e against the current filter
        return true;
    }

    SubscribeRecycler(tagName, recycle) {
        //Subscribe
        this.OnContentUpdated.Subscribe(tagName, () => {
            recycle.SetData(this.filteredContent);
        });

        //Send filtered data now
        recycle.SetData(this.filteredContent);
    }

    GetByFilter(x) {
        //Filters the already filtered content by a filter the user uses
        var output = [];
        for (var i = 0; i < this.filteredContent.length; i += 1) {
            if (x(this.filteredContent[i])) {
                output.push(this.filteredContent[i]);
            }
        }
        return output;
    }

    FilterUpdated() {
        //Filters the content again and fires off events

        //Remove all
        this.OnContentAddRemoved.Fire({
            "adds": [],
            "removes": this.filteredContent
        });

        //Filter
        this.filteredContent = [];
        for (var i = 0; i < this.content.length; i += 1) {
            if (this.EntityMatchesFilter(this.content[i])) {
                this.filteredContent.push(this.content[i]);
            }
        }

        //Push updated
        this.OnContentUpdated.Fire({
            "filtered_content": this.filteredContent
        });

        //Push added event
        this.OnContentAddRemoved.Fire({
            "adds": this.filteredContent,
            "removes": []
        });
    }

    //Other

    _ContentUpdated() {
        //Filters the content again and fires off events

        //Filter
        this.filteredContent = [];
        for (var i = 0; i < this.content; i += 1) {
            if (this.EntityMatchesFilter(this.content[i])) {
                this.filteredContent.push(this.content[i]);
            }
        }

        //Push events
        this.OnContentUpdated.Fire({
            "filtered_content": this.filteredContent
        });

        //TODO: Fire the add/remove events
    }

}
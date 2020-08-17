"use strict"; 

//Serves as a container for server types. Must be extended
class ServerDataPackage {

    constructor(name, server, rpcType) {
        //Create
        this.name = name; //Just used as a label
        this.server = server;
        this.rpcType = rpcType;
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

    GetContentUniqueKey(e) {
        //Returns a unique key, as a string, to identify content
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
                //Get unique key
                var unique = this.GetContentUniqueKey(chunk[i]);
                chunk[i]._deltaPackageIndexedKey = unique;

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

        //Subscribe to RPC events
        this._SubscribeRPCEvents();
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

    _SubscribeRPCEvents() {
        //Subscribe to content updated events
        this.server.SubscribeRPCEvent("deltawebmap.framework.server.ServerDataPackage." + this.name, 20001, (p) => {
            //Make sure the RPC type matches
            if (p.type != this.rpcType) { return; }

            //Loop through content
            var adds = [];
            var removes = [];
            for (var i = 0; i < p.content.length; i += 1) {
                var c = p.content[i];

                //Get the unique key
                var unique = this.GetContentUniqueKey(c);
                c._deltaPackageIndexedKey = unique;

                //Find if this already exists in the content. If it does, replace it
                for (var j = 0; j < this.content.length; j += 1) {
                    if (this.content[j]._deltaPackageIndexedKey == unique) {
                        this._UpdateItem(this.content[j], c);
                        c = this.content[j];
                    }
                }

                //Check if we fit the filter
                var filtered = this.EntityMatchesFilter(c);

                //Find if this already exists in the filtered content. If it does, replace it or remove it
                for (var j = 0; j < this.filteredContent.length; j += 1) {
                    if (this.filteredContent[j]._deltaPackageIndexedKey == unique) {
                        if (filtered) {
                            //Matched! Replace it
                            this._UpdateItem(this.filteredContent[j], c);
                        } else {
                            //Matched! But it no longer fits the filter. Remove it
                            this.filteredContent.splice(j, 1);
                            j--;
                        }
                    }
                }

                //Queue for events
                if (filtered) {
                    adds.push(c);
                } else {
                    removes.push(c);
                }
            }

            //Send add/remove events
            this.OnContentAddRemoved.Fire({
                "adds": adds,
                "removes": removes
            });

            //Send updated events
            this.OnContentUpdated.Fire({
                "filtered_content": this.filteredContent
            });
        });
    }

    _UpdateItem(target, replacement) {
        //This will update each key individually so that missing ones aren't required
        var k = Object.keys(replacement);
        for (var i = 0; i < k.length; i += 1) {
            if (replacement[k[i]] != null) {
                target[k[i]] = replacement[k[i]];
            }
        }
    }

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
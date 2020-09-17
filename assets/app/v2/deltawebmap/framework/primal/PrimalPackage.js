"use strict";

class PrimalPackage {

    constructor(manager, info) {
        this.manager = manager;
        this.info = info; //Data being the queried data from the API
        this.downloaded = false;
        this.content = {}; //Content by classname

        this.CHUNK_SIZE = 300;
    }

    async DownloadContent(progress) {
        //Fetch content we have stored locally
        if (this.manager.db != null) {
            //Fetch. This also contains data for other types
            var datas = await this.manager._GetContentFromDatabase(this.info.mod_id);

            //Loop all
            for (var i = 0; i < datas.length; i += 1) {
                //Get
                var content = datas[i];

                //Check type and add
                if (content.PackageType == this.info.package_type) {
                    this.content[content.ContentClassname] = content.ContentPayload;
                }
            }
        }

        //Check if we have anything we need to download
        if (this.info.entity_count > 0) {
            //We'll download this in chunks
            var requestEpoch = await this.manager.GetLastEpoch(this.info.mod_id, this.info.package_type); //The epoch to request with. Does not change
            var responseEpoch = requestEpoch; //What we'll set the epoch to when we're done

            //Download
            var lastSize = this.CHUNK_SIZE;
            var downloaded = 0;
            while (lastSize == this.CHUNK_SIZE) {
                //Build URL
                var url = this.info.package_url_dwf + "?last_epoch=" + requestEpoch + "&skip=" + downloaded + "&limit=" + this.CHUNK_SIZE;

                //Decode binary data
                var d = await DeltaWebFormatDecoder.DownloadAndDecode(url);

                //Add
                for (var i = 0; i < d.content.length; i += 1) {
                    this.content[d.content[i].classname] = d.content[i];
                }

                //Set flags
                responseEpoch = d.customData[0];
                lastSize = d.content.length;
                downloaded += lastSize;

                //Write to database
                if (this.manager.db != null) {
                    await this.manager._WriteContentChunkToDatabase(this.info.mod_id, this.info.package_type, d.content);
                }

                //Callback
                progress(lastSize, this);
            }

            //Set epoch
            if (this.manager.db != null) {
                await this.manager.SetLastEpoch(this.info.mod_id, this.info.package_type, responseEpoch);
            }
        }

        //Done!
        this.downloaded = true;
    }

    GetItemByClassName(classname) {
        var c = this.content[classname];
        if (c != null) {
            c._package = this;
        }
        return c;
    }

    GetByFilter(x) {
        //Searches via filter instead of index. This method is slow
        var k = Object.keys(this.content);
        for (var i = 0; i < k.length; i += 1) {
            if (x(this.content[k[i]])) {
                return this.content[k[i]];
            }
        }
        return null;
    }

}
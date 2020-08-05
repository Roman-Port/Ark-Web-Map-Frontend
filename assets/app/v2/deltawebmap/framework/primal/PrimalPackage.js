"use strict";

class PrimalPackage {

    constructor(manager, info) {
        this.manager = manager;
        this.info = info; //Data being the queried data from the API
        this.downloaded = false;
        this.content = {}; //Content by classname

        this.CHUNK_SIZE = 50;
    }

    async DownloadContent(progress) {
        //We'll download this in chunks
        var requestEpoch = 0; //The epoch to request with. Does not change
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

            //Callback
            progress(lastSize);
        }

        //Done!
        this.downloaded = true;
    }

    GetItemByClassName(classname) {
        return this.content[classname];
    }

}
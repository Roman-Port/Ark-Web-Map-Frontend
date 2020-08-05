"use strict";

//Held globally for the entire app
class PrimalPackageManager {

    constructor() {
        this.packages = {};
    }

    //Public API

    //Requests an UNDOWNLOADED interface for a server
    //modList is a list of strings that are mod IDs. Make sure it contains "0" to load main data
    async RequestInterface(modList) {
        //Create the request data for the query
        var queryRequestData = {
            "requested_packages": []
        };
        for (var i = 0; i < modList.length; i += 1) {
            queryRequestData.requested_packages.push({
                "mod_id": modList[i],
                "package_type": "SPECIES",
                "last_epoch": this.GetLastEpoch(modList[i], "SPECIES")
            });
            queryRequestData.requested_packages.push({
                "mod_id": modList[i],
                "package_type": "ITEMS",
                "last_epoch": this.GetLastEpoch(modList[i], "ITEMS")
            });
        }

        //Send off request
        var response = await DeltaTools.WebPOSTJson(window.LAUNCH_CONFIG.PACKAGES_API_ENDPOINT + "/query", queryRequestData, null);

        //Get the requested packages. They'll be in the same order as requested
        var interfacePackages = [];
        for (var i = 0; i < response.packages.length; i += 1) {
            interfacePackages.push(this._GetOrCreatePackage(response.packages[i]));
        }

        //Create and respond with interface
        return new PrimalPackageInterface(this, interfacePackages);
    }

    GetLastEpoch(modId, packageType) {
        return 0; //TODO
    }

    //Internal

    //Returns a key for this.packages
    _GetPackageKey(packageInfo) {
        return packageInfo.package_name;
    }

    //Gets a package or creates it
    _GetOrCreatePackage(packageInfo) {
        //Try to find it
        var key = this._GetPackageKey(packageInfo);
        var p = this.packages[key];
        if (p != null) { return p; }

        //Create new package
        p = new PrimalPackage(this, packageInfo);
        this.packages[key] = p;
        return p;
    }

}
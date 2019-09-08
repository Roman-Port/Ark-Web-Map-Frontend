/* REQUIRES Aloglia Search */

/* Set up Algolia search */
const searchClient = algoliasearch('ZWQLY0DSDM', '25331dcea375f936ffef5d269e20930c');
const searchCategories = searchClient.initIndex("prod_CATEGORIES");
const searchArticles = searchClient.initIndex("prod_HELP");

var support = {};

support.search = function(query /*String*/, limitCategory /*String, nullable*/, callback /*Function*/) {
    //Build request
    var p = {
        "query":query
    };
    if(limitCategory != null) {
        p.facetFilters = [
            'category:'+limitCategory
        ];
    }

    //Do search
    searchArticles.search(p, function(err, content) {
        callback(content.hits);
    });
}

support.getCategories = function(callback) {
    searchCategories.search({"query":""}, function(err, content) {
        callback(content.hits);
    });
}

support.renderCategories = function(data) {
    var e = delta.createDom("ul", "support_item_container");
    for(var i = 0; i<data.length; i+=1) {
        var d = data[i];
        var c = delta.createDom("li", "support_item_base support_item_category", e);
        delta.createDom("div", "support_item_category_title", c).innerText = d.title;
        delta.createDom("div", "support_item_category_mid", c);
        delta.createDom("div", "support_item_category_sub", c).innerText = d.sub_title;
        c.x_id = d.objectID;
        c.addEventListener('click', function() {
            window.location = "/support/topics/"+this.x_id+"/";
        })
    }
    return e;
}
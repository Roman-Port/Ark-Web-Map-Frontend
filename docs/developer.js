var index = null;
var articleMount = document.getElementById('article');

function Init() {
    delta.serverRequest("data/index.json", {}, function (d) {
        index = d;

        var defaultSection = index.default_section;
        SwitchArticle(defaultSection, GetSectionById(defaultSection).default_page);
    });
}

function GetItemByKey(array, keyName, keyValue) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i][keyName] == keyValue) {
            return array[i];
        }
    }
    return null;
}

function SetPageLoad(loading) {
    if (loading) {
        document.body.classList.add("state_article_loading");
    } else {
        document.body.classList.remove("state_article_loading");
    }
}

function GetSectionById(sectionId) {
    return GetItemByKey(index.sections, "id", sectionId);
}

function GetArticleById(section, articleId) {
    return GetItemByKey(section.pages, "id", articleId);
}

function SwitchArticle(sectionId, articleId) {
    var section = GetSectionById(sectionId);
    var article = GetArticleById(section, articleId);

    articleMount.innerHTML = "";
    SetPageLoad(true);
    delta.serverRequest("data/english/" + section.id + "/" + article.id + ".html", { isJson: false }, function (d) {
        articleMount.innerHTML = d;
        SetPageLoad(false);
    });
}

Init();
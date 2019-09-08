<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Your Data</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
    </head>
    <body>
        <?php include "/var/www/delta/site_assets/header.php"; ?>
        <div class="main_content_fit main_content">
            <div class="status_warning" id="warning_bar" style="display:none;"></div>
            <div id="main">
                <h1>Your Data Archive</h1>
                <p>Your data archive contains data you enter. You can take a look at our <a href="/privacy/">Privacy Policy</a> for more info. Click <a href="javascript:DownloadArchive();">here</a> to download your data. It could take a few seconds to gather info.</p>
                <box_info>Your data archive does <b>not</b> include data you enter into ARK servers, as some of this content cannot be accessed now.</box_info>
                <iframe id="data_download" src="about:blank" style="display:none;"></iframe>
            </div>
        </div>
        <script src="/assets/frontpage/me/me.js"></script>
        <script>
            var is_downloading = false;

            function DownloadArchive() {
                //Show loader
                is_downloading = true;
                me.setStatusBar("Creating archive, please wait...");

                //Create request
                delta.serverRequest("https://deltamap.net/api/users/@me/archive", {"failOverride":me.serverError}, function(d) {
                    document.getElementById('data_download').src = d.url;
                    me.setStatusBar(null);
                    is_downloading = false;
                });
            }
        </script>
    </body>
</html>
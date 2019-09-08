<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Support</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
        <link rel="stylesheet" type="text/css" media="screen" href="/assets/support/support_base.css" />
        <script src="https://cdn.jsdelivr.net/algoliasearch/3/algoliasearchLite.min.js"></script>
        <script src="/assets/support/support_base.js"></script>
        <script src="/assets/support/support_root.js"></script>
    </head>
    <body>
        <?php include "/var/www/delta/site_assets/header.php"; ?>
        <div class="main_content">
            <!-- Header -->
            <div class="support_header">
                <div class="support_header_title">Delta Web Map Support</div>
                <div class="support_header_search">
                    <input type="text" class="support_header_search_box" placeholder="Search Everything">
                </div>
            </div>

            <!-- Main content -->
            <div id="main_area">

            </div>
        </div>
    </body>
    <script>support.showMain();</script>
</html>
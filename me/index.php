<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Me</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
        <link href="/assets/frontpage/me/me.css" rel="stylesheet">
    </head>
    <body>
        <?php include "/var/www/delta/site_assets/header.php"; ?>
        <div class="main_content_fit main_content">
            <div class="status_warning" id="warning_bar" style="display:none;"></div>
            <div id="main" style="display:none;">
                <h1>Hello, <span id="p_username"></span>!</h1>
                <p>Here, you can manage your account and it's settings. Not you? <a href="javascript:me.logout();">Sign out</a>.</p>
                <hr>
                <mp>You might also be looking for <a href="/me/archive/">your data archive</a> or <a href="/me/delete/">deleting your account</a>.</mp>
            </div>
        </div>
        <script src="/assets/frontpage/me/me.js"></script>
    </body>
</html>
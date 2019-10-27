<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Servers</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
        <link href="/assets/frontpage/me/servers/servers.css" rel="stylesheet">
    </head>
    <body>
        <?php include "/var/www/delta/site_assets/header.php"; ?>
        <div class="main_content_fit main_content">
            <div class="status_warning" id="warning_bar" style="display:none;"></div>
            <div id="main">
                <h1>Your Machines &amp; Servers</h1>
                <p>Here, you can manage your servers and machines. Machines represent a single physical computer, while servers represent an ARK game. You can have multiple servers per machine.</p>
                <hr>
                <div class="machine_container">
                    <div class="machine_top">Test Server ef5f2e</div>
                    <div class="machine_content"></div>
                    <div class="machine_nav_strip">
                        <div class="machine_nav_btn machine_nav_btn_add">Add Server</div>
                        <div class="machine_nav_btn machine_nav_btn_delete">Delete</div>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
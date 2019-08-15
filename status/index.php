<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Status</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
        <link href="https://fonts.googleapis.com/css?family=IBM+Plex+Mono&display=swap" rel="stylesheet">
        <script src="/assets/frontpage/status.js"></script>
        <link href="/assets/frontpage/status/status.css" rel="stylesheet">
    </head>
    <body>
            <?php include "/var/www/delta/site_assets/header.php"; ?>
            <div class="main_content_fit main_content">
                <div class="status_warning" id="status_warning"></div>
                <div id="status_area"></div>
            </div>
            <?php include "/var/www/delta/site_assets/footer.php"; ?>
    </body>
    <script>
        status_report.create();
    </script>
</html>
<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Bad Request</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
        <style>
            .status_warning {
                background-color: #e3453d;
                padding:10px;
                font-family: 'Open Sans', sans-serif;
                color:white;
                font-size:15px;
                margin-bottom:10px;
                border-radius: 8px;
                display:block;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <?php include "/var/www/delta/site_assets/header.php"; ?>
        <div class="main_content_fit main_content">
            <div class="status_warning">Sorry, you sent an invalid request.</div>
        </div>
    </body>
</html>
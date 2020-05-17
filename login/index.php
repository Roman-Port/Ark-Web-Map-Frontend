<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Login / Delta Web Map</title>
    <?php include "/var/www/delta/site_assets/head.php"; ?>
    <link rel="stylesheet" type="text/css" media="screen" href="/assets/login.css" />
</head>
<body>
    <div class="login_box">
        <div class="login_box_title">Welcome to Delta Web Map!</div>
        <div class="login_box_text">To gather info, you'll need to log in with Steam</div>
        <div class="login_box_text">By signing in, you agree to our <a href="/privacy/" target="_blank">Privacy Policy</a></div>
        <div class="beta_key_container">
            <div class="beta_key_text">Beta Key</div>
            <input class="beta_key_input" type="text" placeholder="AAAA-BBBB-CCCC" id="beta_key_entry" />
            <div class="beta_key_text" style="color:#f16868;" id="beta_key_error"></div>
        </div>
        <div class="login_box_btn" id="login_box_btn">Sign In with Steam</div>
    </div>

    <script src="/enviornment.js"></script>
    <script src="/assets/login.js"></script>
</body>
</html>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Log In / Ark Web Map</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
    <link rel="stylesheet" type="text/css" media="screen" href="/assets/master.css" />
    <link rel="stylesheet" type="text/css" media="screen" href="/assets/login.css" />
    <?php
        //Get the next URL
        $next = "https://deltamap.net/app/";
        if(isset($_GET["next"])) {
            $next = $_GET["next"];
        }
    ?>
</head>
<body>
    <div class="top_banner"></div>
    <div class="login_box">
        <div class="login_title">Sign In</div>

        <div class="login_sub">Ark Web Map uses your Steam account to determine which servers you're part of and what tribe you're on. Ark Web Map only views your Steam ID and cannot make changes to your account. Please sign in.<br><br>By signing in, you're agreeing to our <a style="color:#5585e6;" target="_blank" href="/privacy">Privacy Policy</a>.</div>

        <a href="/api/auth/steam_auth/?next=<?php echo urlencode($next); ?>"><div class="master_btn master_btn_blue">Sign In With Steam</div></a>
    </div>
</body>
</html>
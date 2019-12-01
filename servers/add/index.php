<!DOCTYPE html>
<html>
<head>
    <title>Add your Server to Delta Web Map</title>
    <?php include "/var/www/delta/site_assets/head.php"; ?>
    <link href="https://fonts.googleapis.com/css?family=Roboto+Mono&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/servers/add/add_servers.css">
</head>
<body>
    <div class="content_container">
        <div class="content">
            <div class="content_slide" id="slide_map_picker">
                <!-- Map picker slide -->
                <div class="title_centered">Choose Map</div>
                <div class="subtitle_centered">Choose the map that your server will use. If it isn't listed, your map isn't supported yet.</div>
                <ul class="map_button_container"></ul>
            </div>
            <div class="content_slide" id="slide_login">
                <!-- Login slide -->
                <div class="title_centered">Login</div>
                <div class="subtitle_centered">You'll need to log in with Steam to continue.</div>
                <div class="big_wide_btn" style="width:50%;" onclick="GoToLogin();">Login</div>
            </div>
            <div class="content_slide" id="slide_add_mod">
                <!-- Add mod slide -->
                <div class="title_centered">Add Mod</div>
                <div class="subtitle_centered">You'll need to install our mod into your ARK server.</div>
                <a href="https://steamcommunity.com/sharedfiles/filedetails/?id=1905186031" target="_blank"><div class="big_wide_btn">Open Mod in Steam Workshop<br>(ID #1905186031)</div></a>
                <div class="subtitle_centered">If you've never installed an ARK mod before, you should search how to do so for your service provider or use the help button.</div>
                <div class="subtitle_centered">When you're ready, press continue.</div>
                <div class="big_wide_btn" style="width:50%;" onclick="SwitchSlide('CUSTOMIZE');">Continue</div>
            </div>
            <div class="content_slide" id="slide_customize">
                <!-- Customize slide -->
                <div class="title_centered"><i>Optional</i> Customize your Server</div>
                <div class="subtitle_centered">While optional, use these steps to be able to manage your server.</div>
                <div class="subtitle_centered">Open the <span class="code_inline">UserGameSettings.ini</span> file. Append the following lines to this file:</div>
                <div class="inline_codeblock">[DeltaWebMapSync]<br>DeltaUserToken=<span id="user_token"></span></div>
                <div class="big_wide_btn" style="width:50%;" onclick="SwitchSlide('DONE');">Done</div>
            </div>
            <div class="content_slide" id="slide_done">
                <!-- Done slide -->
                <div class="title_centered">You're Ready to Go!</div>
                <div class="subtitle_centered">Start your server and wait for it to finish. Players that join the server will be able to log into the app.</div>
                <a href="/app/"><div class="big_wide_btn" style="width:50%;">View App</div></a>
                <a href="/servers/"><div class="big_wide_btn" style="width:50%;">Manage</div></a>
            </div>
        </div>
    </div>
    <a href="https://discord.gg/dW8Pu9Y" target="_blank"><div class="help_btn">Need Help?</div></a>
    <script src="/assets/servers/add/add_servers.js"></script>
</body>
</html>
<!DOCTYPE html>
<html>
<head>
    <title>Manage Server / Delta Web Map</title>
    <?php include "/var/www/delta/site_assets/head.php"; ?>
    <link rel="stylesheet" href="/assets/servers/manage/manage.css">
</head>
<body class="state_loading state_hide">
    <div class="loaderbar"><div class="loaderbar_bar"></div></div>
    <div class="left_sidebar">
        <div class="left_sidebar_top attrib_loaded_content">
            <img src="" class="left_sidebar_top_image" id="load_img"/>
            <div class="left_sidebar_top_title" id="load_title"></div>
            <div class="left_sidebar_top_subtitle" id="load_cluster"></div>
        </div>
        <div class="left_sidebar_content attrib_loaded_content">
            <div onclick="OnSwitchTab(this);" class="left_sidebar_button left_sidebar_button_active" data-tab="overview">Overview</div>
            <div onclick="OnSwitchTab(this);" class="left_sidebar_button" data-tab="permissions">Permissions</div>
            <div onclick="OnSwitchTab(this);" class="left_sidebar_button" data-tab="disable">Disable</div>
            <div onclick="OnSwitchTab(this);" class="left_sidebar_button" data-tab="remove">Remove</div>
        </div>
    </div>
    <div class="right_content attrib_loaded_content">
        <div class="delta_tab_content active_delta_tab" id="tab_overview">
            <h1>Overview</h1>
        </div>
        <div class="delta_tab_content" id="tab_permissions">
            <h1>Permissions</h1>
            <p>Here, you can manage all of the enabled features for all users. You can restrict or disable features that you deem too powerful.</p>
            <dbox class="dbox_warn">Server members will be notified if you toggle some features.</dbox>
        </div>
        <div class="delta_tab_content" id="tab_disable">
            <h1>Disable Server</h1>
            <p>Disabling your server will temporarily restrict access to it. </p>
        </div>
        <div class="delta_tab_content" id="tab_remove">
            <h1>Remove Server</h1>
            <p>Removing your server will delete all canvases, user settings, and other saved content from Delta Web Map servers immediately for all users. This action is permanent and cannot be undone, even by support.</p>
            <p>This action will also remove all ARK data from our servers, but will not impact your game server.</p>
            <dbox class="dbox_warn">Removing your Delta Web Map server will not delete any content from your game server.</dbox>
            <p>You may also consider disabling your server instead if you wish to temporarily restrict access to it. Disabling your server will allow you to restore it at any time, while removing it is a permanent action. Removing your server cannot be undone, even by support.</p>
            <dbox class="dbox_alert">You must remove the Delta Web Map mod from your server before removing it. If you don't, your server will be added again the next time your ARK server reboots.</dbox>
            <p>To confirm, type the name of your server into the box below. Then, press the remove button.</p>
            <input type="text" placeholder="Confirm" /> <dbtn>Remove</dbtn>
        </div>
    </div>
    <script src="/assets/servers/manage/manage.js"></script>
    <script>Init();</script>
</body>
</html>
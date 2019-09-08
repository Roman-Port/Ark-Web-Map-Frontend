<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Delete Account</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
    </head>
    <body>
        <?php include "/var/www/delta/site_assets/header.php"; ?>
        <div class="main_content_fit main_content">
            <div class="status_warning" id="warning_bar" style="display:none;"></div>
            <div id="main" style="display:none;">
                <h1>Delete Account</h1>
                <p>Removing your account <b>cannot be undone, even by support</b>. If you are sure you would like to delete your account, please type your account name, <b id="p_username"></b>, into the box below.</p>
                <input type="text" placeholder="Account Name" oninput="ChangeText(this.value);"> <a href="javascript:ConfirmDelete();" id="confirm_delete" style="font-size:13px; display:none;">Confirm Account Removal</a>
                <box_info>Removing your account will <b>not</b> delete data you enter into ARK servers, as some of this content cannot be accessed now. If you wish to delete this data, contact your server owner.</box_info>
                <box_warning>Removing your account <b>cannot be undone, even by support</b>. You will not be able to recover any data you enter. Removing your account will <b>not</b> affect gameplay.</box_warning>
            </div>
        </div>
        <script src="/assets/frontpage/me/me.js"></script>
        <script>
            var target_name = null;
            var is_working = false;

            function Init() {
                delta.getUserAsync(function(d) {
                    //Set all vars
                    document.getElementById('p_username').innerText = d.screen_name;
                    target_name = d.screen_name;

                    //Show
                    document.getElementById('main').style.display = "block";
                }, me.getUserError);
            }

            function ChangeText(c) {
                var e = document.getElementById('confirm_delete');
                if(c == target_name) {
                    e.style.display = "inline";
                } else {
                    e.style.display = "none";
                }
            }

            function ConfirmDelete() {
                if(is_working) {
                    return;
                }

                me.setStatusBar("Thank you. Removing account, please wait...");
                document.getElementById('main').style.display = "none";
                delta.serverRequest("https://deltamap.net/api/users/@me/delete?chal_name="+encodeURIComponent(target_name), {"failOverride":me.serverError, "type":"DELETE"}, function(d) {
                    me.setStatusBar("Account removed. Thank you for using DeltaWebMap.");
                    window.setInterval(function() {
                        window.location = "/";
                    }, 4000);
                });
            }

            Init();
        </script>
    </body>
</html>
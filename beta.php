<!DOCTYPE html>
<html>
<head>
    <title>Welcome to Delta Web Map</title>
    <?php include "/var/www/delta/site_assets/head.php"; ?>
    <link rel="stylesheet" href="/assets/frontpage/landing/landing.css">
</head>
<body>
    <div class="landing_blue_top">
        <div class="landing_top_title">
            <div class="landing_top_title_big">MANAGE YOUR ARK TRIBE</div>
            <div class="landing_top_title_sub">Delta Web Map is a PVP-safe tool to manage your ARK: Survival Evolved tribe on servers- right from your web browser.</div>
        </div>
        <div class="landing_top_btn_container">
            <div class="landing_top_btn landing_top_btn_full" onclick="OnClickStartBtn();">Get Started</div>
            <div class="landing_top_btn" onclick="window.location = '/app/#dwm-demo-frontpage-src';">View Demo</div>
        </div>
    </div>
    <div class="landing_top_img_container">
        <img src="/assets/frontpage/landing/img/big.png" class="landing_top_img">
        <div class="landing_top_img_container_bg"></div>
    </div>
    <div class="landing_mid">
        <div class="landing_mid_title_big"><b>Powerful</b>, <b>Secure</b>, and <b>Easy</b></div>
        <div class="landing_mid_title_sub">Delta Web Map runs on your server and ensures your members only see <i>their</i> data.</div>
    </div>
    <div class="landing_mid_feature_area">
        <div class="landing_mid_feature">
            <img src="/assets/frontpage/landing/img/feature_map.png" class="landing_mid_feature_img">
            <div class="landing_mid_feature_title">Real-Time Dinosaur and Structure Management</div>
            <div class="landing_mid_feature_sub">Watch changes to your tribe in real-time. View structures and dinosaur inventories.</div>
        </div>
        <div class="landing_mid_feature">
            <img src="/assets/frontpage/landing/img/feature_stats.png" class="landing_mid_feature_img">
            <div class="landing_mid_feature_title">View, Sort, and Track Dinosaur Stats</div>
            <div class="landing_mid_feature_sub">Monitor in-depth stats that you can't view in-game.</div>
        </div>
        <div class="landing_mid_feature">
            <img src="/assets/frontpage/landing/img/feature_notifications.png" class="landing_mid_feature_img">
            <div class="landing_mid_feature_title">Get Mobile Push Notifications</div>
            <div class="landing_mid_feature_sub">Always keep an eye on your tribe with instant notifications sent to your smartphone.</div>
        </div>
    </div>
    <div class="landing_mid_footer">
        <div class="landing_mid_title_sub_header">Not your traditional ARK tool</div>
        <div class="landing_mid_title_sub_footer">Delta Web Map reads your ARK save file directly and keeps everything up to date for you- all to deliver everything in real time.</div>
    </div>
    <div class="landing_mid landing_feature_list_top">
        <div class="landing_mid_title_big">Still not Convinced?</div>
        <div class="landing_mid_title_sub">Maybe a big list of features can help.</div>
    </div>
    <div class="landing_feature_list">
        <ul>
            <li>Mod support</li>
            <li>Global inventory search</li>
            <li>Baby dinosaur notifications</li>
            <li>Support for official maps</li>
            <li>Tribe communication</li>
            <li>Cluster support</li>
            <li>No game mods needed</li>
            <li>Ark Smart Breeding export</li>
        </ul>
        <ul class="landing_feature_list_right">
            <li>Drawable maps</li>
            <li>Baby dinosaur monitoring</li>
            <li>Provider APIs</li>
            <li>Tribe dino search</li>
            <li>Transparent</li>
            <li>Dinosaur stats</li>
            <li>Easy to use</li>
            <li>Smartphone app</li>
        </ul>
    </div>
    <div class="landing_mid_title_sub" style="text-align: center; margin-bottom: 120px; margin-top: 60px;">...and lastly, it's <b>free forever</b>.</div>

    <!-- Welcome box -->
    <table class="welcome_popup_container">
        <tbody>
            <tr>
                <td style="text-align: center;vertical-align: middle;">
                    <div class="welcome_popup">
                        <div class="welcome_popup_header">Let's Get Started</div>
                        <div class="welcome_popup_box welcome_popup_box_inverted welcome_popup_option_add">
                            <div class="welcome_popup_box_title">Add</div>
                            <div class="welcome_popup_box_description">Add your ARK server to enjoy Delta Web Map with you and your members.</div>
                            <div class="welcome_popup_box_cutout"></div>
                            <div class="welcome_popup_box_btn">Add your Server</div>
                        </div>
                        <div class="welcome_popup_box welcome_popup_option_join">
                            <div class="welcome_popup_box_title">Join</div>
                            <div class="welcome_popup_box_description">Join an ARK server that uses Delta Web Map already.</div>
                            <div class="welcome_popup_box_cutout"></div>
                            <div class="welcome_popup_box_btn">Join a Server</div>
                        </div>
                        <div class="welcome_popup_box_cutout_text">or</div>
                        <div class="welcome_popup_footer">Already a Delta Web Map user? <a href="/login/">Sign in</a>. Service provider? <a href="/providers/">We'd love to get in touch</a>.</div>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
    <script src="/assets/frontpage/landing/landing.js"></script>
</body>
</html>
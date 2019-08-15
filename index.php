<!DOCTYPE html>
<html>
<head>
    <title>Welcome to Delta Web Map</title>
    <?php include "/var/www/delta/site_assets/head.php"; ?>
    <link rel="stylesheet" href="/assets/frontpage/frontpage.css">
    <script src="/assets/frontpage/status.js"></script>
</head>
<body>
    <div class="frontpage_content">
        <div class="frontpage_content_scroll">
            <?php include "/var/www/delta/site_assets/header.php"; ?>
            <div class="frontpage_top">
                <div class="frontpage_top_area">
                    <table style="width: 100%; height:100%;">
                        <tr>
                            <td style="text-align: center; vertical-align: middle;">
                                <div class="frontpage_top_header">MANAGE YOUR ARK TRIBE</div>
                                <div class="frontpage_top_footer">Delta Web Map is a PVP-safe tool to view your ARK: Survival Evolved tribe on your PC servers.</div>
                                <div class="frontpage_top_btn_area">
                                    <div class="frontpage_top_blue_btn">FOR SERVER OWNERS</div>
                                    <div class="frontpage_top_blue_btn frontpage_top_white_btn">FOR PLAYERS</div>
                                    <div class="frontpage_top_small_btn">Server provider? Let's get in touch <a href="/providers">here</a>.</div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="browser" id="browser">
                    <div class="browser_tab">
                        <div class="browser_tab_rcover">
                            <div class="c" style="border-bottom-right-radius: 8px;"></div>
                        </div>
                        
                        <div class="browser_tab_rcover" style="left:unset; right:-15px; top:0;">
                            <div class="c" style="border-bottom-left-radius: 8px;"></div>
                        </div>
                    </div>
                    <div class="browser_nav">
                        <div class="browser_nav_placeholder" style="margin-left:9px;"></div>
                        <div class="browser_nav_placeholder"></div>
                        <div class="browser_nav_placeholder"></div>
                        <div class="browser_nav_bar"></div>
                    </div>
                    <div class="browser_content">
                        <iframe class="browser_iframe" src="https://deltamap.net/app/#dwm-demo-frontpage-src"></iframe>
                    </div>
                </div>
                <script>
                    document.getElementById('browser').addEventListener("mousedown", function() {
                        console.log("[Demo] Activating demo...");
                        document.getElementsByClassName('browser_content')[0].style.pointerEvents = "all";
                    });
                </script>
            </div>
        </div>
    </div>
</body>
</html>
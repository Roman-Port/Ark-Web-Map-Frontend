<!DOCTYPE html>
<html>
    <head>
        <title>Delta Web Map / Set up Server</title>
        <?php include "/var/www/delta/site_assets/head.php"; ?>
        <link href="/assets/frontpage/me/servers/create_v2/main.css" rel="stylesheet">
    </head>
    <body>
        <?php include "/var/www/delta/site_assets/header.php"; ?>
        <div class="main_content_fit main_content" style="margin-top:40px;">
            <div id="main">
                
            </div>
        </div>

        <!-- TODO:
        
        * Icon image upload
        * After form

        -->

        <!-- Templates -->
        <template id="slide_intro">
            <div>
                <h1>Let's Get Started</h1>
                <h2>To get started, choose the platform this server is using.</h2> 
                <div class="select_item_binder">
                    <div class="select_btn" onclick="app.ShowSlide('choose_map', null, false);">Steam</div>
                    <div class="select_btn" onclick="app.ShowSlide('unsupported_platform', null, false);">Other</div>
                </div>
            </div>
        </template>

        <!-- Template for platforms that aren't supported -->
        <template id="slide_err_unsupported_platform">
            <div>
                <h1>Sorry, Unsupported Platform</h1>
                <h2>This is an unsupported platform due to restrictions put into place by consoles. Check back later.</h2> 
                <div class="select_item_binder">
                    <div class="select_btn" onclick="app.ShowSlide('intro', null, false);">Back</div>
                </div>
            </div>
        </template>

        <!-- Template for prompting the user to pick a map -->
        <template id="slide_choose_map">
            <div>
                <h1>Choose Map</h1>
                <h2>Pick a map to use on this server. If it isn't listed, it's not supported at this time.</h2> 
                <div class="select_item_binder">
                    <div class="select_btn" onclick="app.OnPickMap('TheIsland');">The Island</div>
                    <div class="select_btn" onclick="app.OnPickMap('TheCenter');">The Center</div>
                    <div class="select_btn" onclick="app.OnPickMap('ScorchedEarth');">Scorched Earth</div>
                    <div class="select_btn" onclick="app.OnPickMap('Ragnarok');">Ragnarok</div>
                    <div class="select_btn" onclick="app.OnPickMap('Aberration');">Aberration</div>
                    <div class="select_btn" onclick="app.OnPickMap('Extinction');">Extinction</div>
                    <div class="select_btn" onclick="app.OnPickMap('Valguero');">Valguero</div>
                </div>
            </div>
        </template>

        <!-- Template for Steam -->
        <template id="slide_choose_hosting">
            <div>
                <h1>Choose Hosting</h1>
                <h2>Select your hosting setup. If you're unsure, choose a provider.</h2> 
                <div class="select_item_binder">
                    <div class="select_item_container">
                        <div class="select_item" onclick="app.PromptLoginReturn('self_setup');">
                            <div class="select_item_title">Self-Hosting</div>
                            <p style="margin-top: 0;">Choose this option if you host the server yourself by running a ShooterGameServer.exe file. You likely needed to forward your ports for this setup.</p><p>This setup requires you to download a small client program that reads your ARK save file.</p>
                            <div class="select_item_btn">Select</div>
                        </div>
                    </div>
                    <div class="select_item_container">
                        <div class="select_item" onclick="app.PromptLoginReturn('hosting_provider_unsupported');">
                            <div class="select_item_title">Provider Hosted</div>
                            <p style="margin-top: 0;">Choose this option if you're using a remote provider to host your server. This is the most common option.</p><p>This setup requires you to provide FTP credentials so we can download the ARK save file.</p>
                            <div class="select_item_btn">Select</div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Template for hosting that aren't supported -->
        <template id="slide_err_unsupported_hosting">
            <div>
                <h1>Sorry, We're Not Ready Yet</h1>
                <h2>Provider hosting isn't quite ready yet. It will be soon. Check back shortly!</h2> 
                <div class="select_item_binder">
                    <div class="select_btn" onclick="app.ShowSlide('hosting_provider', null, false);">Back</div>
                </div>
            </div>
        </template>

        <!-- Template for prompting the user to log in after verifying that the server works -->
        <template id="slide_prompt_login">
            <div>
                <h1>Your Server is Compatible!</h1>
                <h2>We just need you to sign in to continue setup. By signing in, you agree to our <a href="/privacy/">Privacy Policy</a>.</h2> 
                <div class="select_item_binder">
                    <div class="select_btn" onclick="app.DoLoginReturn(document.x_temp_return_slide);">Sign in With Steam</div>
                </div>
            </div>
        </template>

        <!-- Template for setting up a machine for self hosting -->
        <template id="slide_self_setup">
            <div>
                <h1>Downloading Client Software</h1>
                <h2>Setting up a self hosted server requires you to download a small setup program. This program simply reads and syncs your ARK save files. We're <a href="https://github.com/deltawebmap" target="_blank">open source</a> too.</h2>
                <h2>This screen will automatically change when you extract and run the program.</h2> 
                <div class="select_item_binder">
                    <div class="select_btn" onclick="app.DoLoginReturn(document.x_temp_return_slide);">Download Windows (x64)</div>
                    <div class="select_btn" onclick="app.DoLoginReturn(document.x_temp_return_slide);">Download Linux</div>
                </div>
                <h2>These download links and files are unique to you and should not be shared with others.</h2>
            </div>
        </template>

        <!-- Generic file picker -->
        <template id="slide_filepicker">
            <div>
                <h1 class="s_title"></h1>
                <h2 class="s_sub"></h2> 
                <div class="filepicker_box">
                    <div class="filepicker_sidebar">
                        <div class="filepicker_drive_select"></div>
                        <div class="filepicker_confirm_btn" onclick="app.filepicker.OnHitAcceptBtn();">Incorrect Folder</div>
                    </div>
                    <div class="filepicker_dir">
                        <div class="filepicker_dir_up" onclick="app.filepicker.GoUp();"></div>
                        <input type="text" class="filepicker_dir_input" onchange="app.filepicker.GoToDir(this.value);">
                    </div>
                    <div class="filepicker_content">
                    
                    </div>
                </div>
            </div>
        </template>

        <!-- Template for naming the server -->
        <template id="slide_self_finish">
            <div>
                <h1>Almost Ready!</h1>
                <h2>Your server is almost ready. To finish up, give your server a name.</h2>
                <div class="final_card_body">
                    <div class="final_card_name_box">
                        <div class="final_card_bold" style="margin-left:2px;">Server Name<span class="filepicker_text_err"> 2-24 Characters</span></div>
                        <input type="text" class="final_card_name_input">
                    </div>
                    <div class="final_card_cluster_box">
                        <div class="final_card_bold" style="margin-left:2px;">Cluster</div>
                        <select class="final_card_cluster_option">
                            <option>No Cluster</option>
                        </select>
                    </div>
                    <div class="final_card_icon">Add Icon</div>
                    <div class="final_card_submit">Finish</div>
                </div>
            </div>
        </template>
    </body>
    <script src="https://romanport.com/static/lib/lib_usercontent.js"></script>
    <script src="/assets/frontpage/me/servers/create_v2/main.js"></script>
    <script>app.Boot();</script>
</html>